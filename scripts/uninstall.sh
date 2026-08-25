#!/usr/bin/env bash

# ==============================================================================
#  🌊 FluxWall - Clean Uninstaller Script
#  GitHub: https://github.com/RaffiDevYT/fluxwall-antiddos
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${RED}"
cat << "EOF"
  ______ _             __          __   _ _ 
 |  ____| |            \ \        / /  | | |
 | |__  | |_   ___  __  \ \  /\  / /_ _| | |
 |  __| | | | | \ \/ /   \ \/  \/ / _` | | |
 | |    | | |_| |>  <     \  /\  / (_| | | |
 |_|    |_|\__,_/_/\_\     \/  \/ \__,_|_|_|
                                            
          --- UNINSTALL WIZARD ---
EOF
echo -e "${NC}"

# Check Root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Harap jalankan script ini dengan hak akses root (sudo bash uninstall.sh)${NC}"
  exit 1
fi

INSTALL_DIR="/opt/fluxwall-antiddos"

echo -e "${YELLOW}${BOLD}PERINGATAN:${NC} Tindakan ini akan menghentikan seluruh layanan FluxWall Gateway"
echo -e "dan menghapus container serta file konfigurasinya dari sistem Anda.\n"

read -rp "$(echo -e "${RED}Apakah Anda yakin ingin menghapus FluxWall? (y/N): ${NC}")" CONFIRM < /dev/tty
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "\n${GREEN}Proses uninstall dibatalkan.${NC}"
    exit 0
fi

echo -e "\n${YELLOW}[1/4] Menghentikan & menghapus container FluxWall...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    cd "$INSTALL_DIR"
    docker compose down --remove-orphans -v 2>/dev/null || true
elif command -v docker &> /dev/null; then
    docker rm -f fluxwall_gateway fluxwall_redis fluxwall_backend 2>/dev/null || true
fi
echo -e "${GREEN}  ✓ Container berhasil dihentikan dan dihapus.${NC}"

echo -e "\n${YELLOW}[2/4] Menghapus CLI tool 'fluxwall'...${NC}"
rm -f /usr/local/bin/fluxwall
echo -e "${GREEN}  ✓ Shortcut CLI berhasil dihapus.${NC}"

echo -e "\n${YELLOW}[3/4] Menghapus direktori instalasi ($INSTALL_DIR)...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    cd /root
    rm -rf "$INSTALL_DIR"
    echo -e "${GREEN}  ✓ Direktori $INSTALL_DIR berhasil dihapus.${NC}"
else
    echo -e "${GREEN}  ✓ Direktori instalasi tidak ditemukan.${NC}"
fi

echo -e "\n${YELLOW}[4/4] Membersihkan file temporary...${NC}"
rm -f /tmp/fluxwall_install_*.sh /tmp/fluxwall_uninstall_*.sh 2>/dev/null || true
echo -e "${GREEN}  ✓ Pembersihan selesai.${NC}"

echo -e "\n${GREEN}======================================================"
echo -e "      🎉 FLUXWALL BERHASIL DI-UNINSTALL DENGAN BERSIH "
echo -e "======================================================${NC}\n"
