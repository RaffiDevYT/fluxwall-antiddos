local redis_pool = require "redis_pool"
local config = require "config"
local surge_protector = require "surge_protector"

local _M = {}
local local_counters = ngx.shared.local_counters

-- Match the current URI against configured endpoint rules
local function get_endpoint_rule(uri)
    if not uri then
        return config.default_limit
    end

    if config.endpoint_limits then
        for _, rule in ipairs(config.endpoint_limits) do
            if uri:sub(1, #rule.prefix) == rule.prefix then
                return rule
            end
        end
    end

    return config.default_limit
end

-- Checks if a request by client_ip to uri exceeds rate limit
-- Returns: allowed (bool), current_reqs (number), max_limit (number), retry_after (number), rule_name (string), is_surge (bool)
function _M.check(client_ip, uri, method)
    local rule = get_endpoint_rule(uri)
    local window = rule.window_sec or 1
    local base_max = (rule.max_requests or 20) + (rule.burst or 0)
    local retry_after = rule.retry_after or window
    local rule_name = rule.name or "default"

    -- Calculate token weight based on HTTP method (e.g. POST=2, GET=1)
    local method_weight = (config.method_multipliers and config.method_multipliers[method]) or 1

    -- Check Surge Mode Scaling Factor (e.g. 50% allowance under attack)
    local is_surge, scale_factor, global_qps = surge_protector.is_surge_active()
    local max_requests = math.max(1, math.floor(base_max * scale_factor))

    -- Key structure: "rl:<rule_name>:<ip>:<timestamp_bucket>"
    local current_time = ngx.time()
    local bucket = math.floor(current_time / window)
    local redis_key = string.format("rl:%s:%s:%d", rule_name, client_ip, bucket)

    local current_count = 0
    local allowed = true

    -- Execute Atomic Increment by method_weight in Redis
    local ok, res = redis_pool.exec(function(red)
        red:init_pipeline()
        red:incrby(redis_key, method_weight)
        red:expire(redis_key, window * 2)
        local results, err = red:commit_pipeline()
        if err then
            return nil, err
        end
        return results[1]
    end)

    if ok and res then
        current_count = tonumber(res) or 1
        if current_count > max_requests then
            allowed = false
        end
    else
        -- Fallback: Redis is unreachable or timed out
        if config.fail_open then
            if local_counters then
                local local_key = redis_key
                local count, err = local_counters:incr(local_key, method_weight, 0, window * 2)
                if count and count > max_requests then
                    allowed = false
                    current_count = count
                else
                    allowed = true
                    current_count = count or 1
                end
            else
                allowed = true
                current_count = 1
            end
        else
            allowed = false
        end
    end

    return allowed, current_count, max_requests, retry_after, rule_name, is_surge
end

return _M
