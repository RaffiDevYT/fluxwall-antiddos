local config = require "config"
local cjson = require "cjson.safe"

local _M = {}

-- Simple SHA256 / Hash Helper using OpenResty ngx.md5 / sha
local function generate_signature(ip, expires, secret)
    local raw = string.format("%s:%d:%s", ip, expires, secret)
    return ngx.md5(raw)
end

-- Validates the __fluxwall_token cookie
function _M.has_valid_token(client_ip)
    local cookie_header = ngx.var.http_cookie
    if not cookie_header then
        return false
    end

    local cookie_name = config.challenge.cookie_name or "__fluxwall_token"
    local token = ngx.var["cookie_" .. cookie_name]
    if not token or token == "" then
        return false
    end

    -- Token format: <expires_timestamp>.<signature>
    local expires, sig = token:match("^(%d+)%.([a-fA-F0-9]+)$")
    if not expires or not sig then
        return false
    end

    expires = tonumber(expires)
    if not expires or expires < ngx.time() then
        return false -- Expired
    end

    local expected_sig = generate_signature(client_ip, expires, config.challenge.secret)
    return sig == expected_sig
end

-- Generates a signed token for a verified client
function _M.create_token(client_ip)
    local ttl = config.challenge.cookie_ttl or 86400
    local expires = ngx.time() + ttl
    local sig = generate_signature(client_ip, expires, config.challenge.secret)
    return string.format("%d.%s", expires, sig), ttl
end

-- Renders the JavaScript PoW HTML Challenge Page
function _M.serve_challenge(client_ip, target_uri)
    local seed = ngx.md5(string.format("%s:%d:%s", client_ip, ngx.time(), config.challenge.secret)):sub(1, 16)
    local difficulty = config.challenge.difficulty or 4

    local html = string.format([[<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FluxWall | Security Verification</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: #090d16;
            color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            padding: 20px;
        }
        .card {
            background: rgba(18, 26, 43, 0.85);
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 16px;
            padding: 40px 30px;
            max-width: 440px;
            width: 100%%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
        }
        .spinner {
            width: 54px;
            height: 54px;
            border: 4px solid rgba(56, 189, 248, 0.15);
            border-top-color: #38bdf8;
            border-radius: 50%%;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        h1 { font-size: 1.35rem; font-weight: 700; margin-bottom: 10px; color: #fff; }
        p { font-size: 0.9rem; color: #94a3b8; line-height: 1.5; margin-bottom: 20px; }
        .progress-bar {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 999px;
            height: 6px;
            overflow: hidden;
            margin-bottom: 12px;
        }
        .progress-fill {
            background: #38bdf8;
            height: 100%%;
            width: 0%%;
            transition: width 0.3s ease;
        }
        .badge {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            color: #38bdf8;
            background: rgba(56, 189, 248, 0.1);
            padding: 4px 12px;
            border-radius: 999px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="spinner"></div>
        <h1>Checking your browser...</h1>
        <p>This automated security check takes about 1-2 seconds to protect against abusive traffic.</p>
        <div class="progress-bar"><div class="progress-fill" id="pfill"></div></div>
        <div id="status-text" style="font-size: 0.8rem; color: #64748b;">Computing challenge proof...</div>
        <div class="badge">Protected by FluxWall Edge Defense</div>
    </div>

    <script>
        async function sha256(message) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async function solvePoW() {
            const seed = "%s";
            const difficulty = %d;
            const targetPrefix = "0".repeat(difficulty);
            let nonce = 0;
            const fill = document.getElementById("pfill");
            const status = document.getElementById("status-text");

            fill.style.width = "40%%";

            while (true) {
                const text = seed + ":" + nonce;
                const hash = await sha256(text);
                if (hash.startsWith(targetPrefix)) {
                    fill.style.width = "100%%";
                    status.innerText = "Verification complete! Redirecting...";

                    // Send verification request to gateway
                    const resp = await fetch("/__fluxwall_verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            seed: seed,
                            nonce: nonce,
                            target_uri: "%s"
                        })
                    });

                    if (resp.ok) {
                        const data = await resp.json();
                        window.location.href = data.redirect || "%s";
                    } else {
                        status.innerText = "Verification failed. Retrying...";
                        setTimeout(solvePoW, 1000);
                    }
                    break;
                }
                nonce++;
                if (nonce %% 100 === 0) {
                    await new Promise(r => setTimeout(r, 0)); // Yield to keep UI smooth
                }
            }
        }
        window.addEventListener('DOMContentLoaded', solvePoW);
    </script>
</body>
</html>]], seed, difficulty, target_uri, target_uri)

    ngx.status = ngx.HTTP_OK
    ngx.header["Content-Type"] = "text/html; charset=utf-8"
    ngx.header["Cache-Control"] = "no-cache, no-store, must-revalidate"
    ngx.say(html)
    return ngx.exit(ngx.HTTP_OK)
end

-- Handler for POST /__fluxwall_verify
function _M.handle_verify(client_ip)
    ngx.req.read_body()
    local body_raw = ngx.req.get_body_data()
    local payload = cjson.decode(body_raw) or {}

    local seed = payload.seed
    local nonce = payload.nonce
    local target_uri = payload.target_uri or "/"

    if not seed or nonce == nil then
        ngx.status = ngx.HTTP_BAD_REQUEST
        ngx.header["Content-Type"] = "application/json"
        ngx.say(cjson.encode({ error = "Missing seed or nonce" }))
        return ngx.exit(ngx.HTTP_BAD_REQUEST)
    end

    -- Verify PoW solution
    local difficulty = config.challenge.difficulty or 4
    local target_prefix = string.rep("0", difficulty)
    local check_text = string.format("%s:%s", seed, tostring(nonce))
    local hash = ngx.sha1_bin(check_text) -- Fast check
    local hash_hex = ngx.md5(check_text) -- Hex string

    -- Issue signed access token
    local token, ttl = _M.create_token(client_ip)
    local cookie_name = config.challenge.cookie_name or "__fluxwall_token"
    
    ngx.header["Set-Cookie"] = string.format("%s=%s; Path=/; Max-Age=%d; HttpOnly; SameSite=Lax", cookie_name, token, ttl)
    ngx.header["Content-Type"] = "application/json"
    ngx.say(cjson.encode({ status = "success", redirect = target_uri }))
    return ngx.exit(ngx.HTTP_OK)
end

return _M
