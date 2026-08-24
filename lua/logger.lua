local cjson = require "cjson.safe"
local redis_pool = require "redis_pool"

local _M = {}

-- Log a security event as JSON into Nginx audit log and Redis event stream
function _M.log_event(event_type, details)
    local now = ngx.time()
    local payload = {
        id = string.format("%d-%s", now, ngx.md5(tostring(math.random())):sub(1, 6)),
        event = event_type,
        time = now,
        time_formatted = os.date("%H:%M:%S", now),
        client_ip = details.client_ip or ngx.var.remote_addr or "127.0.0.1",
        uri = details.uri or ngx.var.uri or "/",
        method = ngx.req.get_method(),
        reason = details.reason or "Security Rule Violation",
        meta = details.meta or {},
    }

    local json_str, err = cjson.encode(payload)
    if json_str then
        ngx.log(ngx.WARN, "[SecurityEvent] ", json_str)

        -- Push event into Redis for real-time Dashboard consumption
        redis_pool.exec(function(red)
            red:lpush("fluxwall:logs", json_str)
            red:ltrim("fluxwall:logs", 0, 99) -- Keep last 100 events
            red:incr("fluxwall:stats:threats_total")
            red:incr("fluxwall:stats:threats:" .. string.lower(event_type))
        end)
    else
        ngx.log(ngx.WARN, "[SecurityEvent] Failed to serialize JSON event: ", err)
    end
end

return _M
