# 🌊 FluxWall - Nginx-Lua Anti-DDoS & Edge Rate Limiting Gateway

> **"Intelligent Edge Flow & Flood Control. Zero Backend Impact."**  
> High-performance Layer 7 Anti-DDoS, Adaptive Traffic Shaper, and Bot Mitigation Gateway built on OpenResty (Nginx + LuaJIT) & Redis.

---

## 💡 Filosofi & Makna Nama Proyek (**FluxWall**)

* **Flux ( /ˈflʌks/ )**: Melambangkan aliran arus trafik data berkecepatan tinggi yang dinamis dan terus berubah. Dalam fisika dan komputasi jaringan, *flux* menggambarkan laju perpindahan volume data per satuan waktu.
* **Wall**: Menggambarkan tembok pertahanan kokoh di lapisan terdepan (*edge perimeter*) yang mampu meredam dan memecah gelombang pasang banjir trafik (*HTTP Flood, Slowloris, Brute Force*) sebelum menyentuh server aplikasi backend.

Kombinasi **FluxWall** merepresentasikan sebuah gerbang pintar yang mampu mengontrol dan menstabilkan aliran trafik secara adaptif (*Adaptive Traffic Shaper*) dengan latensi sub-milidetik.

---

## 🚀 Key Features

* **Sub-Millisecond Processing**: LuaJIT executes asynchronously inside Nginx worker event loops with minimal CPU/RAM overhead.
* **L1 In-Memory Fast Cache (`lua_shared_dict`)**: Microsecond-level lookups for active blacklists and whitelists, offloading Redis from direct flood traffic.
* **Bad Bot & Vulnerability Scanner Blocker**: Automatically drops requests from attack tools (*sqlmap, nikto, dirbuster, masscan, nmap, exploit path probes*).
* **Adaptive Surge Mode (Global Auto-Tuning)**: Detects sudden massive traffic spikes and automatically tightens rate limits across all incoming IPs until traffic normalizes.
* **Prometheus Metrics Exporter (`/metrics`)**: Exposes native Prometheus metrics for scraping by Prometheus and Grafana.
* **Web Admin Dashboard (`/admin/`)**: Real-time dark-mode GUI with live QPS charts, active ban management, whitelist manager, and quick controls.
* **Protected Admin REST API (`/api/admin/*`)**: Programmatic API to ban/unban IPs, manage lists, and retrieve gateway health metrics.
* **Per-IP & Endpoint-Specific Rate Limiting**: Sliding/fixed time window counters in Redis with burst handling & HTTP method token multipliers (e.g. `POST` counts 2x).
* **Automated Temporary Banning (Auto-Ban)**: Automatically bans offending IPs for a configurable duration (e.g. 15 minutes) after repeated infractions.
* **Fail-Open Architecture**: Gracefully allows legitimate traffic through if Redis is temporarily unreachable or times out, avoiding a Single Point of Failure (SPOF).
* **Accurate Real IP Extraction**: Supports Cloudflare (`CF-Connecting-IP`), `X-Forwarded-For`, and `X-Real-IP`.

---

## 📁 Project Structure

```text
.
├── admin/                      # Web Admin Dashboard SPA
│   ├── index.html              # Modern Cyber Dashboard UI
│   ├── app.js                  # Live chart, polling, and REST API controller
│   └── style.css               # Glassmorphism dark-theme styling
├── conf/
│   ├── nginx.conf              # Nginx OpenResty configuration (routes, shared dicts)
│   └── mime.types              # MIME types definitions
├── lua/
│   ├── config.lua              # System configuration (limits, Redis config, auto-ban, bot signatures)
│   ├── redis_pool.lua          # Safe Redis connection pool with keepalive & fail-open
│   ├── ip_extractor.lua        # Client IP resolver (Cloudflare, XFF, X-Real-IP)
│   ├── bot_filter.lua          # Bad bot, scanner, and exploit probe filter
│   ├── surge_protector.lua     # Global QPS tracker and adaptive rate scaler
│   ├── metrics.lua             # Prometheus metrics collector & text exporter
│   ├── admin_api.lua           # Protected REST API for gateway administration
│   ├── whitelist.lua           # Whitelist logic (L1 cache + Redis set)
│   ├── blacklist.lua           # Blacklist & Temporary Ban logic
│   ├── rate_limiter.lua        # Dynamic rate limiting per IP & endpoint (with method weights)
│   ├── auto_ban.lua            # Infraction counter and automated banning
│   ├── gateway.lua             # Master pipeline entrypoint (access_by_lua)
│   └── logger.lua              # Structured security event logger
├── docker/
│   └── backend/                # Mock upstream backend server (Node.js)
│       └── server.js
├── test/
│   ├── test_rate_limit.ps1     # Extended PowerShell automated test suite
│   └── test_rate_limit.sh      # Extended Bash automated test suite
├── Dockerfile                  # OpenResty custom Docker build
├── docker-compose.yml          # Multi-container stack (Gateway, Redis, Mock Backend)
└── README.md
```

---

## 🛠️ Quick Start with Docker

> 📖 **Panduan Pemasangan Lengkap di Server VPS Linux**: Silakan baca **[TUTORIAL_VPS.md](file:///c:/laragon/www/antiddos/TUTORIAL_VPS.md)** untuk petunjuk instalasi step-by-step di Ubuntu/Debian, setup SSL Let's Encrypt, integrasi backend Laravel/Node.js, dan tuning kernel anti-DDoS.

### 1. Start the Stack
```bash
docker-compose up -d --build
```
This starts:
* **Gateway (OpenResty)** on `http://localhost:8080`
* **Admin Dashboard UI** on `http://localhost:8080/admin/`
* **Prometheus Metrics** on `http://localhost:8080/metrics`
* **Redis** on `localhost:6379`
* **Mock Backend** on internal port `3000`

### 2. Access the Admin Dashboard
Open **`http://localhost:8080/admin/`** in your browser to view real-time QPS charts, active bans, and manage whitelists/blacklists with a single click.

---

## 🔌 Admin REST API Endpoints (`/api/admin/*`)

Include the header `X-Admin-Key: super-secret-admin-key-2026` or URL query parameter `?api_key=...` for authentication.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Returns QPS, active ban count, surge mode state |
| `GET` | `/api/admin/bans` | Lists all active temporary bans & remaining TTLs |
| `POST` | `/api/admin/bans` | Manually bans an IP: `{"ip": "1.2.3.4", "duration_sec": 600, "reason": "Attack"}` |
| `DELETE` | `/api/admin/bans?ip=1.2.3.4` | Unbans an IP immediately |
| `GET` | `/api/admin/whitelist` | Lists all whitelisted IPs |
| `POST` | `/api/admin/whitelist` | Whitelists an IP: `{"ip": "203.0.113.5"}` |
| `DELETE` | `/api/admin/whitelist?ip=203.0.113.5` | Removes IP from whitelist |
| `GET` | `/api/admin/blacklist` | Lists permanently blacklisted IPs |
| `POST` | `/api/admin/blacklist` | Adds IP to permanent blacklist |
| `DELETE` | `/api/admin/blacklist?ip=...` | Removes IP from blacklist |

---

## 📊 Prometheus Integration (`/metrics`)

Configure your `prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'aegisguard_gateway'
    scrape_interval: 5s
    static_configs:
      - targets: ['gateway:80']
```

Exposed metrics include:
* `gateway_http_requests_total{status, protection, method}`
* `gateway_blocked_requests_total{reason}`
* `gateway_surge_mode_active`
* `gateway_global_qps`
* `gateway_active_bans`

---

## 🧪 Testing & Verification

### PowerShell (Windows):
```powershell
.\test\test_rate_limit.ps1
```

### Bash (Linux / macOS):
```bash
bash test/test_rate_limit.sh
```

---

## ⚙️ Configuration Reference (`lua/config.lua`)

| Option | Description | Default |
| :--- | :--- | :--- |
| `admin.api_key` | Secret key for Admin Dashboard and REST API | `super-secret-admin-key-2026` |
| `surge_mode.enabled` | Activate dynamic rate tightening during traffic spikes | `true` |
| `surge_mode.qps_threshold` | Global QPS threshold triggering surge mode | `200` req/s |
| `surge_mode.rate_scale_factor` | Per-IP limit reduction factor during surge | `0.5` (50%) |
| `default_limit.max_requests` | Global max requests per window | `20` |
| `default_limit.burst` | Allowed burst before `503` is returned | `5` |
| `auto_ban.max_violations` | Rate-limit violations before auto-ban | `5` |
| `auto_ban.ban_duration_sec`| Auto-ban duration in seconds | `900` (15 mins) |

---

## 📄 License
MIT
