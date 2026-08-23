# Extended Test Suite for Nginx-Lua Anti-DDoS Gateway & Advanced Features
param (
    [string]$GatewayUrl = "http://127.0.0.1:8080",
    [string]$AdminKey = "super-secret-admin-key-2026"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FluxWall Anti-DDoS Advanced Features Test Suite         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target URL: $GatewayUrl`n"

# Test 1: Healthcheck
Write-Host "[Test 1] Healthcheck Endpoint..." -ForegroundColor Yellow
try {
    $resp = Invoke-RestMethod -Uri "$GatewayUrl/healthz" -Method Get
    Write-Host "  -> Status: $($resp.status) | Gateway: $($resp.gateway)" -ForegroundColor Green
} catch {
    Write-Host "  -> Healthcheck Failed: $_" -ForegroundColor Red
}

# Test 2: Bad Bot & Vulnerability Scanner Detection
Write-Host "`n[Test 2] Testing Bad Bot Detection (User-Agent: sqlmap/1.5.2)..." -ForegroundColor Yellow
try {
    $headers = @{ "User-Agent" = "sqlmap/1.5.2" }
    $resp = Invoke-WebRequest -Uri "$GatewayUrl/" -Method Get -Headers $headers -TimeoutSec 2
    Write-Host "  -> FAILED: Bot request was allowed through (Status: $($resp.StatusCode))" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "  -> SUCCESS: Malicious Scanner blocked with 403 Forbidden!" -ForegroundColor Green
    } else {
        Write-Host "  -> Response: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Test 3: Prometheus Metrics Exporter
Write-Host "`n[Test 3] Testing Prometheus Metrics (/metrics)..." -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$GatewayUrl/metrics" -Method Get
    if ($resp.Content -match "gateway_http_requests_total") {
        Write-Host "  -> SUCCESS: Prometheus metrics exported successfully!" -ForegroundColor Green
    } else {
        Write-Host "  -> Metrics returned unexpected format" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  -> Failed to fetch metrics: $_" -ForegroundColor Red
}

# Test 4: Admin REST API Stats
Write-Host "`n[Test 4] Testing Admin REST API (/api/admin/stats)..." -ForegroundColor Yellow
try {
    $headers = @{ "X-Admin-Key" = $AdminKey }
    $stats = Invoke-RestMethod -Uri "$GatewayUrl/api/admin/stats" -Headers $headers -Method Get
    Write-Host "  -> Admin API Authorized! Global QPS: $($stats.global_qps), Active Bans: $($stats.counts.active_bans)" -ForegroundColor Green
} catch {
    Write-Host "  -> Admin API Test Failed: $_" -ForegroundColor Red
}

# Test 5: Rate Limiting Burst
Write-Host "`n[Test 5] Sending 30 rapid requests to test rate limiting (Threshold: 20 + 5 burst)..." -ForegroundColor Yellow
$successCount = 0
$rateLimitedCount = 0

1..30 | ForEach-Object {
    try {
        $resp = Invoke-WebRequest -Uri "$GatewayUrl/" -Method Get -TimeoutSec 2
        if ($resp.StatusCode -eq 200) { $successCount++ }
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 503) { $rateLimitedCount++ }
    }
}
Write-Host "  -> Allowed (200 OK): $successCount" -ForegroundColor Green
Write-Host "  -> Rate Limited (503 Service Unavailable): $rateLimitedCount" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Testing Completed!                                     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
