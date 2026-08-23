local config = require "config"

local _M = {}

-- Checks if a string looks like a valid IPv4 or IPv6 address
local function is_valid_ip(ip)
    if not ip or type(ip) ~= "string" or #ip > 45 then
        return false
    end
    -- Basic IPv4 match
    if ip:match("^%d+%.%d+%.%d+%.%d+$") then
        return true
    end
    -- Basic IPv6 match
    if ip:match("^[0-9a-fA-F:]+$") and ip:find(":") then
        return true
    end
    return false
end

-- Extracts real client IP respecting reverse proxies & CDNs
function _M.get_client_ip()
    local headers = ngx.req.get_headers()

    -- 1. Cloudflare header
    local cf_ip = headers["cf-connecting-ip"]
    if cf_ip and is_valid_ip(cf_ip) then
        return cf_ip
    end

    -- 2. True-Client-IP header (Akamai / Cloudflare Enterprise)
    local true_client_ip = headers["true-client-ip"]
    if true_client_ip and is_valid_ip(true_client_ip) then
        return true_client_ip
    end

    -- 3. X-Real-IP header
    local x_real_ip = headers["x-real-ip"]
    if x_real_ip and is_valid_ip(x_real_ip) then
        return x_real_ip
    end

    -- 4. X-Forwarded-For (Get the first non-proxy IP from comma-separated list)
    local xff = headers["x-forwarded-for"]
    if xff then
        if type(xff) == "table" then
            xff = xff[1]
        end
        if type(xff) == "string" then
            local first_ip = xff:match("^([^,]+)")
            if first_ip then
                first_ip = first_ip:gsub("%s+", "")
                if is_valid_ip(first_ip) then
                    return first_ip
                end
            end
        end
    end

    -- 5. Fallback to Nginx direct remote address
    return ngx.var.remote_addr or "127.0.0.1"
end

return _M
