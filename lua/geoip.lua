local config = require "config"

local _M = {}

-- Extracts country code from upstream CDN/proxy headers or fallback
function _M.get_country(client_ip)
    local headers = ngx.req.get_headers()
    
    -- 1. Cloudflare Country Header
    local cf_country = headers["cf-ipcountry"]
    if cf_country and #cf_country == 2 then
        return string.upper(cf_country)
    end

    -- 2. Custom Proxy Country Header
    local x_country = headers["x-country-code"] or headers["geoip-country-code"]
    if x_country and #x_country == 2 then
        return string.upper(x_country)
    end

    -- 3. Local / Private IP detection
    if client_ip == "127.0.0.1" or client_ip:match("^192%.168%.") or client_ip:match("^10%.") or client_ip:match("^172%.1[6-9]%.") or client_ip:match("^172%.2[0-9]%.") or client_ip:match("^172%.3[0-1]%.") then
        return "LOCAL"
    end

    return "UNKNOWN"
end

-- Checks if a request from client_ip is allowed under GeoIP policies
-- Returns: is_allowed (bool), country_code (string), reason (string)
function _M.check_country(client_ip)
    if not config.geoip or not config.geoip.enabled then
        return true, "DISABLED", nil
    end

    local country = _M.get_country(client_ip)
    if country == "LOCAL" then
        return true, country, nil
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

    -- 2. Blacklist Mode: Block listed countries
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
