local redis = require "resty.redis"
local config = require "config"

local _M = {}

-- Safely acquires a Redis connection from the pool
function _M.get_client()
    local red = redis:new()
    red:set_timeout(config.redis.timeout)

    local ok, err = red:connect(config.redis.host, config.redis.port)
    if not ok then
        ngx.log(ngx.ERR, "[Redis] Failed to connect to Redis at ", config.redis.host, ":", config.redis.port, " - error: ", err)
        return nil, err
    end

    -- Authenticate if password is provided
    if config.redis.password and config.redis.password ~= "" then
        local auth_ok, auth_err = red:auth(config.redis.password)
        if not auth_ok then
            ngx.log(ngx.ERR, "[Redis] Failed to authenticate: ", auth_err)
            red:close()
            return nil, auth_err
        end
    end

    -- Select DB if non-zero
    if config.redis.db and config.redis.db ~= 0 then
        local sel_ok, sel_err = red:select(config.redis.db)
        if not sel_ok then
            ngx.log(ngx.ERR, "[Redis] Failed to select DB ", config.redis.db, ": ", sel_err)
            red:close()
            return nil, sel_err
        end
    end

    return red, nil
end

-- Safely releases the connection back to the pool
function _M.release_client(red)
    if not red then
        return
    end

    local ok, err = red:set_keepalive(config.redis.max_idle_time, config.redis.pool_size)
    if not ok then
        ngx.log(ngx.WARN, "[Redis] Failed to set keepalive: ", err, " - closing connection")
        red:close()
    end
end

-- Helper to execute a callback with automatic connection acquisition and cleanup
-- Returns ok, result_or_err (Fail-safe wrapper)
function _M.exec(fn)
    local red, err = _M.get_client()
    if not red then
        if config.fail_open then
            ngx.log(ngx.WARN, "[Redis] Fail-Open activated due to connection error: ", err)
            return false, err
        end
        return false, err
    end

    local success, res_or_err = pcall(fn, red)
    _M.release_client(red)

    if not success then
        ngx.log(ngx.ERR, "[Redis] Exception during query execution: ", tostring(res_or_err))
        return false, res_or_err
    end

    return true, res_or_err
end

return _M
