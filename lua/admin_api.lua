local config = require "config"
local redis_pool = require "redis_pool"
local auto_ban = require "auto_ban"
local whitelist = require "whitelist"
local blacklist = require "blacklist"
local surge_protector = require "surge_protector"
local cjson = require "cjson.safe"

local _M = {}

-- Authenticate Admin Request
local function authenticate()
    local headers = ngx.req.get_headers()
    local args = ngx.req.get_uri_args()
    local provided_key = headers["x-admin-key"] or args["api_key"]

    if not config.admin.enabled or not provided_key or provided_key ~= config.admin.api_key then
        ngx.status = ngx.HTTP_UNAUTHORIZED
        ngx.header["Content-Type"] = "application/json"
        ngx.say(cjson.encode({ error = "Unauthorized", message = "Invalid or missing X-Admin-Key header" }))
        return ngx.exit(ngx.HTTP_UNAUTHORIZED)
    end
end

-- Helper to read JSON request body
local function get_json_body()
    ngx.req.read_body()
    local body_raw = ngx.req.get_body_data()
    if not body_raw then
        return {}
    end
    return cjson.decode(body_raw) or {}
end

-- Router for /api/admin/*
function _M.handle_request()
    authenticate()

    local method = ngx.req.get_method()
    local uri = ngx.var.uri or ""
    ngx.header["Content-Type"] = "application/json; charset=utf-8"

    -- 1. GET /api/admin/stats
    if uri == "/api/admin/stats" and method == "GET" then
        local is_surge, scale_factor, qps = surge_protector.is_surge_active()
        local active_bans_count = 0
        local whitelist_count = 0
        local blacklist_count = 0

        redis_pool.exec(function(red)
            local ban_keys = red:keys("ip:ban:*") or {}
            active_bans_count = #ban_keys
            whitelist_count = red:scard("ip:whitelist") or 0
            blacklist_count = red:scard("ip:blacklist") or 0
        end)

        local stats = {
            gateway = "FluxWall Anti-DDoS Edge Gateway",
            timestamp = ngx.time(),
            global_qps = qps,
            surge_mode = {
                active = is_surge,
                scale_factor = scale_factor,
                threshold = config.surge_mode.qps_threshold
            },
            counts = {
                active_bans = active_bans_count,
                whitelisted_ips = whitelist_count,
                blacklisted_ips = blacklist_count
            }
        }
        ngx.say(cjson.encode(stats))
        return ngx.exit(ngx.HTTP_OK)

    -- 2. /api/admin/bans
    elseif uri == "/api/admin/bans" then
        if method == "GET" then
            local bans_list = {}
            redis_pool.exec(function(red)
                local keys = red:keys("ip:ban:*") or {}
                for _, key in ipairs(keys) do
                    local ip = key:sub(8) -- Remove "ip:ban:" prefix
                    local reason = red:get(key) or "Unknown"
                    local ttl = red:ttl(key) or 0
                    table.insert(bans_list, { ip = ip, reason = tostring(reason), ttl_seconds = tonumber(ttl) })
                end
            end)
            ngx.say(cjson.encode({ count = #bans_list, bans = bans_list }))
            return ngx.exit(ngx.HTTP_OK)

        elseif method == "POST" then
            local body = get_json_body()
            local ip = body.ip
            local duration = tonumber(body.duration_sec) or 900
            local reason = body.reason or "MANUAL_ADMIN_BAN"
            if not ip then
                ngx.status = ngx.HTTP_BAD_REQUEST
                ngx.say(cjson.encode({ error = "Missing 'ip' parameter" }))
                return ngx.exit(ngx.HTTP_BAD_REQUEST)
            end
            auto_ban.ban_ip(ip, duration, reason)
            ngx.say(cjson.encode({ status = "success", message = "IP successfully banned", ip = ip, ttl_seconds = duration }))
            return ngx.exit(ngx.HTTP_OK)

        elseif method == "DELETE" then
            local args = ngx.req.get_uri_args()
            local body = get_json_body()
            local ip = args.ip or body.ip
            if not ip then
                ngx.status = ngx.HTTP_BAD_REQUEST
                ngx.say(cjson.encode({ error = "Missing 'ip' parameter" }))
                return ngx.exit(ngx.HTTP_BAD_REQUEST)
            end
            auto_ban.unban_ip(ip)
            ngx.say(cjson.encode({ status = "success", message = "IP unbanned successfully", ip = ip }))
            return ngx.exit(ngx.HTTP_OK)
        end

    -- 3. /api/admin/whitelist
    elseif uri == "/api/admin/whitelist" then
        if method == "GET" then
            local list = {}
            redis_pool.exec(function(red)
                list = red:smembers("ip:whitelist") or {}
            end)
            ngx.say(cjson.encode({ count = #list, whitelist = list }))
            return ngx.exit(ngx.HTTP_OK)

        elseif method == "POST" then
            local body = get_json_body()
            local ip = body.ip
            if not ip then
                ngx.status = ngx.HTTP_BAD_REQUEST
                ngx.say(cjson.encode({ error = "Missing 'ip' parameter" }))
                return ngx.exit(ngx.HTTP_BAD_REQUEST)
            end
            whitelist.add_ip(ip)
            ngx.say(cjson.encode({ status = "success", message = "IP added to whitelist", ip = ip }))
            return ngx.exit(ngx.HTTP_OK)

        elseif method == "DELETE" then
            local args = ngx.req.get_uri_args()
            local body = get_json_body()
            local ip = args.ip or body.ip
            if not ip then
                ngx.status = ngx.HTTP_BAD_REQUEST
                ngx.say(cjson.encode({ error = "Missing 'ip' parameter" }))
                return ngx.exit(ngx.HTTP_BAD_REQUEST)
            end
            whitelist.remove_ip(ip)
            ngx.say(cjson.encode({ status = "success", message = "IP removed from whitelist", ip = ip }))
            return ngx.exit(ngx.HTTP_OK)
        end

    -- 4. /api/admin/blacklist
    elseif uri == "/api/admin/blacklist" then
        if method == "GET" then
            local list = {}
            redis_pool.exec(function(red)
                list = red:smembers("ip:blacklist") or {}
            end)
            ngx.say(cjson.encode({ count = #list, blacklist = list }))
            return ngx.exit(ngx.HTTP_OK)

        elseif method == "POST" then
            local body = get_json_body()
            local ip = body.ip
            if not ip then
                ngx.status = ngx.HTTP_BAD_REQUEST
                ngx.say(cjson.encode({ error = "Missing 'ip' parameter" }))
                return ngx.exit(ngx.HTTP_BAD_REQUEST)
            end
            blacklist.add_permanent(ip)
            ngx.say(cjson.encode({ status = "success", message = "IP added to permanent blacklist", ip = ip }))
            return ngx.exit(ngx.HTTP_OK)

        elseif method == "DELETE" then
            local args = ngx.req.get_uri_args()
            local body = get_json_body()
            local ip = args.ip or body.ip
            if not ip then
                ngx.status = ngx.HTTP_BAD_REQUEST
                ngx.say(cjson.encode({ error = "Missing 'ip' parameter" }))
                return ngx.exit(ngx.HTTP_BAD_REQUEST)
            end
            blacklist.remove_permanent(ip)
            ngx.say(cjson.encode({ status = "success", message = "IP removed from blacklist", ip = ip }))
            return ngx.exit(ngx.HTTP_OK)
        end
    end

    ngx.status = ngx.HTTP_NOT_FOUND
    ngx.say(cjson.encode({ error = "Endpoint Not Found" }))
    return ngx.exit(ngx.HTTP_NOT_FOUND)
end

return _M
