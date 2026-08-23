# 📖 Panduan Lengkap Pemasangan FluxWall Gateway di VPS Linux

Panduan ini menjelaskan secara mendalam cara memasang, mengonfigurasi, mengamankan, dan mengoptimalkan **FluxWall Anti-DDoS & Edge Rate Limiting Gateway** pada server VPS Linux (Ubuntu 20.04/22.04/24.04, Debian, atau AlmaLinux/CentOS).

---

## 📑 Daftar Isi
1. [Spesifikasi & Kebutuhan VPS](#1-spesifikasi--kebutuhan-vps)
2. [Arsitektur & Alur Trafik](#2-arsitektur--alur-trafik)
3. [Pemasangan Otomatis & Cepat (1-Line Installer)](#3-pemasangan-otomatis--cepat-1-line-installer)
4. [Pemasangan Manual dengan Docker (Langkah demi Langkah)](#4-pemasangan-manual-dengan-docker-langkah-demi-langkah)
5. [Pemasangan Native Tanpa Docker (Ubuntu / Debian)](#5-pemasangan-native-tanpa-docker-ubuntu--debian)
6. [Menghubungkan Gateway ke Backend Asli Anda](#6-menghubungkan-gateway-ke-backend-asli-anda)
7. [Konfigurasi SSL / HTTPS Gratis (Let's Encrypt & Certbot)](#7-konfigurasi-ssl--https-gratis-lets-encrypt--certbot)
8. [Tuning Kernel Linux untuk Ketahanan Anti-DDoS L7/L4](#8-tuning-kernel-linux-untuk-ketahanan-anti-ddos-l7l4)
9. [Pengoperasian, Dashboard & Perintah Penting](#9-pengoperasian-dashboard--perintah-penting)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)

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

### Langkah 4.1: Login SSH & Update VPS
```bash
ssh root@IP_VPS_ANDA
apt update && apt upgrade -y
```

### Langkah 4.2: Install Docker & Docker Compose
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

### Langkah 4.3: Clone Repository ke VPS
Jalankan perintah clone langsung di terminal VPS Anda:
```bash
git clone https://github.com/RaffiDevYT/fluxwall-antiddos.git /opt/antiddos
```

### Langkah 4.4: Sesuaikan File Konfigurasi Produksi

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

### Langkah 4.5: Jalankan Gateway
```bash
docker compose up -d --build
```

Periksa status container:
```bash
docker compose ps
```

---

## 5. Pemasangan Native Tanpa Docker (Ubuntu / Debian)

Jika Anda ingin menjalankan OpenResty langsung di sistem operasi VPS:

### Langkah 5.1: Install OpenResty & Redis
```bash
apt install -y wget gnupg ca-certificates lsb-release

# Tambahkan repository OpenResty resmi
wget -O - https://openresty.org/package/pubkey.gpg | gpg --dearmor -o /etc/apt/trusted.gpg.d/openresty.gpg
echo "deb http://openresty.org/package/ubuntu $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/openresty.list

apt update
apt install -y openresty redis-server
systemctl enable --now redis-server
```

### Langkah 5.2: Copy File Konfigurasi & Lua Script
```bash
mkdir -p /usr/local/openresty/nginx/lua
mkdir -p /usr/local/openresty/nginx/admin
mkdir -p /usr/local/openresty/nginx/conf

cp -r /opt/antiddos/lua/* /usr/local/openresty/nginx/lua/
cp -r /opt/antiddos/admin/* /usr/local/openresty/nginx/admin/
cp /opt/antiddos/conf/nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
cp /opt/antiddos/conf/mime.types /usr/local/openresty/nginx/conf/mime.types
```

### Langkah 5.3: Jalankan OpenResty
```bash
openresty -t
systemctl restart openresty
systemctl enable openresty
```

---

## 6. Menghubungkan Gateway ke Backend Asli Anda

Edit file `conf/nginx.conf`:
```bash
nano /opt/antiddos/conf/nginx.conf
```

Cari blok `upstream backend_servers`:
```nginx
upstream backend_servers {
    server host.docker.internal:3000 max_fails=3 fail_timeout=10s;
    keepalive 64;
}
```

Reload Nginx tanpa downtime:
```bash
docker exec antiddos_gateway openresty -s reload
```

---

## 7. Konfigurasi SSL / HTTPS Gratis (Let's Encrypt & Certbot)

```bash
apt install -y certbot
docker stop antiddos_gateway
certbot certonly --standalone -d domainanda.com -d www.domainanda.com
docker compose up -d
```

---

## 8. Tuning Kernel Linux untuk Ketahanan Anti-DDoS L7/L4

```bash
cat << 'EOF' >> /etc/sysctl.conf
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_synack_retries = 2
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

## 9. Pengoperasian, Dashboard & Perintah Penting

### 1. Web Admin Dashboard
Buka: `http://IP_VPS_ANDA:8080/admin/` (atau `https://domainanda.com/admin/`)

### 2. Manajemen via CLI (`fluxwall`)
```bash
fluxwall status
fluxwall logs
fluxwall ban 192.168.1.50 600
fluxwall unban 192.168.1.50
fluxwall whitelist 203.0.113.10
fluxwall reload
```

---

## 10. Troubleshooting & FAQ

#### Q: Gateway mengembalikan `502 Bad Gateway` saat mengakses website
> **Solusi**: Nginx tidak dapat menghubungi backend Anda. Pastikan backend Anda sudah berjalan dan port pada `upstream backend_servers` di `conf/nginx.conf` sudah sesuai.

#### Q: Bagaimana jika Redis mati / crash?
> **Solusi**: Gateway memiliki fitur **Fail-Open**. Jika Redis down, gateway mengizinkan trafik normal tetap masuk sambil mencatat log warning.
