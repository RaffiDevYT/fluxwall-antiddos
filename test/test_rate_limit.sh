#!/usr/bin/env bash

GATEWAY_URL=${1:-"http://127.0.0.1:8080"}
ADMIN_KEY=${2:-"super-secret-admin-key-2026"}

echo "=========================================================="
echo "  FluxWall Anti-DDoS Advanced Features Test Suite         "
echo "=========================================================="
echo "Target URL: $GATEWAY_URL"
echo ""

# Test 1: Healthcheck
echo "[Test 1] Healthcheck Endpoint..."
curl -s "$GATEWAY_URL/healthz"
echo -e "\n"

# Test 2: Bad Bot / Scanner Detection
echo "[Test 2] Bad Bot Detection (User-Agent: sqlmap/1.5.2)..."
bot_status=$(curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: sqlmap/1.5.2" "$GATEWAY_URL/")
if [ "$bot_status" -eq 403 ]; then
    echo "  -> SUCCESS: Malicious Scanner blocked with 403 Forbidden!"
else
    echo "  -> FAILED: Got HTTP Status $bot_status (Expected 403)"
fi
echo ""

# Test 3: Prometheus Metrics Exporter
echo "[Test 3] Prometheus Metrics (/metrics)..."
metrics_sample=$(curl -s "$GATEWAY_URL/metrics" | head -n 8)
echo "$metrics_sample"
echo ""

# Test 4: Admin REST API Stats
echo "[Test 4] Admin REST API (/api/admin/stats)..."
curl -s -H "X-Admin-Key: $ADMIN_KEY" "$GATEWAY_URL/api/admin/stats"
echo -e "\n"

# Test 5: Rate Limiting Burst
echo "[Test 5] Rapid burst requests..."
status_200=0
status_503=0
for i in {1..30}; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/")
    if [ "$code" -eq 200 ]; then ((status_200++)); fi
    if [ "$code" -eq 503 ]; then ((status_503++)); fi
done
echo "  -> 200 OK: $status_200"
echo "  -> 503 Rate Limited: $status_503"
echo ""

echo "=========================================================="
echo "  Testing Completed!                                     "
echo "=========================================================="
