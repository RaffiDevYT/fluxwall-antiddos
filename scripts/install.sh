#!/usr/bin/env bash

# ==============================================================================
#  🌊 FluxWall - Interactive 1-Line Automated Installer
#  GitHub: https://github.com/RaffiDevYT/fluxwall-antiddos
# ==============================================================================

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear

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

INSTALL_DIR="/opt/antiddos"

# 2. Check & Install Dependencies (curl, git)
echo -e "${YELLOW}[1/6] Memeriksa dependensi sistem...${NC}"
if ! command -v curl &> /dev/null || ! command -v git &> /dev/null; then
    echo -e "  -> Menginstall curl dan git..."
    if command -v apt &> /dev/null; then
        apt update -y && apt install -y curl git
    elif command -v yum &> /dev/null; then
        yum install -y curl git
    fi
fi
echo -e "${GREEN}  ✓ Dependensi sistem siap.${NC}\n"

# 3. Check & Install Docker & Docker Compose
echo -e "${YELLOW}[2/6] Memeriksa Docker & Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "  -> Docker belum terpasang. Memulai instalasi otomatis Docker..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh
    rm -f /tmp/get-docker.sh
    if command -v apt &> /dev/null; then
        apt install -y docker-compose-plugin
    fi
    systemctl enable --now docker
    echo -e "${GREEN}  ✓ Docker berhasil diinstall.${NC}"
else
    echo -e "${GREEN}  ✓ Docker sudah terpasang.${NC}"
fi
echo ""

# 4. Clone or Update Repository
echo -e "${YELLOW}[3/6] Mengunduh repository FluxWall...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "  -> Direktori $INSTALL_DIR sudah ada. Memperbarui file..."
    cd "$INSTALL_DIR"
    git fetch --all && git reset --hard origin/main
else
    echo -e "  -> Melakukan clone repository ke $INSTALL_DIR..."
    git clone https://github.com/RaffiDevYT/fluxwall-antiddos.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi
echo -e "${GREEN}  ✓ Source code FluxWall siap.${NC}\n"

# 5. Interactive Configuration
echo -e "${CYAN}======================================================"
echo -e "        PENGATURAN KONFIGURASI FLUXWALL               "
echo -e "======================================================${NC}"

# Backend Target
read -rp "$(echo -e "${YELLOW}Masukkan Host/Port Backend Anda [default: host.docker.internal:3000]: ${NC}")" BACKEND_INPUT < /dev/tty
BACKEND_TARGET=${BACKEND_INPUT:-"host.docker.internal:3000"}

# Admin Secret Key
DEFAULT_SECRET=$(cat /dev/urandom 2>/dev/null | tr -dc 'a-zA-Z0-9' | fold -w 24 | head -n 1)
[ -z "$DEFAULT_SECRET" ] && DEFAULT_SECRET="fluxwall_admin_$(date +%s)"
read -rp "$(echo -e "${YELLOW}Masukkan Admin API Secret Key [default: ${DEFAULT_SECRET}]: ${NC}")" ADMIN_KEY_INPUT < /dev/tty
ADMIN_SECRET=${ADMIN_KEY_INPUT:-$DEFAULT_SECRET}

# Rate Limit Max Requests
read -rp "$(echo -e "${YELLOW}Batas Rate Limit per IP per detik [default: 20]: ${NC}")" RATE_INPUT < /dev/tty
MAX_REQ=${RATE_INPUT:-20}

echo -e "\n${YELLOW}[4/6] Menyimpan konfigurasi...${NC}"

# Update conf/nginx.conf with backend target
sed -i "s|server backend:3000.*|server ${BACKEND_TARGET} max_fails=3 fail_timeout=10s;|g" conf/nginx.conf
sed -i "s|server host.docker.internal:3000.*|server ${BACKEND_TARGET} max_fails=3 fail_timeout=10s;|g" conf/nginx.conf

# Update docker-compose.yml with Admin Key & Ports
sed -i "s|- ADMIN_API_KEY=.*|- ADMIN_API_KEY=${ADMIN_SECRET}|g" docker-compose.yml

# Update lua/config.lua with Max Requests if changed
if [ "$MAX_REQ" != "20" ]; then
    sed -i "s|max_requests = 20|max_requests = ${MAX_REQ}|g" lua/config.lua
fi
echo -e "${GREEN}  ✓ Konfigurasi berhasil disimpan.${NC}\n"

# 6. Apply Linux Kernel Anti-DDoS Sysctl Hardening
echo -e "${YELLOW}[5/6] Menerapkan Hardening Kernel Linux Anti-DDoS...${NC}"
if ! grep -q "net.ipv4.tcp_syncookies" /etc/sysctl.conf; then
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
echo -e "${GREEN}  ✓ Parameter kernel sysctl berhasil dioptimalkan.${NC}"
else
echo -e "${GREEN}  ✓ Parameter kernel sysctl sudah optimal.${NC}"
fi
echo ""

# 7. Install CLI Helper (`bin/fluxwall.sh` globally to `/usr/local/bin/fluxwall`)
chmod +x "$INSTALL_DIR/bin/fluxwall.sh" 2>/dev/null || true
ln -sf "$INSTALL_DIR/bin/fluxwall.sh" /usr/local/bin/fluxwall

# 8. Start Containers
echo -e "${YELLOW}[6/6] Menjalankan FluxWall Gateway...${NC}"
docker compose down --remove-orphans > /dev/null 2>&1 || true
docker compose up -d --build

SERVER_IP=$(curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')

echo -e "\n${GREEN}======================================================"
echo -e "    🎉 INSTALASI FLUXWALL BERHASIL DISELESAIKAN!      "
echo -e "======================================================${NC}"
echo -e "  🌐 Gateway URL      : ${BOLD}http://${SERVER_IP}:${NC}"
echo -e "  📊 Admin Dashboard  : ${BOLD}http://${SERVER_IP}:8080/admin/${NC} (atau port 80)"
echo -e "  🔑 Admin API Key    : ${CYAN}${ADMIN_SECRET}${NC}"
echo -e "  🎯 Backend Upstream : ${YELLOW}${BACKEND_TARGET}${NC}"
echo -e "  📈 Metrics Exporter : ${BOLD}http://${SERVER_IP}:8080/metrics${NC}"
echo -e "------------------------------------------------------"
echo -e "  🛠️  ${BOLD}Manajemen Gateway via CLI:${NC}"
echo -e "     - Cek status gateway  : ${CYAN}fluxwall status${NC}"
echo -e "     - Ban IP manual       : ${CYAN}fluxwall ban <IP> [durasi_detik]${NC}"
echo -e "     - Unban IP            : ${CYAN}fluxwall unban <IP>${NC}"
echo -e "     - Whitelist IP        : ${CYAN}fluxwall whitelist <IP>${NC}"
echo -e "     - Lihat live log      : ${CYAN}fluxwall logs${NC}"
echo -e "     - Reload konfigurasi  : ${CYAN}fluxwall reload${NC}"
echo -e "======================================================\n"
