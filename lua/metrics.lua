local redis_pool = require "redis_pool"
local surge_protector = require "surge_protector"

local _M = {}
local prom_dict = ngx.shared.prometheus_metrics

-- Helper to format Prometheus label key
local function format_key(name, labels)
    if not labels or next(labels) == nil then
        return name
    end
    local parts = {}
    for k, v in pairs(labels) do
        table.insert(parts, string.format('%s="%s"', k, tostring(v):gsub('"', '\\"')))
    end
    table.sort(parts)
    return string.format('%s{%s}', name, table.concat(parts, ","))
end

-- Increments a Prometheus counter
function _M.inc(name, labels, val)
    if not prom_dict then
        return
    end
    local key = format_key(name, labels)
    local delta = val or 1
    prom_dict:incr(key, delta, 0)
end

-- Renders all metrics in official Prometheus plaintext format
function _M.export_prometheus_text()
    if not prom_dict then
        return "# Prometheus metrics dictionary not initialized\n"
    end

    local lines = {}
    table.insert(lines, "# HELP gateway_http_requests_total Total HTTP requests processed by Anti-DDoS gateway")
    table.insert(lines, "# TYPE gateway_http_requests_total counter")

    table.insert(lines, "# HELP gateway_blocked_requests_total Total HTTP requests blocked by security policies")
    table.insert(lines, "# TYPE gateway_blocked_requests_total counter")

    table.insert(lines, "# HELP gateway_surge_mode_active Indicates if adaptive surge protection mode is active (1 or 0)")
    table.insert(lines, "# TYPE gateway_surge_mode_active gauge")

    table.insert(lines, "# HELP gateway_global_qps Current measured requests per second")
    table.insert(lines, "# TYPE gateway_global_qps gauge")

    table.insert(lines, "# HELP gateway_active_bans Active temporary bans in Redis")
    table.insert(lines, "# TYPE gateway_active_bans gauge")

    -- Add current dynamic gauges
    local is_surge, _, qps = surge_protector.is_surge_active()
    table.insert(lines, string.format("gateway_surge_mode_active %d", is_surge and 1 or 0))
    table.insert(lines, string.format("gateway_global_qps %d", qps or 0))

    -- Query active bans count from Redis
    local active_bans = 0
    local ok, res = redis_pool.exec(function(red)
        local keys, err = red:keys("ip:ban:*")
        if keys and type(keys) == "table" then
            return #keys
        end
        return 0
    end)
    if ok and res then
        active_bans = res
    end
    table.insert(lines, string.format("gateway_active_bans %d", active_bans))

    -- Export stored counters
    local keys = prom_dict:get_keys(0)
    for _, key in ipairs(keys) do
        local val = prom_dict:get(key)
        if val then
            table.insert(lines, string.format("%s %s", key, tostring(val)))
        end
    end

    return table.concat(lines, "\n") .. "\n"
end

return _M
