local config = require "config"

local _M = {}

-- Probe paths commonly requested by automated exploit scanners
local suspicious_paths = {
    "%.env$",
    "%.git",
    "wp%-config%.php",
    "phpmyadmin",
    "cgi%-bin",
    "/shell%.php",
    "/actuator/health",
    "/server%-status",
    "/console/",
    "/vendor/phpunit",
    "/solr/",
    "/.aws/",
    "/.docker/",
}

-- High-confidence SQLi / XSS / RCE / Path Traversal regex patterns
local exploit_patterns = {
    -- SQL Injection
    "union[%s+%%20]+select",
    "select[%s+%%20]+.*[%s+%%20]+from",
    "information_schema",
    "benchmark%s*%([%d%s,]+%)",
    "pg_sleep%s*%([%d%s]+%)",
    "waitfor[%s+%%20]+delay",
    "or[%s+%%20]+1%s*=%s*1",
    "or[%s+%%20]+'1'%s*=%s*'1'",
    ";[%s+%%20]*drop[%s+%%20]+table",

    -- Cross-Site Scripting (XSS)
    "<script",
    "</script>",
    "javascript:[^%s]*",
    "onerror%s*=",
    "onload%s*=",
    "document%.cookie",
    "<iframe",
    "<svg/onload",

    -- Path Traversal / LFI
    "%.%.[/\\].*%.%.[/\\]",
    "/etc/passwd",
    "/etc/shadow",
    "/windows/win%.ini",
    "boot%.ini",
    "php://filter",
    "php://input",
    "data:text/html",

    -- Remote Code Execution (RCE)
    "eval%s*%([%s%S]*%)",
    "base64_decode%s*%(",
    "system%s*%([%s%S]*%)",
    "passthru%s*%(",
    "shell_exec%s*%(",
    "/bin/sh",
    "/bin/bash",
    "cmd%.exe",
}

-- Checks Range headers to mitigate Slowloris / Apache Killer Range Floods
function _M.check_range_header()
    local range = ngx.req.get_headers()["range"]
    if not range then
        return false, nil
    end

    -- Count number of comma-separated ranges (abusive Range attack often has > 5 ranges)
    local _, count = range:gsub(",", "")
    if count >= 5 then
        return true, "ABUSIVE_RANGE_HEADER_ATTACK (Too many ranges)"
    end

    -- Detect excessively long range header
    if #range > 200 then
        return true, "ABUSIVE_RANGE_HEADER_ATTACK (Header too long)"
    end

    return false, nil
end

-- Checks if incoming request is from a known vulnerability scanner or bad bot
-- Returns: is_threat (bool), reason (string)
function _M.check_request()
    local headers = ngx.req.get_headers()
    local user_agent = headers["user-agent"] or ""
    local uri = ngx.var.uri or "/"
    local query = ngx.var.query_string or ""
    local unescaped_uri = ngx.unescape_uri(uri .. "?" .. query)
    local lower_target = string.lower(unescaped_uri)
    local lower_ua = string.lower(user_agent)

    -- 1. Check Range header for Slowloris / Range Bomb attacks
    local is_range_attack, range_reason = _M.check_range_header()
    if is_range_attack then
        return true, range_reason
    end

    -- 2. Check for completely missing or suspiciously short User-Agent
    if user_agent == "" or #user_agent < 4 then
        return true, "EMPTY_OR_INVALID_USER_AGENT"
    end

    -- 3. Match User-Agent against bad bot & scanner patterns
    if config.bad_bots then
        for _, bot_pattern in ipairs(config.bad_bots) do
            if string.find(lower_ua, bot_pattern) then
                return true, "BAD_BOT_DETECTED: " .. bot_pattern
            end
        end
    end

    -- 4. Check for obvious exploit / probe paths
    for _, pattern in ipairs(suspicious_paths) do
        if string.find(lower_target, pattern) then
            return true, "EXPLOIT_PATH_PROBE: " .. pattern
        end
    end

    -- 5. Inspect Query String and URI for SQLi / XSS / RCE / LFI payloads
    for _, pattern in ipairs(exploit_patterns) do
        if ngx.re.find(lower_target, pattern, "ijo") then
            return true, "WAF_EXPLOIT_PAYLOAD_DETECTED: " .. pattern
        end
    end

    return false, nil
end

-- 6. Dynamic Custom WAF Rules Evaluator from Redis
function _M.check_custom_rules(red)
    if not red then
        return false, nil, nil
    end

    local rules_json, err = red:get("waf:custom_rules")
    if not rules_json or rules_json == ngx.null then
        return false, nil, nil
    end

    local cjson = require "cjson.safe"
    local rules = cjson.decode(rules_json)
    if not rules or type(rules) ~= "table" then
        return false, nil, nil
    end

    local headers = ngx.req.get_headers()
    local uri = ngx.var.uri or "/"
    local query = ngx.var.query_string or ""
    local user_agent = headers["user-agent"] or ""

    for _, rule in ipairs(rules) do
        if rule.enabled then
            local target_val = ""
            if rule.field == "uri" then
                target_val = uri
            elseif rule.field == "user_agent" then
                target_val = user_agent
            elseif rule.field == "query" then
                target_val = query
            end

            local lower_target_val = string.lower(target_val)
            local lower_pattern = string.lower(rule.value or "")
            local is_matched = false

            if rule.operator == "contains" then
                if string.find(lower_target_val, lower_pattern, 1, true) then
                    is_matched = true
                end
            elseif rule.operator == "equals" then
                if lower_target_val == lower_pattern then
                    is_matched = true
                end
            elseif rule.operator == "regex" then
                if ngx.re.find(lower_target_val, rule.value, "ijo") then
                    is_matched = true
                end
            end

            if is_matched then
                return true, "CUSTOM_WAF_RULE: " .. (rule.name or "Unnamed"), rule.action or "DROP"
            end
        end
    end

    return false, nil, nil
end

return _M

