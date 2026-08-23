local redis_pool = require "redis_pool"
local config = require "config"

local _M = {}
local ip_cache = ngx.shared.ip_cache

-- Check if an IP address is whitelisted
function _M.is_whitelisted(client_ip)
    if not client_ip then
        return false
    end

    -- 1. Check L1 Shared Memory Dictionary
    local cache_key = "wl:" .. client_ip
    if ip_cache then
        local cached_val = ip_cache:get(cache_key)
        if cached_val == 1 then
            return true
        elseif cached_val == 0 then
            return false
        end
    end

    -- 2. Query Redis Set "ip:whitelist"
    local is_member = false
    local ok, res = redis_pool.exec(function(red)
        local member, err = red:sismember("ip:whitelist", client_ip)
        if err then
            return nil, err
        end
        return member == 1
    end)

    if ok and res ~= nil then
        is_member = res
        -- Store in L1 cache
        if ip_cache then
            local ttl = config.l1_cache.whitelist_ttl or 10
            ip_cache:set(cache_key, is_member and 1 or 0, ttl)
        end
    end

    return is_member
end

-- Programmatic helper to add IP to whitelist
function _M.add_ip(client_ip)
    if ip_cache then
        ip_cache:delete("wl:" .. client_ip)
    end
    return redis_pool.exec(function(red)
        return red:sadd("ip:whitelist", client_ip)
    end)
end

-- Programmatic helper to remove IP from whitelist
function _M.remove_ip(client_ip)
    if ip_cache then
        ip_cache:delete("wl:" .. client_ip)
    end
    return redis_pool.exec(function(red)
        return red:srem("ip:whitelist", client_ip)
    end)
end

return _M
