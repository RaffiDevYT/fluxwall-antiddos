# 📖 Panduan Lengkap Pemasangan FluxWall Gateway di VPS Linux

Panduan ini menjelaskan secara mendalam cara memasang, mengonfigurasi, mengamankan, dan mengoptimalkan **FluxWall Anti-DDoS & Edge Rate Limiting Gateway** pada server VPS Linux (Ubuntu 20.04/22.04/24.04, Debian, atau AlmaLinux/CentOS).

---

## 📑 Daftar Isi
1. [Spesifikasi & Kebutuhan VPS](#1-spesifikasi--kebutuhan-vps)
2. [Arsitektur & Alur Trafik](#2-arsitektur--alur-trafik)
3. [Metode 1: Pemasangan dengan Docker (Paling Direkomendasikan)](#3-metode-1-pemasangan-dengan-docker-paling-direkomendasikan)
4. [Metode 2: Pemasangan Native Tanpa Docker (Ubuntu / Debian)](#4-metode-2-pemasangan-native-tanpa-docker-ubuntu--debian)
5. [Menghubungkan Gateway ke Backend Asli Anda](#5-menghubungkan-gateway-ke-backend-asli-anda)
6. [Konfigurasi SSL / HTTPS Gratis (Let's Encrypt & Certbot)](#6-konfigurasi-ssl--https-gratis-lets-encrypt--certbot)
7. [Tuning Kernel Linux untuk Ketahanan Anti-DDoS L7/L4](#7-tuning-kernel-linux-untuk-ketahanan-anti-ddos-l7l4)
8. [Pengoperasian, Dashboard & Perintah Penting](#8-pengoperasian-dashboard--perintah-penting)
9. [Troubleshooting & FAQ](#9-troubleshooting--faq)

---

## 1. Spesifikasi & Kebutuhan VPS

* **Sistem Operasi**: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS (atau Debian 11/12)
* **CPU**: Minimal 1 vCPU (Direkomendasikan 2+ vCPU untuk beban > 5.000 QPS)
* **RAM**: Minimal 1 GB (Direkomendasikan 2 GB+)
* **Akses**: Akses `root` atau user dengan hak `sudo`
* **Port Terbuka**: Port `80` (HTTP), `443` (HTTPS), dan `22` (SSH)

---

## 2. Arsitektur & Alur Trafik

Gateway ini bertindak sebagai **Reverse Proxy Terdepan (Edge)** yang menerima semua request dari internet sebelum diteruskan ke aplikasi backend Anda:

```
[ Pengunjung / Penyerang ]
            │
            ▼ (Port 80 / 443)
┌─────────────────────────────────────────────────────────────┐
│ VPS LINUX ANDA                                              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🌊 FluxWall Gateway (OpenResty + LuaJIT)              │  │
│  │  1. Filter Bad Bot & Vulnerability Scanner (sqlmap)   │  │
│  │  2. Fast Whitelist & Blacklist Check (L1 Shared Dict) │  │
│  │  3. Adaptive Surge Mode (Global Traffic Shaper)       │  │
│  │  4. Dynamic Rate Limiting & Auto-Ban Threshold        │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                               │
│              (State Store)  │  (Hanya Trafik Valid)         │
│                     ▼       ▼                               │
│             ┌─────────┐   ┌──────────────────────────────┐  │
│             │  Redis  │   │  Aplikasi Backend Anda       │  │
│             │ (Port   │   │  (Laravel / Node.js /        │  │
│             │  6379)  │   │   Python / Go di Port 3000)  │  │
│             └─────────┘   └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Pemasangan Otomatis & Cepat (1-Line Installer)

Cara paling mudah dan cepat untuk memasang FluxWall di VPS Linux adalah menggunakan installer otomatis:

```bash
curl -fsSL https://raw.githubusercontent.com/RaffiDevYT/fluxwall-antiddos/main/install.sh | sudo bash
```
Installer ini akan memandu Anda secara interaktif (meminta host backend, rate limit, dan otomatis memasang Docker, tuning kernel, serta CLI `fluxwall`).

---

## 4. Pemasangan Manual dengan Docker (Langkah demi Langkah)

### Langkah 3.1: Login SSH & Update VPS
```bash
ssh root@IP_VPS_ANDA
apt update && apt upgrade -y
```

### Langkah 3.2: Install Docker & Docker Compose
```bash
# Install Docker Engine resmi
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install plugin Docker Compose
apt install -y docker-compose-plugin

# Verifikasi instalasi
docker --version
docker compose version
```

### Langkah 3.3: Clone Repository ke VPS
Jalankan perintah clone langsung di terminal VPS Anda:
```bash
git clone https://github.com/RaffiDevYT/fluxwall-antiddos.git /opt/antiddos
```

### Langkah 3.4: Sesuaikan File Konfigurasi Produksi

Masuk ke folder proyek di VPS:
```bash
cd /opt/antiddos
```

Buka dan sesuaikan `docker-compose.yml`:
```bash
nano docker-compose.yml
```
Pastikan port diarahkan ke port publik **80** dan ganti **ADMIN_API_KEY** dengan password rahasia Anda:

```yaml
version: '3.8'

services:
  gateway:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: antiddos_gateway
    ports:
      - "80:80"
      - "443:443"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - ADMIN_API_KEY=GantiDenganPasswordSangatKuat2026!
    volumes:
      - ./conf/nginx.conf:/usr/local/openresty/nginx/conf/nginx.conf:ro
      - ./lua:/usr/local/openresty/nginx/lua:ro
      - ./admin:/usr/local/openresty/nginx/admin:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - redis
    restart: always
    networks:
      - antiddos_net

  redis:
    image: redis:7-alpine
    container_name: antiddos_redis
    command: redis-server --save "" --appendonly no --maxmemory 256mb --maxmemory-policy allkeys-lru
    restart: always
    networks:
      - antiddos_net

networks:
  antiddos_net:
    driver: bridge
```

### Langkah 3.5: Jalankan Gateway
```bash
docker compose up -d --build
```

Periksa status container:
```bash
docker compose ps
```
Output yang benar akan menunjukkan status `Up` untuk `antiddos_gateway` dan `antiddos_redis`.

---

## 4. Metode 2: Pemasangan Native Tanpa Docker (Ubuntu / Debian)

Jika Anda ingin menjalankan OpenResty langsung di sistem operasi VPS:

### Langkah 4.1: Install OpenResty & Redis
```bash
# 1. Install dependensi
apt install -y wget gnupg ca-certificates lsb-release

# 2. Tambahkan repository OpenResty resmi
wget -O - https://openresty.org/package/pubkey.gpg | gpg --dearmor -o /etc/apt/trusted.gpg.d/openresty.gpg
echo "deb http://openresty.org/package/ubuntu $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/openresty.list

# 3. Install OpenResty dan Redis
apt update
apt install -y openresty redis-server

# 4. Pastikan Redis berjalan
systemctl enable --now redis-server
```

### Langkah 4.2: Copy File Konfigurasi & Lua Script
```bash
# Buat direktori tujuan
mkdir -p /usr/local/openresty/nginx/lua
mkdir -p /usr/local/openresty/nginx/admin
mkdir -p /usr/local/openresty/nginx/conf

# Copy file dari proyek Anda
cp -r /opt/antiddos/lua/* /usr/local/openresty/nginx/lua/
cp -r /opt/antiddos/admin/* /usr/local/openresty/nginx/admin/
cp /opt/antiddos/conf/nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
cp /opt/antiddos/conf/mime.types /usr/local/openresty/nginx/conf/mime.types
```

### Langkah 4.3: Test Konfigurasi & Jalankan OpenResty
```bash
# Test sintaks konfigurasi Nginx/Lua
openresty -t

# Restart service OpenResty
systemctl restart openresty
systemctl enable openresty
```

---

## 5. Menghubungkan Gateway ke Backend Asli Anda

Edit file `conf/nginx.conf`:
```bash
nano /opt/antiddos/conf/nginx.conf
```

Cari blok `upstream backend_servers` dan sesuaikan dengan tipe backend Anda:

### Opsi A: Backend Node.js / Python / Go di Port Host VPS (misal Port 3000)
```nginx
upstream backend_servers {
    # Jika menggunakan Docker (extra_hosts):
    server host.docker.internal:3000 max_fails=3 fail_timeout=10s;
    
    # Jika native (tanpa Docker):
    # server 127.0.0.1:3000 max_fails=3 fail_timeout=10s;
    
    keepalive 64;
}
```

### Opsi B: Backend PHP-FPM (Laravel / WordPress)
```nginx
# Untuk PHP-FPM di host:
location ~ \.php$ {
    access_by_lua_file /usr/local/openresty/nginx/lua/gateway.lua;
    include fastcgi_params;
    fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

Setelah mengubah `conf/nginx.conf`, terapkan perubahan tanpa downtime:
```bash
# Jika pakai Docker:
docker exec antiddos_gateway openresty -s reload

# Jika native:
systemctl reload openresty
```

---

## 6. Konfigurasi SSL / HTTPS Gratis (Let's Encrypt & Certbot)

### Langkah 6.1: Dapatkan Sertifikat SSL
Pastikan Domain Anda sudah diarahkan (DNS A Record) ke IP VPS Anda, lalu install Certbot:
```bash
apt install -y certbot

# Matikan sementara gateway jika port 80 sedang dipakai Certbot standalone
docker stop antiddos_gateway

# Generate SSL
certbot certonly --standalone -d domainanda.com -d www.domainanda.com
```

### Langkah 6.2: Tambahkan Konfigurasi SSL di `conf/nginx.conf`
Tambahkan blok server HTTPS di `conf/nginx.conf`:

```nginx
server {
    listen 80;
    server_name domainanda.com www.domainanda.com;
    # Redirect HTTP ke HTTPS otomatis
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name domainanda.com www.domainanda.com;

    ssl_certificate /etc/letsencrypt/live/domainanda.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domainanda.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /admin/ {
        alias /usr/local/openresty/nginx/admin/;
        index index.html;
    }

    location /api/admin/ {
        content_by_lua_block {
            require("admin_api").handle_request()
        }
    }

    location /metrics {
        content_by_lua_block {
            ngx.say(require("metrics").export_prometheus_text())
        }
    }

    location / {
        access_by_lua_file /usr/local/openresty/nginx/lua/gateway.lua;
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Jalankan kembali container:
```bash
docker compose up -d
```

---

## 7. Tuning Kernel Linux untuk Ketahanan Anti-DDoS L7/L4

Agar VPS mampu menampung lonjakan paket dan ribuan koneksi konkuren (*concurrent connection*) tanpa mengalami kehabisan socket (*socket exhaustion*):

### Langkah 7.1: Terapkan Parameter Sysctl
Jalankan perintah berikut di VPS:
```bash
cat << 'EOF' >> /etc/sysctl.conf
# Proteksi SYN Flood & Buffer Connection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_synack_retries = 2

# Tingkatkan batas antrian koneksi soket
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535

# Optimalkan alokasi port & reuse TIME_WAIT sockets
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15

# Tingkatkan batas file descriptor sistem
fs.file-max = 2097152
EOF

# Terapkan perubahan langsung
sysctl -p
```

### Langkah 7.2: Tingkatkan Batas File Descriptor (Ulimit)
```bash
cat << 'EOF' >> /etc/security/limits.conf
* soft nofile 65535
* hard nofile 65535
root soft nofile 65535
root hard nofile 65535
EOF
```

---

## 8. Pengoperasian, Dashboard & Perintah Penting

### 1. Membuka Web Admin Dashboard
Buka browser dan akses:
```text
http://IP_VPS_ANDA/admin/
(atau https://domainanda.com/admin/)
```
* Masukkan **Admin Key** yang telah Anda tentukan di `docker-compose.yml` (misal `GantiDenganPasswordSangatKuat2026!`).
* Anda dapat memantau grafik QPS, status Surge Mode, dan melakukan **Unban IP** hanya dengan 1 klik.

### 2. Mengelola Blacklist & Whitelist via Redis Langsung
```bash
# Masuk ke Redis CLI di Docker:
docker exec -it antiddos_redis redis-cli

# Tambah IP ke Blacklist Permanen:
SADD ip:blacklist "198.51.100.22"

# Ban IP Sementara selama 10 Menit (600 detik):
SETEX ip:ban:198.51.100.22 600 "Serangan Brute Force"

# Tambah IP ke Whitelist (Bypass Semua Limit):
SADD ip:whitelist "203.0.113.10"

# Lihat Semua IP yang Sedang Di-Ban:
KEYS "ip:ban:*"
```

### 3. Melihat Log Serangan Real-Time
```bash
# Log Nginx Access & Security Event
docker logs -f antiddos_gateway
```

---

## 9. Troubleshooting & FAQ

#### Q: Gateway mengembalikan `502 Bad Gateway` saat mengakses website
> **Solusi**: Nginx tidak dapat menghubungi backend Anda. Pastikan backend Anda sudah berjalan dan port pada `upstream backend_servers` di `conf/nginx.conf` sudah sesuai.

#### Q: Bagaimana jika Redis mati / crash?
> **Solusi**: Gateway memiliki fitur **Fail-Open**. Jika Redis down, gateway tidak akan menghentikan website Anda, melainkan mengizinkan trafik normal tetap masuk sambil mencatat peringatan di log.

#### Q: Bagaimana cara mengubah threshold rate limit?
> **Solusi**: Edit file `lua/config.lua`, sesuaikan parameter `default_limit` atau `endpoint_limits`, lalu reload gateway dengan:
> `docker exec antiddos_gateway openresty -s reload`
