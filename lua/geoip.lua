local config = require "config"
local redis_pool = require "redis_pool"
local cjson = require "cjson.safe"

local _M = {}
local ip_cache = ngx.shared.ip_cache

-- Known datacenter / cloud hosting keywords for bot / proxy detection
local datacenter_keywords = {
    "amazon", "aws", "digitalocean", "hetzner", "ovh", "linode",
    "google cloud", "google llc", "microsoft", "azure", "alibaba",
    "vultr", "choopa", "leaseweb", "m247", "contabo"
}

-- Checks if an ASN org name matches a datacenter / VPS provider
local function is_datacenter_org(org)
    if not org then return false end
    local lower_org = string.lower(org)
    for _, kw in ipairs(datacenter_keywords) do
        if string.find(lower_org, kw) then
            return true, kw
        end
    end
    return false, nil
end

-- Query ipinfo.io API with non-blocking cosocket / resty.http
local function fetch_ipinfo(client_ip)
    local ok_http, http = pcall(require, "resty.http")
    if not ok_http then
        return nil, "resty.http not available"
    end

    local httpc = http.new()
    httpc:set_timeout(1000) -- 1000ms max timeout

    local url = "https://ipinfo.io/" .. client_ip .. "/json"
    if config.geoip and config.geoip.ipinfo_token and config.geoip.ipinfo_token ~= "" then
        url = url .. "?token=" .. config.geoip.ipinfo_token
    end

    local res, err = httpc:request_uri(url, {
        method = "GET",
        headers = {
            ["User-Agent"] = "FluxWall-Security-Gateway/1.0",
            ["Accept"] = "application/json"
        },
        ssl_verify = false
    })

    if not res or res.status ~= 200 then
        return nil, err or ("HTTP status " .. (res and res.status or "nil"))
    end

    local data = cjson.decode(res.body)
    if not data or not data.country then
        return nil, "Invalid JSON from ipinfo.io"
    end

    return data, nil
end

-- Resolves Country Code and ASN/Org for a client IP
-- Flow: L1 Cache -> Redis -> CDN Headers -> ipinfo.io API -> Fallback
function _M.get_ip_info(client_ip)
    -- 1. Check Local / Private IP
    if client_ip == "127.0.0.1" or client_ip:match("^192%.168%.") or client_ip:match("^10%.") or client_ip:match("^172%.1[6-9]%.") or client_ip:match("^172%.2[0-9]%.") or client_ip:match("^172%.3[0-1]%.") then
        return { country = "LOCAL", org = "Private Network" }
    end

    -- 2. Check L1 Shared Memory Cache
    local cache_key = "geo:" .. client_ip
    if ip_cache then
        local cached_json = ip_cache:get(cache_key)
        if cached_json then
            local parsed = cjson.decode(cached_json)
            if parsed and parsed.country then
                return parsed
            end
        end
    end

    -- 3. Check Redis Persistent Cache
    local redis_info = nil
    redis_pool.exec(function(red)
        local stored = red:get("ip:geo:" .. client_ip)
        if stored and stored ~= ngx.null then
            redis_info = cjson.decode(stored)
        end
    end)

    if redis_info and redis_info.country then
        if ip_cache then
            ip_cache:set(cache_key, cjson.encode(redis_info), 3600) -- 1 hour in L1
        end
        return redis_info
    end

    -- 4. Check CDN / Cloudflare Country Header
    local headers = ngx.req.get_headers()
    local cf_country = headers["cf-ipcountry"] or headers["x-country-code"] or headers["geoip-country-code"]
    if cf_country and #cf_country == 2 then
        local info = { country = string.upper(cf_country), org = "CDN Header" }
        if ip_cache then
            ip_cache:set(cache_key, cjson.encode(info), 3600)
        end
        return info
    end

    -- 5. Query https://ipinfo.io/ API
    local ipinfo_data, fetch_err = fetch_ipinfo(client_ip)
    if ipinfo_data and ipinfo_data.country then
        local info = {
            country = string.upper(ipinfo_data.country),
            org = ipinfo_data.org or "Unknown",
            city = ipinfo_data.city,
            region = ipinfo_data.region
        }

        local ttl = (config.geoip and config.geoip.cache_ttl) or 604800 -- 7 days default
        local encoded = cjson.encode(info)

        -- Cache in Redis & L1 Shared Dict
        redis_pool.exec(function(red)
            red:setex("ip:geo:" .. client_ip, ttl, encoded)
        end)

        if ip_cache then
            ip_cache:set(cache_key, encoded, 3600)
        end

        return info
    end

    -- 6. Fallback if API is unreachable / rate limited
    return { country = "UNKNOWN", org = "Unknown" }
end

-- Checks if a request from client_ip is allowed under GeoIP & Datacenter policies
-- Returns: is_allowed (bool), country_code (string), reason (string)
function _M.check_country(client_ip)
    if not config.geoip or not config.geoip.enabled then
        return true, "DISABLED", nil
    end

    local info = _M.get_ip_info(client_ip)
    local country = info.country or "UNKNOWN"
    local org = info.org or ""

    if country == "LOCAL" then
        return true, country, nil
    end

    -- Datacenter / Cloud ASN Blocking (e.g. AWS, DigitalOcean botnet prevention)
    if config.geoip.block_datacenters then
        local is_dc, dc_name = is_datacenter_org(org)
        if is_dc then
            return false, country, "DATACENTER_PROXY_BLOCKED (" .. dc_name .. ")"
        end
    end

    local mode = config.geoip.mode or "blacklist"

    -- 1. Whitelist Mode: Allow ONLY listed countries
    if mode == "whitelist" then
        if config.geoip.allowed_countries and config.geoip.allowed_countries[country] then
            return true, country, nil
        else
            return false, country, "COUNTRY_NOT_IN_WHITELIST (" .. country .. ")"
        end
    end

    -- 2. Check dynamic Redis blocked countries from Dashboard
    local is_redis_blocked = false
    redis_pool.exec(function(red)
        local member = red:sismember("geoip:blocked_countries", country)
        if member == 1 then
            is_redis_blocked = true
        end
    end)

    if is_redis_blocked then
        return false, country, "COUNTRY_BLOCKED_BY_ADMIN (" .. country .. ")"
    end

    -- 3. Blacklist Mode: Block static config listed countries
    if mode == "blacklist" then
        if config.geoip.blocked_countries and config.geoip.blocked_countries[country] then
            return false, country, "COUNTRY_BLOCKED (" .. country .. ")"
        else
            return true, country, nil
        end
    end

    return true, country, nil
end

return _M
