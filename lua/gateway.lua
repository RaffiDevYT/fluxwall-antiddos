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
local redis_pool = require "redis_pool"
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

-- 3b. Step: IDS Canary Honeypot Trap Decoy Check (Instant 24h Ban)
local canary_triggered = false
redis_pool.exec(function(red)
    local is_canary, trap_name = bot_filter.check_canary_trap(red)
    if is_canary then
        canary_triggered = true
        red:setex("blacklist:" .. client_ip, 86400, "IDS_CANARY_TRAP: " .. trap_name)
        red:incr("fluxwall:stats:threats_total")

        logger.log_event("IDS_CANARY_TRAP", {
            client_ip = client_ip,
            uri = uri,
            severity = "CRITICAL",
            reason = "IDS [CANARY_TRAP_ENDPOINT] matched: " .. trap_name,
            action = "IP_BANNED"
        })
    end
end)

if canary_triggered then
    ngx.status = ngx.HTTP_FORBIDDEN
    ngx.header["Content-Type"] = "application/json; charset=utf-8"
    ngx.header["X-Gateway-Protection"] = "canary-trap-banned"
    
    local resp = {
        incident = "#" .. tostring(math.random(1000, 9999)),
        severity = "CRITICAL",
        type = "IDS CANARY TRAP",
        action = "IP_BANNED",
        attacker_ip = client_ip,
        request_uri = uri,
        payload_match = "IDS [CANARY_TRAP_ENDPOINT] matched: Honeypot Decoy Probe Trap"
    }
    ngx.say(cjson.encode(resp))
    return ngx.exit(ngx.HTTP_FORBIDDEN)
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

-- 4b. Step: Dynamic Custom WAF Rules Check
local custom_blocked = false
redis_pool.exec(function(red)
    local is_custom_threat, custom_reason, custom_action = bot_filter.check_custom_rules(red)
    if is_custom_threat and custom_action == "DROP" then
        custom_blocked = true
        metrics.inc("gateway_blocked_requests_total", { reason = "custom_waf" })
        metrics.inc("gateway_http_requests_total", { status = "403", protection = "custom_waf", method = method })

        logger.log_event("CUSTOM_WAF_BLOCKED", {
            client_ip = client_ip,
            uri = uri,
            reason = custom_reason
        })
    end
end)

if custom_blocked then
    ngx.status = ngx.HTTP_FORBIDDEN
    ngx.header["Content-Type"] = "application/json; charset=utf-8"
    ngx.header["X-Gateway-Protection"] = "custom-waf"
    local resp = {
        error = "Forbidden",
        message = "Custom WAF Security Rule Triggered",
        client_ip = client_ip,
        timestamp = ngx.time()
    }
    ngx.say(cjson.encode(resp))
    return ngx.exit(ngx.HTTP_FORBIDDEN)
end

-- 5. Step: Blacklist Check
if blacklist.is_blacklisted(client_ip) then
    metrics.inc("gateway_blocked_requests_total", { reason = "blacklisted" })
    metrics.inc("gateway_http_requests_total", { status = "403", protection = "blacklisted", method = method })

    ngx.status = ngx.HTTP_FORBIDDEN
    ngx.header["Content-Type"] = "application/json; charset=utf-8"
    ngx.header["X-Gateway-Protection"] = "blacklisted"
    
    local resp = {
        error = "Forbidden",
        message = "Your IP address is permanently blocked.",
        client_ip = client_ip,
        timestamp = ngx.time()
    }
    ngx.say(cjson.encode(resp))
    return ngx.exit(ngx.HTTP_FORBIDDEN)
end

-- 6. Step: Temporary Ban / Quarantine Check
local is_banned, remaining_ttl = auto_ban.is_banned(client_ip)
if is_banned then
    metrics.inc("gateway_blocked_requests_total", { reason = "banned" })
    metrics.inc("gateway_http_requests_total", { status = "403", protection = "quarantined", method = method })

    ngx.status = ngx.HTTP_FORBIDDEN
    ngx.header["Content-Type"] = "application/json; charset=utf-8"
    ngx.header["X-Gateway-Protection"] = "quarantined"
    ngx.header["Retry-After"] = tostring(remaining_ttl)
    
    local resp = {
        error = "Forbidden",
        message = "Your IP has been quarantined due to excessive requests.",
        client_ip = client_ip,
        remaining_ban_seconds = remaining_ttl,
        timestamp = ngx.time()
    }
    ngx.say(cjson.encode(resp))
    return ngx.exit(ngx.HTTP_FORBIDDEN)
end

-- 7. Step: GeoIP & ASN Datacenter / Cloud Proxy Check
local is_geo_blocked, country_code, is_datacenter = geoip.check_ip(client_ip)
if is_geo_blocked then
    metrics.inc("gateway_blocked_requests_total", { reason = "geo_blocked" })
    metrics.inc("gateway_http_requests_total", { status = "403", protection = "geo_blocked", method = method })

    logger.log_event("GEO_IP_BLOCKED", {
        client_ip = client_ip,
        uri = uri,
        reason = "Country " .. tostring(country_code) .. " or Datacenter Proxy Blocked"
    })

    ngx.status = ngx.HTTP_FORBIDDEN
    ngx.header["Content-Type"] = "application/json; charset=utf-8"
    ngx.header["X-Gateway-Protection"] = "geo-blocked"
    
    local resp = {
        error = "Forbidden",
        message = "Access restricted from your geographic region or datacenter proxy.",
        country = country_code,
        client_ip = client_ip,
        timestamp = ngx.time()
    }
    ngx.say(cjson.encode(resp))
    return ngx.exit(ngx.HTTP_FORBIDDEN)
end

-- 8. Step: Global "Under Attack Mode" JavaScript PoW Challenge
local under_attack = challenge.is_under_attack_mode()
if under_attack then
    local passed = challenge.verify_pow_cookie(client_ip)
    if not passed then
        challenge.serve_pow_challenge_page(client_ip)
        return -- Response served directly by challenge module
    end
end

-- 9. Step: Sliding Window Rate Limiting with Dynamic Burst
local allowed, count = rate_limiter.check_rate_limit(client_ip, scale_factor)
if not allowed then
    metrics.inc("gateway_rate_limited_total", { client_ip = client_ip })
    metrics.inc("gateway_http_requests_total", { status = "429", protection = "rate_limited", method = method })

    local strike_count = auto_ban.record_strike(client_ip)
    logger.log_event("RATE_LIMIT_EXCEEDED", {
        client_ip = client_ip,
        uri = uri,
        reason = string.format("Rate exceeded (current count: %d, strikes: %d)", count, strike_count)
    })

    ngx.status = ngx.HTTP_TOO_MANY_REQUESTS
    ngx.header["Content-Type"] = "application/json; charset=utf-8"
    ngx.header["X-Gateway-Protection"] = "rate-limited"
    ngx.header["Retry-After"] = "60"
    
    local resp = {
        error = "Too Many Requests",
        message = "Rate limit exceeded. Please slow down your requests.",
        client_ip = client_ip,
        current_strikes = strike_count,
        timestamp = ngx.time()
    }
    ngx.say(cjson.encode(resp))
    return ngx.exit(ngx.HTTP_TOO_MANY_REQUESTS)
end

-- 10. Request Passes All Protection Layers
metrics.inc("gateway_http_requests_total", { status = "200", protection = "inspected_pass", method = method })
ngx.header["X-Gateway-Protection"] = "inspected-pass"
