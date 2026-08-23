local redis_pool = require "redis_pool"
local config = require "config"

local _M = {}
local ip_cache = ngx.shared.ip_cache

-- Check if an IP is either permanently blacklisted or temporarily banned
-- Returns: is_blocked (bool), reason (string), remaining_ttl (number)
function _M.is_blacklisted(client_ip)
    if not client_ip then
        return false, nil, 0
    end

    -- 1. Check L1 Shared Memory Cache
    local cache_key = "bl:" .. client_ip
    if ip_cache then
        local cached_val = ip_cache:get(cache_key)
        if cached_val == 1 then
            return true, "L1_CACHE_BLOCK", 5
        elseif cached_val == 0 then
            return false, nil, 0
        end
    end

    -- 2. Query Redis for Permanent Blacklist AND Temporary Ban
    local is_blocked = false
    local reason = nil
    local remaining_ttl = 0

    local ok, res = redis_pool.exec(function(red)
        red:init_pipeline()
        red:sismember("ip:blacklist", client_ip)
        red:get("ip:ban:" .. client_ip)
        red:ttl("ip:ban:" .. client_ip)
        local results, err = red:commit_pipeline()
        if err then
            return nil, err
        end
        return results
    end)

    if ok and res and type(res) == "table" then
        local is_perm = res[1] == 1
        local temp_ban_reason = res[2]
        local ban_ttl = tonumber(res[3]) or 0

        if is_perm then
            is_blocked = true
            reason = "PERMANENT_BLACKLIST"
            remaining_ttl = -1
        elseif temp_ban_reason ~= ngx.null and temp_ban_reason ~= nil and ban_ttl > 0 then
            is_blocked = true
            reason = tostring(temp_ban_reason)
            remaining_ttl = ban_ttl
        end

        -- Update L1 Cache
        if ip_cache then
            local ttl = is_blocked and (config.l1_cache.blacklist_ttl or 5) or 5
            ip_cache:set(cache_key, is_blocked and 1 or 0, ttl)
        end
    end

    return is_blocked, reason, remaining_ttl
end

-- Programmatic helper to permanently blacklist an IP
function _M.add_permanent(client_ip)
    if ip_cache then
        ip_cache:delete("bl:" .. client_ip)
    end
    return redis_pool.exec(function(red)
        return red:sadd("ip:blacklist", client_ip)
    end)
end

-- Programmatic helper to remove from blacklist
function _M.remove_permanent(client_ip)
    if ip_cache then
        ip_cache:delete("bl:" .. client_ip)
    end
    return redis_pool.exec(function(red)
        return red:srem("ip:blacklist", client_ip)
    end)
end

return _M
