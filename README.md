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
├── bin/                        # CLI Binaries & Utilities
│   └── fluxwall.sh             # Gateway management CLI utility
├── conf/                       # Nginx Configuration
│   ├── nginx.conf              # Nginx OpenResty configuration (routes, shared dicts)
│   └── mime.types              # MIME types definitions
├── docker/                     # Mock backend & container definitions
│   └── backend/
│       └── server.js
├── docs/                       # Comprehensive Documentation
│   └── TUTORIAL_VPS.md         # Panduan deployment VPS lengkap
├── lua/                        # Lua Security Modules
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
├── scripts/                    # Automation Scripts
│   ├── install.sh              # Interactive 1-line automated installer
│   └── uninstall.sh            # Clean automated uninstaller
├── test/                       # Automated Test Suites
│   ├── test_rate_limit.ps1     # Extended PowerShell automated test suite
│   └── test_rate_limit.sh      # Extended Bash automated test suite
├── Dockerfile                  # OpenResty custom Docker build
├── docker-compose.yml          # Multi-container stack (Gateway, Redis, Mock Backend)
├── install.sh                  # Quick install entrypoint
├── uninstall.sh                # Quick uninstall entrypoint
├── LICENSE                     # MIT License
└── README.md
```

---

## ⚡ Quick Install (1-Line Command untuk VPS Linux)

Cukup jalankan **1 baris perintah** ini di terminal VPS Anda (Ubuntu / Debian / CentOS / AlmaLinux):

```bash
curl -fsSL https://raw.githubusercontent.com/RaffiDevYT/fluxwall-antiddos/main/install.sh | sudo bash
```

> **Apa yang dilakukan installer otomatis ini?**
> 1. Otomatis mendeteksi sistem dan menginstall Docker & Docker Compose jika belum ada.
> 2. Menanyakan Host/Port target backend Anda (misal `host.docker.internal:3000` atau IP lokal).
> 3. Meng-generate **Admin Secret Key** acak yang aman.
> 4. Mengoptimalkan **Kernel Linux sysctl** untuk proteksi Anti-SYN flood dan buffer koneksi.
> 5. Memasang tool CLI `fluxwall` secara global di VPS.
> 6. Menjalankan seluruh container secara otomatis dengan `docker compose up -d`.

---

## 🗑️ Cara Uninstall FluxWall

Jika Anda ingin menghapus FluxWall beserta containernya secara bersih dari VPS, gunakan salah satu cara berikut:

```bash
# Opsi 1: Menggunakan CLI fluxwall
fluxwall uninstall

# Opsi 2: 1-Line command via curl
curl -fsSL https://raw.githubusercontent.com/RaffiDevYT/fluxwall-antiddos/main/uninstall.sh | sudo bash
```

---

## 🛠️ Manajemen Cepat via CLI (`fluxwall`)

Setelah terpasang, Anda dapat mengelola gateway langsung dari terminal VPS:

| Perintah | Deskripsi |
| :--- | :--- |
| `fluxwall status` | Melihat status container, QPS, dan jumlah ban aktif |
| `fluxwall logs` | Melihat streaming log serangan & akses real-time |
| `fluxwall ban <ip> [ttl] [alasan]` | Memblokir IP sementara (default 900 detik / 15 menit) |
| `fluxwall unban <ip>` | Membuka blokir IP |
| `fluxwall whitelist <ip>` | Menambahkan IP ke Whitelist (bypass rate limit) |
| `fluxwall blacklist <ip>` | Menambahkan IP ke Blacklist Permanen |
| `fluxwall reload` | Reload konfigurasi Nginx/Lua tanpa downtime |
| `fluxwall restart` | Restart seluruh layanan gateway & Redis |
| `fluxwall uninstall` | Menghapus seluruh container & konfigurasi FluxWall |

---

## 📖 Panduan Manual Pemasangan di VPS Linux (Ubuntu / Debian)

Jika Anda ingin melakukan instalasi secara manual langkah demi langkah:

### 1. Update VPS & Install Docker
Login ke VPS via SSH, lalu jalankan:
```bash
# Update sistem
apt update && apt upgrade -y

# Install Docker Engine & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose-plugin
```

### 2. Clone Repository FluxWall
```bash
git clone https://github.com/RaffiDevYT/fluxwall-antiddos.git /opt/antiddos
cd /opt/antiddos
```

### 3. Sesuaikan Konfigurasi Produksi
Buka `docker-compose.yml`:
```bash
nano docker-compose.yml
```
* Ubah port ke port web publik: `"80:80"` dan `"443:443"`.
* Ganti `ADMIN_API_KEY` dengan password rahasia yang kuat.

Buka `conf/nginx.conf` untuk menghubungkan ke backend aplikasi Anda:
```bash
nano conf/nginx.conf
```
Arahkan blok `upstream backend_servers` ke port aplikasi backend Anda (misal Node.js/PHP di port 3000):
```nginx
upstream backend_servers {
    server host.docker.internal:3000 max_fails=3 fail_timeout=10s;
    keepalive 64;
}
```

### 4. Jalankan FluxWall Gateway
```bash
docker compose up -d --build
```

### 5. Setup SSL / HTTPS Gratis (Let's Encrypt / Certbot)
```bash
apt install -y certbot
docker stop antiddos_gateway
certbot certonly --standalone -d domainanda.com -d www.domainanda.com
docker compose up -d
```

### 6. Tuning Kernel Linux VPS (Ketahanan Anti-DDoS)
Jalankan perintah ini di VPS untuk mengoptimalkan socket & antrian koneksi sistem:
```bash
cat << 'EOF' >> /etc/sysctl.conf
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 65535
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
fs.file-max = 2097152
EOF

sysctl -p
```

---

## 🖥️ Web Admin Dashboard (`/admin/`)

Buka browser Anda dan akses:
```text
http://IP_VPS_ANDA/admin/   (atau https://domainanda.com/admin/)
```
* **Real-time Live QPS Chart**: Memantau volume trafik per detik secara streaming.
* **Surge Mode Indicator**: Menampilkan status pertahanan lonjakan trafik secara otomatis.
* **1-Click IP Unban**: Membuka blokir IP yang terkena auto-ban langsung dari UI.
* **Whitelist & Blacklist Manager**: Menambah/menghapus IP tanpa perlu reload Nginx.

---

## 🔌 Admin REST API Endpoints (`/api/admin/*`)

Gunakan header `X-Admin-Key: <SECRET_KEY>` atau query parameter `?api_key=...`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Status global QPS, active bans, status Surge Mode |
| `GET` | `/api/admin/bans` | Daftar IP yang sedang di-ban beserta sisa waktu TTL |
| `POST` | `/api/admin/bans` | Ban manual: `{"ip": "1.2.3.4", "duration_sec": 600, "reason": "Attack"}` |
| `DELETE` | `/api/admin/bans?ip=1.2.3.4` | Unban IP secara instan |
| `GET` | `/api/admin/whitelist` | Daftar IP yang masuk whitelist |
| `POST` | `/api/admin/whitelist` | Tambah IP ke whitelist: `{"ip": "203.0.113.5"}` |
| `DELETE` | `/api/admin/whitelist?ip=203.0.113.5` | Hapus IP dari whitelist |
| `GET` | `/api/admin/blacklist` | Daftar IP blacklist permanen |
| `POST` | `/api/admin/blacklist` | Tambah IP ke blacklist permanen |
| `DELETE` | `/api/admin/blacklist?ip=...` | Hapus IP dari blacklist |

---

## 📊 Prometheus Integration (`/metrics`)

Tambahkan ke konfigurasi `prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'fluxwall_gateway'
    scrape_interval: 5s
    static_configs:
      - targets: ['gateway:80']
```

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
| `admin.api_key` | Secret key untuk Web Dashboard dan REST API | `super-secret-admin-key-2026` |
| `surge_mode.enabled` | Mengaktifkan perlindungan lonjakan trafik global | `true` |
| `surge_mode.qps_threshold` | Ambang batas QPS pemicu Surge Mode | `200` req/s |
| `surge_mode.rate_scale_factor` | Faktor pengetatan rate limit saat lonjakan | `0.5` (50%) |
| `default_limit.max_requests` | Batas request global per IP per detik | `20` |
| `default_limit.burst` | Toleransi burst sebelum dikembalikan `503` | `5` |
| `auto_ban.max_violations` | Batas pelanggaran sebelum terkena Auto-Ban | `5` |
| `auto_ban.ban_duration_sec`| Durasi Auto-Ban dalam detik | `900` (15 menit) |

---

## 📄 License
MIT License - Copyright (c) 2026 [RaffiDevYT](https://github.com/RaffiDevYT)
