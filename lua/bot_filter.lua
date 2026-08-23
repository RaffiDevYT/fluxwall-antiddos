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
}

-- Checks if incoming request is from a known vulnerability scanner or bad bot
-- Returns: is_threat (bool), reason (string)
function _M.check_request()
    local headers = ngx.req.get_headers()
    local user_agent = headers["user-agent"] or ""
    local uri = ngx.var.uri or "/"
    local lower_ua = string.lower(user_agent)

    -- 1. Check for completely missing or suspiciously short User-Agent
    if user_agent == "" or #user_agent < 4 then
        return true, "EMPTY_OR_INVALID_USER_AGENT"
    end

    -- 2. Match User-Agent against bad bot & scanner patterns
    if config.bad_bots then
        for _, bot_pattern in ipairs(config.bad_bots) do
            if string.find(lower_ua, bot_pattern) then
                return true, "BAD_BOT_DETECTED: " .. bot_pattern
            end
        end
    end

    -- 3. Check for obvious exploit / probe paths
    local lower_uri = string.lower(uri)
    for _, pattern in ipairs(suspicious_paths) do
        if string.find(lower_uri, pattern) then
            return true, "EXPLOIT_PATH_PROBE: " .. pattern
        end
    end

    return false, nil
end

return _M
