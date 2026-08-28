#!/usr/bin/env bash

# ==============================================================================
#  FluxWall - Interactive Automated VPS Installer
#  GitHub: https://github.com/RaffiDevYT/fluxwall-antiddos
# ==============================================================================

set -eo pipefail

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear 2>/dev/null || true

echo -e "${CYAN}"
cat << "EOF"
  ______ _             __          __   _ _ 
 |  ____| |            \ \        / /  | | |
 | |__  | |_   ___  __  \ \  /\  / /_ _| | |
 |  __| | | | | \ \/ /   \ \/  \/ / _` | | |
 | |    | | |_| |>  <     \  /\  / (_| | | |
 |_|    |_|\__,_/_/\_\     \/  \/ \__,_|_|_|
                                            
   Intelligent Edge Flow & Anti-DDoS Gateway
EOF
echo -e "${NC}"
echo -e "${BOLD}Selamat datang di Wizard Instalasi Otomatis FluxWall!${NC}\n"

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Harap jalankan script ini dengan hak akses root (sudo bash install.sh)${NC}"
  exit 1
fi

INSTALL_DIR="/opt/fluxwall-antiddos"

# 2. Check & Install System Dependencies
echo -e "${YELLOW}[1/7] Memeriksa dependensi sistem...${NC}"
if ! command -v curl &> /dev/null || ! command -v git &> /dev/null || ! command -v openssl &> /dev/null; then
    echo -e "  -> Menginstall curl, git, dan openssl..."
    if command -v apt-get &> /dev/null; then
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -y && apt-get install -y curl git openssl ca-certificates
    elif command -v yum &> /dev/null; then
        yum install -y curl git openssl ca-certificates
    fi
fi
echo -e "${GREEN}  [OK] Dependensi sistem siap.${NC}\n"

# 3. Check & Configure Virtual Memory (Swap) on Low RAM VPS (< 2GB)
echo -e "${YELLOW}[2/7] Memeriksa kapasitas RAM & Virtual Memory...${NC}"
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
SWAP_RAM_MB=$(free -m | awk '/^Swap:/{print $2}')

if [ "$TOTAL_RAM_MB" -lt 2000 ] && [ "$SWAP_RAM_MB" -lt 512 ]; then
    echo -e "  -> RAM terdeteksi ${TOTAL_RAM_MB}MB (< 2GB). Menyiapkan 2GB Swap Memory agar build Docker tidak crash..."
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
        chmod 600 /swapfile
        mkswap /swapfile >/dev/null 2>&1
        swapon /swapfile >/dev/null 2>&1
        if ! grep -q "/swapfile" /etc/fstab; then
            echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
        fi
        echo -e "${GREEN}  [OK] 2GB Swap Memory berhasil diaktifkan.${NC}"
    fi
else
    echo -e "${GREEN}  [OK] Kapasitas memori sistem memadai (${TOTAL_RAM_MB}MB RAM, ${SWAP_RAM_MB}MB Swap).${NC}"
fi
echo ""

# 4. Check & Install Docker & Docker Compose
echo -e "${YELLOW}[3/7] Memeriksa Docker & Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "  -> Docker belum terpasang. Memulai instalasi otomatis Docker..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh >/dev/null 2>&1
    rm -f /tmp/get-docker.sh
    if command -v apt-get &> /dev/null; then
        apt-get install -y docker-compose-plugin >/dev/null 2>&1 || true
    fi
    systemctl enable --now docker >/dev/null 2>&1 || true
    echo -e "${GREEN}  [OK] Docker berhasil dipasang.${NC}"
else
    echo -e "${GREEN}  [OK] Docker sudah terpasang.${NC}"
fi
echo ""

# 5. Clone or Update Repository
echo -e "${YELLOW}[4/7] Mengunduh source code FluxWall...${NC}"
if [ -d "$INSTALL_DIR/.git" ]; then
    echo -e "  -> Direktori $INSTALL_DIR sudah ada. Memperbarui file terbaru..."
    cd "$INSTALL_DIR"
    git fetch --all --quiet && git reset --hard origin/main --quiet
else
    echo -e "  -> Melakukan clone repository ke $INSTALL_DIR..."
    rm -rf "$INSTALL_DIR" 2>/dev/null || true
    git clone https://github.com/RaffiDevYT/fluxwall-antiddos.git "$INSTALL_DIR" --quiet
    cd "$INSTALL_DIR"
fi
echo -e "${GREEN}  [OK] Source code FluxWall siap.${NC}\n"

# 6. Interactive Configuration (Clear, Explicit & Non-Freezing)
echo -e "${CYAN}======================================================"
echo -e "        PENGATURAN KONFIGURASI FLUXWALL               "
echo -e "======================================================${NC}"

# Helper for robust terminal input
read_input() {
    local input=""
    if [ -c /dev/tty ] && [ -r /dev/tty ]; then
        read -r input < /dev/tty || input=""
    else
        read -r input || input=""
    fi
    echo "$input"
}

# 6a. Backend Upstream Host/Port
echo -ne "${YELLOW}1. Masukkan Host/Port Backend Anda [default: host.docker.internal:3000]: ${NC}"
RAW_BACKEND=$(read_input)
BACKEND_TARGET=$(echo "${RAW_BACKEND:-host.docker.internal:3000}" | sed -e 's|^http://||' -e 's|^https://||' -e 's|/$||' -e 's| //*|/|g')
[ -z "$BACKEND_TARGET" ] && BACKEND_TARGET="host.docker.internal:3000"
echo -e "${GREEN}   -> Target Backend: ${BOLD}${BACKEND_TARGET}${NC}\n"

# 6b. Safe Secret Key Generation
DEFAULT_SECRET=$(openssl rand -hex 16 2>/dev/null || echo "fluxwall_admin_$(date +%s)")
echo -ne "${YELLOW}2. Masukkan Admin API Secret Key [default: ${DEFAULT_SECRET}]: ${NC}"
RAW_SECRET=$(read_input)
ADMIN_SECRET="${RAW_SECRET:-$DEFAULT_SECRET}"
echo -e "${GREEN}   -> Admin Secret Key: ${BOLD}${ADMIN_SECRET}${NC}\n"

# 6c. Rate Limit Requests
echo -ne "${YELLOW}3. Batas Rate Limit per IP per detik [default: 20]: ${NC}"
RAW_RATE=$(read_input)
MAX_REQ=$(echo "${RAW_RATE:-20}" | tr -dc '0-9')
[ -z "$MAX_REQ" ] && MAX_REQ=20
echo -e "${GREEN}   -> Rate Limit: ${BOLD}${MAX_REQ} req/s${NC}\n"

echo -e "${YELLOW}[5/7] Menyimpan konfigurasi...${NC}"

# Update conf/nginx.conf with backend target
if [ -f conf/nginx.conf ]; then
    sed -i -E "s|server (backend|host.docker.internal):3000.*|server ${BACKEND_TARGET} max_fails=3 fail_timeout=10s;|g" conf/nginx.conf
fi

# Update docker-compose.yml with Admin Key
if [ -f docker-compose.yml ]; then
    sed -i "s|- ADMIN_API_KEY=.*|- ADMIN_API_KEY=${ADMIN_SECRET}|g" docker-compose.yml
fi

# Update lua/config.lua with Max Requests if customized
if [ -f lua/config.lua ] && [ "$MAX_REQ" != "20" ]; then
    sed -i "s|max_requests = 20|max_requests = ${MAX_REQ}|g" lua/config.lua
fi
echo -e "${GREEN}  [OK] Konfigurasi berhasil disimpan.${NC}\n"

# 7. Apply Linux Kernel Anti-DDoS Sysctl Hardening
echo -e "${YELLOW}[6/7] Menerapkan Hardening Kernel Linux Anti-DDoS...${NC}"
if ! grep -q "net.ipv4.tcp_syncookies" /etc/sysctl.conf 2>/dev/null; then
cat << 'EOF' >> /etc/sysctl.conf

# FluxWall Anti-DDoS Kernel Hardening
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 65535
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
fs.file-max = 2097152
EOF
sysctl -p > /dev/null 2>&1 || true
echo -e "${GREEN}  [OK] Parameter kernel sysctl berhasil dioptimalkan.${NC}"
else
echo -e "${GREEN}  [OK] Parameter kernel sysctl sudah optimal.${NC}"
fi
echo ""

# 8. Install Global CLI Utility
chmod +x "$INSTALL_DIR/bin/fluxwall.sh" 2>/dev/null || true
ln -sf "$INSTALL_DIR/bin/fluxwall.sh" /usr/local/bin/fluxwall

# 9. Start Docker Containers
echo -e "${YELLOW}[7/7] Menjalankan FluxWall Gateway...${NC}"
docker compose down --remove-orphans >/dev/null 2>&1 || true
docker compose up -d --build

# Safe Public IP Lookup with strict 2-second timeout
SERVER_IP=$(curl -s -4 --max-time 2 ifconfig.me 2>/dev/null || curl -s -4 --max-time 2 icanhazip.com 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$SERVER_IP" ] && SERVER_IP="127.0.0.1"

echo -e "\n${GREEN}======================================================"
echo -e "    🚀 INSTALASI FLUXWALL BERHASIL DISELESAIKAN!      "
echo -e "======================================================${NC}"
echo -e "  🌐 Gateway URL      : ${BOLD}http://${SERVER_IP}:80${NC}"
echo -e "  🛡️  Admin Dashboard  : ${BOLD}http://${SERVER_IP}:8080/admin/${NC} (atau port 80)"
echo -e "  🔑 Admin API Key    : ${CYAN}${ADMIN_SECRET}${NC}"
echo -e "  🎯 Backend Upstream : ${YELLOW}${BACKEND_TARGET}${NC}"
echo -e "  📊 Metrics Exporter : ${BOLD}http://${SERVER_IP}:8080/metrics${NC}"
echo -e "------------------------------------------------------"
echo -e "  ⚡ ${BOLD}Manajemen Gateway via CLI:${NC}"
echo -e "     - Cek status gateway  : ${CYAN}fluxwall status${NC}"
echo -e "     - Ban IP manual       : ${CYAN}fluxwall ban <IP> [durasi_detik]${NC}"
echo -e "     - Unban IP            : ${CYAN}fluxwall unban <IP>${NC}"
echo -e "     - Whitelist IP        : ${CYAN}fluxwall whitelist <IP>${NC}"
echo -e "     - Lihat live log      : ${CYAN}fluxwall logs${NC}"
echo -e "     - Reload konfigurasi  : ${CYAN}fluxwall reload${NC}"
echo -e "======================================================\n"
