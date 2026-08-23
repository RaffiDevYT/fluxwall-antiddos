local config = require "config"

local _M = {}
local local_counters = ngx.shared.local_counters

-- Records each request into current second's global bucket and updates surge state
function _M.track_request()
    if not config.surge_mode.enabled or not local_counters then
        return false, 1.0, 0
    end

    local now = ngx.time()
    local qps_key = "g_qps:" .. now
    local qps, err = local_counters:incr(qps_key, 1, 0, 5)
    qps = qps or 1

    local threshold = config.surge_mode.qps_threshold or 200
    local cooldown = config.surge_mode.cooldown_seconds or 10

    if qps >= threshold then
        -- Activate or extend surge mode
        local_counters:set("surge_active", 1, cooldown)
        local_counters:set("surge_qps", qps, cooldown)
    end

    local is_surge = (local_counters:get("surge_active") == 1)
    local scale_factor = is_surge and (config.surge_mode.rate_scale_factor or 0.5) or 1.0

    return is_surge, scale_factor, qps
end

-- Checks if gateway is currently in surge defense mode
function _M.is_surge_active()
    if not local_counters then
        return false, 1.0, 0
    end
    local is_surge = (local_counters:get("surge_active") == 1)
    local scale_factor = is_surge and (config.surge_mode.rate_scale_factor or 0.5) or 1.0
    local now = ngx.time()
    local qps = local_counters:get("g_qps:" .. now) or local_counters:get("g_qps:" .. (now - 1)) or 0
    return is_surge, scale_factor, qps
end

return _M
