local cjson = require "cjson.safe"

local _M = {}

-- Log a security event as JSON into Nginx error/audit log
function _M.log_event(event_type, details)
    local payload = {
        event = event_type,
        time = ngx.time(),
        time_iso = ngx.utctime(),
        client_ip = details.client_ip or ngx.var.remote_addr,
        uri = details.uri or ngx.var.uri,
        method = ngx.req.get_method(),
        reason = details.reason,
        meta = details.meta,
    }

    local json_str, err = cjson.encode(payload)
    if json_str then
        ngx.log(ngx.WARN, "[SecurityEvent] ", json_str)
    else
        ngx.log(ngx.WARN, "[SecurityEvent] Failed to serialize JSON event: ", err)
    end
end

return _M
