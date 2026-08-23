local ip_extractor = require "ip_extractor"
local whitelist = require "whitelist"
local blacklist = require "blacklist"
local rate_limiter = require "rate_limiter"
local auto_ban = require "auto_ban"
local bot_filter = require "bot_filter"
local surge_protector = require "surge_protector"
local geoip = require "geoip"
local challenge = require "challenge"
local metrics = require "metrics"
local logger = require "logger"
local config = require "config"
local cjson = require "cjson.safe"

-- 1. Extract Real Client IP & Request Metadata
local client_ip = ip_extractor.get_client_ip()
local uri = ngx.var.uri or "/"
local method = ngx.req.get_method()

-- Expose extracted client IP to downstream / logging
ngx.var.http_x_real_ip = client_ip

-- 2. Track global QPS for Surge Protector & Prometheus
local is_surge, scale_factor, global_qps = surge_protector.track_request()

-- 3. Step: IP Whitelist Check (Instant Fast-Bypass)
if whitelist.is_whitelisted(client_ip) then
    metrics.inc("gateway_http_requests_total", { status = "200", protection = "whitelisted", method = method })
    ngx.header["X-Gateway-Protection"] = "whitelisted"
    return -- Instantly allow request through
end

-- 4. Step: Bad Bot, Scanner & Exploit Filter
local is_bad_bot, bot_reason = bot_filter.check_request()
if is_bad_bot then
    metrics.inc("gateway_blocked_requests_total", { reason = "bad_bot" })
    metrics.inc("gateway_http_requests_total", { status = "403", protection = "bot_blocked", method = method })

    logger.log_event("BAD_BOT_BLOCKED", {
        client_ip = client_ip,
        uri = uri,
        reason = bot_reason
    })

    ngx.status = ngx.HTTP_FORBIDDEN
    ngx.header["Content-Type"] = "application/json; charset=utf-8"
    ngx.header["X-Gateway-Protection"] = "bot-filter"
    
    local resp = {
        error = "Forbidden",
        message = "Automated scanner or malicious user-agent pattern detected.",
        client_ip = client_ip,
        reason = bot_reason,
        timestamp = ngx.time()
    }
    ngx.say(cjson.encode(resp))
    return ngx.exit(ngx.HTTP_FORBIDDEN)
end

-- 5. Step: GeoIP Country Filtering
local geo_allowed, country_code, geo_reason = geoip.check_country(client_ip)
if not geo_allowed then
    metrics.inc("gateway_blocked_requests_total", { reason = "geo_blocked" })
    metrics.inc("gateway_http_requests_total", { status = "403", protection = "geo_blocked", method = method })

    logger.log_event("GEO_BLOCKED", {
        client_ip = client_ip,
        uri = uri,
        reason = geo_reason,
        meta = { country = country_code }
    })

    ngx.status = ngx.HTTP_FORBIDDEN
    ngx.header["Content-Type"] = "application/json; charset=utf-8"
    ngx.header["X-Gateway-Protection"] = "geo-block"
    
    local resp = {
        error = "Forbidden",
        message = "Access from your geographic region is restricted.",
        client_ip = client_ip,
        country = country_code,
        reason = geo_reason,
        timestamp = ngx.time()
    }
    ngx.say(cjson.encode(resp))
    return ngx.exit(ngx.HTTP_FORBIDDEN)
end

-- 6. Step: IP Blacklist & Temporary Ban Check
local is_blocked, block_reason, remaining_ttl = blacklist.is_blacklisted(client_ip)
if is_blocked then
    metrics.inc("gateway_blocked_requests_total", { reason = "blacklisted" })
    metrics.inc("gateway_http_requests_total", { status = "403", protection = "blacklisted", method = method })

    logger.log_event("REQUEST_BLOCKED", {
        client_ip = client_ip,
        uri = uri,
        reason = block_reason,
        meta = { remaining_ttl = remaining_ttl }
    })

    ngx.status = ngx.HTTP_FORBIDDEN
    ngx.header["Content-Type"] = "application/json; charset=utf-8"
    ngx.header["X-Gateway-Protection"] = "blacklisted"
    if remaining_ttl and remaining_ttl > 0 then
        ngx.header["Retry-After"] = tostring(remaining_ttl)
    end

    local resp = {
        error = "Forbidden",
        message = "Your IP address has been blocked due to suspicious activity or security policy violation.",
        client_ip = client_ip,
        reason = block_reason,
        retry_after_seconds = remaining_ttl > 0 and remaining_ttl or nil,
        timestamp = ngx.time()
    }
    ngx.say(cjson.encode(resp))
    return ngx.exit(ngx.HTTP_FORBIDDEN)
end

-- 7. Step: JavaScript Proof-of-Work (PoW) Challenge / Under Attack Mode
local should_challenge = (config.challenge and config.challenge.enabled) or 
                         (config.challenge and config.challenge.auto_trigger_on_surge and is_surge)

if should_challenge and not challenge.has_valid_token(client_ip) then
    -- Only challenge HTML/page navigation requests, not AJAX API calls
    local accept_header = ngx.req.get_headers()["accept"] or ""
    if accept_header:find("text/html") or accept_header == "*/*" or accept_header == "" then
        return challenge.serve_challenge(client_ip, uri)
    end
end

-- 8. Step: Dynamic Rate Limit Check (with Surge Mode awareness)
local allowed, current_reqs, max_limit, retry_after, rule_name, surge_active = rate_limiter.check(client_ip, uri, method)

-- Provide standard rate limiting & surge indicators
local remaining = math.max(0, max_limit - current_reqs)
ngx.header["X-RateLimit-Limit"] = tostring(max_limit)
ngx.header["X-RateLimit-Remaining"] = tostring(remaining)
ngx.header["X-RateLimit-Rule"] = rule_name
ngx.header["X-Country-Code"] = country_code
if surge_active then
    ngx.header["X-Gateway-Surge-Mode"] = "active"
end

if not allowed then
    -- Record violation and check if auto-ban threshold is reached
    local is_banned, total_violations = auto_ban.record_violation(client_ip, uri)

    metrics.inc("gateway_blocked_requests_total", { reason = "rate_limited" })
    metrics.inc("gateway_http_requests_total", { status = "503", protection = is_banned and "auto-banned" or "rate-limited", method = method })

    logger.log_event("RATE_LIMIT_EXCEEDED", {
        client_ip = client_ip,
        uri = uri,
        reason = "RATE_LIMIT_EXCEEDED",
        meta = {
            current = current_reqs,
            limit = max_limit,
            rule = rule_name,
            total_violations = total_violations,
            auto_banned = is_banned,
            surge_mode = surge_active
        }
    })

    ngx.status = ngx.HTTP_SERVICE_UNAVAILABLE
    ngx.header["Content-Type"] = "application/json; charset=utf-8"
    ngx.header["Retry-After"] = tostring(retry_after)
    ngx.header["X-Gateway-Protection"] = is_banned and "auto-banned" or "rate-limited"

    local resp = {
        error = "Too Many Requests / Service Unavailable",
        message = "Rate limit threshold exceeded. Please slow down your requests.",
        client_ip = client_ip,
        rule = rule_name,
        limit = max_limit,
        retry_after_seconds = retry_after,
        auto_banned = is_banned,
        surge_defense_active = surge_active,
        timestamp = ngx.time()
    }
    ngx.say(cjson.encode(resp))
    return ngx.exit(ngx.HTTP_SERVICE_UNAVAILABLE)
end

-- 9. Request is permitted to pass
metrics.inc("gateway_http_requests_total", { status = "200", protection = "inspected-pass", method = method })
ngx.header["X-Gateway-Protection"] = "inspected-pass"
