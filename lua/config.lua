local _M = {}

-- Redis Connection Settings
_M.redis = {
    host = os.getenv("REDIS_HOST") or "redis",
    port = tonumber(os.getenv("REDIS_PORT")) or 6379,
    password = os.getenv("REDIS_PASSWORD") or nil,
    db = tonumber(os.getenv("REDIS_DB")) or 0,
    timeout = 1000,          -- 1000ms connection/read timeout
    max_idle_time = 10000,   -- 10s connection idle timeout in pool
    pool_size = 100,         -- Connection pool size per worker
}

-- Fallback / Fail-Open Behavior
_M.fail_open = true          -- Allow requests through if Redis fails/times out

-- Admin API & Dashboard Security
_M.admin = {
    api_key = os.getenv("ADMIN_API_KEY") or "super-secret-admin-key-2026",
    enabled = true,
}

-- L1 Memory Cache TTLs (in seconds)
_M.l1_cache = {
    whitelist_ttl = 10,      -- Cache whitelist positive lookups for 10s
    blacklist_ttl = 5,       -- Cache blacklist hits for 5s
    ban_ttl = 5,             -- Cache active ban hits for 5s
}

-- Default Global Rate Limit Settings (Sliding Window)
_M.default_limit = {
    window_sec = 1,          -- Time window in seconds
    max_requests = 20,       -- Max allowed requests per window
    burst = 5,               -- Allowed burst above max_requests before 503
    retry_after = 2,         -- Value of Retry-After header in seconds
}

-- Method-based weights or limits (e.g. POST/PUT count more or have stricter limits)
_M.method_multipliers = {
    POST = 2,    -- POST requests consume 2 tokens
    PUT = 2,
    DELETE = 3,
    GET = 1,
    HEAD = 1,
}

-- Sensitive / Custom Endpoint Rate Limit Rules
_M.endpoint_limits = {
    {
        prefix = "/api/v1/auth/login",
        window_sec = 60,
        max_requests = 5,
        burst = 1,
        retry_after = 60,
        name = "auth_login"
    },
    {
        prefix = "/api/v1/auth/register",
        window_sec = 60,
        max_requests = 3,
        burst = 0,
        retry_after = 60,
        name = "auth_register"
    },
    {
        prefix = "/api/",
        window_sec = 1,
        max_requests = 30,
        burst = 10,
        retry_after = 1,
        name = "api_general"
    },
}

-- Automated IP Banning Rules (Punishment on repeated infractions)
_M.auto_ban = {
    enabled = true,
    violation_window_sec = 60,  -- Track violations within a 60s window
    max_violations = 5,         -- 5 rate limit breaches in 60s triggers an automated ban
    ban_duration_sec = 900,     -- Ban duration: 15 minutes (900s)
}

-- Adaptive Surge Mode (Global Auto-Tuning Under Attack)
_M.surge_mode = {
    enabled = true,
    qps_threshold = 200,        -- If global QPS exceeds 200 req/s, trigger surge mode
    rate_scale_factor = 0.5,    -- Reduce per-IP rate limit by 50% during surge
    cooldown_seconds = 10,      -- Stay in surge mode for at least 10s after traffic drops
}

-- Bot & Vulnerability Scanner Signatures (Case-insensitive match)
_M.bad_bots = {
    "sqlmap",
    "nikto",
    "masscan",
    "dirbuster",
    "nmap",
    "havij",
    "acunetix",
    "zgrab",
    "wpscan",
    "gobuster",
    "hydra",
    "nessus",
    "openvas",
    "python%-requests",
    "go%-http%-client",
    "scrapy",
    "curl",                   -- Can be exempted via whitelist if needed
}

-- Trusted Proxies / Upstream IPs
_M.trusted_proxies = {
    ["127.0.0.1"] = true,
    ["172.16.0.0/12"] = true,
    ["10.0.0.0/8"] = true,
    ["192.168.0.0/16"] = true,
}

return _M
