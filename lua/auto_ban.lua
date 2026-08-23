local redis_pool = require "redis_pool"
local config = require "config"

local _M = {}
local ip_cache = ngx.shared.ip_cache

-- Records a rate-limiting infraction and automatically bans the IP if threshold exceeded
-- Returns: is_banned (bool), total_violations (number)
function _M.record_violation(client_ip, uri)
    if not config.auto_ban.enabled or not client_ip then
        return false, 0
    end

    local is_banned = false
    local violation_count = 0
    local ban_ttl = config.auto_ban.ban_duration_sec or 900
    local window = config.auto_ban.violation_window_sec or 60
    local threshold = config.auto_ban.max_violations or 5

    local ok, res = redis_pool.exec(function(red)
        local key = "ip:violations:" .. client_ip
        red:init_pipeline()
        red:incr(key)
        red:expire(key, window)
        local results, err = red:commit_pipeline()
        if err then
            return nil, err
        end
        return results[1]
    end)

    if ok and res then
        violation_count = tonumber(res) or 1
        if violation_count >= threshold then
            is_banned = true
            -- Apply temporary ban in Redis
            redis_pool.exec(function(red)
                local reason = string.format("AUTO_BAN: %d violations in %ds (last uri: %s)", violation_count, window, uri or "/")
                red:setex("ip:ban:" .. client_ip, ban_ttl, reason)
                -- Clear violation counter so subsequent ban cycles start fresh after unban
                red:del("ip:violations:" .. client_ip)
            end)

            -- Instantly write to L1 in-memory cache to drop future packets within microseconds
            if ip_cache then
                ip_cache:set("bl:" .. client_ip, 1, math.min(ban_ttl, 10))
            end

            ngx.log(ngx.WARN, string.format("[AutoBan] IP %s banned for %ds due to %d rate-limit violations", client_ip, ban_ttl, violation_count))
        end
    end

    return is_banned, violation_count
end

-- Programmatic helper to manually ban an IP with custom TTL and reason
function _M.ban_ip(client_ip, duration_sec, reason)
    local ttl = duration_sec or (config.auto_ban.ban_duration_sec or 900)
    local ban_reason = reason or "MANUAL_TEMPORARY_BAN"

    if ip_cache then
        ip_cache:set("bl:" .. client_ip, 1, math.min(ttl, 10))
    end

    return redis_pool.exec(function(red)
        return red:setex("ip:ban:" .. client_ip, ttl, ban_reason)
    end)
end

-- Programmatic helper to unban an IP
function _M.unban_ip(client_ip)
    if ip_cache then
        ip_cache:delete("bl:" .. client_ip)
    end

    return redis_pool.exec(function(red)
        red:init_pipeline()
        red:del("ip:ban:" .. client_ip)
        red:del("ip:violations:" .. client_ip)
        return red:commit_pipeline()
    end)
end

return _M
