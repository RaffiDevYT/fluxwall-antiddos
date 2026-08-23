#!/usr/bin/env bash

# ==============================================================================
#  🌊 FluxWall CLI - Gateway Management Utility
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR" || exit 1

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

function show_help() {
    echo -e "${CYAN}${BOLD}FluxWall CLI - Gateway Management Utility${NC}"
    echo -e "Usage: ${BOLD}fluxwall <command> [arguments]${NC}\n"
    echo -e "Available Commands:"
    echo -e "  ${GREEN}status${NC}                  Menampilkan status container, QPS, & jumlah ban aktif"
    echo -e "  ${GREEN}logs${NC}                    Melihat streaming log serangan & akses real-time"
    echo -e "  ${GREEN}reload${NC}                  Reload konfigurasi Nginx/Lua tanpa downtime"
    echo -e "  ${GREEN}restart${NC}                 Restart seluruh container gateway & Redis"
    echo -e "  ${GREEN}stop / start${NC}            Menghentikan atau memulai gateway"
    echo -e "  ${GREEN}ban <ip> [ttl] [reason]${NC} Memblokir IP sementara (default TTL: 900 detik)"
    echo -e "  ${GREEN}unban <ip>${NC}              Membuka blokir IP yang terkena ban"
    echo -e "  ${GREEN}whitelist <ip>${NC}          Menambahkan IP ke whitelist (bypass limit)"
    echo -e "  ${GREEN}unwhitelist <ip>${NC}        Menghapus IP dari whitelist"
    echo -e "  ${GREEN}blacklist <ip>${NC}          Menambahkan IP ke blacklist permanen"
    echo -e "  ${GREEN}unblacklist <ip>${NC}        Menghapus IP dari blacklist permanen"
    echo -e "  ${GREEN}test${NC}                    Menjalankan automated test suite"
    echo ""
}

CMD="$1"
shift

case "$CMD" in
    status)
        echo -e "${CYAN}=== Status Container FluxWall ===${NC}"
        docker compose ps
        echo -e "\n${CYAN}=== Statistik Gateway Real-Time ===${NC}"
        docker exec -it antiddos_redis redis-cli -c "KEYS" "ip:ban:*" 2>/dev/null | wc -l | awk '{print "Active Temporary Bans: "$1}'
        docker exec -it antiddos_redis redis-cli SCARD ip:whitelist 2>/dev/null | awk '{print "Whitelisted IPs: "$1}'
        docker exec -it antiddos_redis redis-cli SCARD ip:blacklist 2>/dev/null | awk '{print "Permanent Blacklisted IPs: "$1}'
        ;;

    logs)
        echo -e "${CYAN}=== Streaming Live Security Logs (Ctrl+C untuk keluar) ===${NC}"
        docker logs -f antiddos_gateway
        ;;

    reload)
        echo -e "${YELLOW}Mereload konfigurasi Nginx/Lua...${NC}"
        docker exec antiddos_gateway openresty -s reload
        echo -e "${GREEN}✓ Konfigurasi berhasil dimuat ulang!${NC}"
        ;;

    restart)
        echo -e "${YELLOW}Merestart container FluxWall...${NC}"
        docker compose restart
        echo -e "${GREEN}✓ Gateway berhasil direstart!${NC}"
        ;;

    start)
        docker compose up -d
        ;;

    stop)
        docker compose stop
        ;;

    ban)
        IP="$1"
        TTL="${2:-900}"
        REASON="${3:-Manual CLI Ban}"
        if [ -z "$IP" ]; then
            echo -e "${RED}Error: Masukkan IP address. Contoh: fluxwall ban 192.168.1.50 600${NC}"
            exit 1
        fi
        docker exec antiddos_redis redis-cli SETEX "ip:ban:$IP" "$TTL" "$REASON" > /dev/null
        echo -e "${GREEN}✓ IP $IP berhasil di-ban selama ${TTL} detik (Alasan: $REASON)${NC}"
        ;;

    unban)
        IP="$1"
        if [ -z "$IP" ]; then
            echo -e "${RED}Error: Masukkan IP address. Contoh: fluxwall unban 192.168.1.50${NC}"
            exit 1
        fi
        docker exec antiddos_redis redis-cli DEL "ip:ban:$IP" "ip:violations:$IP" > /dev/null
        echo -e "${GREEN}✓ IP $IP berhasil di-unban!${NC}"
        ;;

    whitelist)
        IP="$1"
        if [ -z "$IP" ]; then
            echo -e "${RED}Error: Masukkan IP address. Contoh: fluxwall whitelist 203.0.113.10${NC}"
            exit 1
        fi
        docker exec antiddos_redis redis-cli SADD ip:whitelist "$IP" > /dev/null
        echo -e "${GREEN}✓ IP $IP berhasil ditambahkan ke Whitelist!${NC}"
        ;;

    unwhitelist)
        IP="$1"
        if [ -z "$IP" ]; then
            echo -e "${RED}Error: Masukkan IP address. Contoh: fluxwall unwhitelist 203.0.113.10${NC}"
            exit 1
        fi
        docker exec antiddos_redis redis-cli SREM ip:whitelist "$IP" > /dev/null
        echo -e "${GREEN}✓ IP $IP berhasil dihapus dari Whitelist!${NC}"
        ;;

    blacklist)
        IP="$1"
        if [ -z "$IP" ]; then
            echo -e "${RED}Error: Masukkan IP address. Contoh: fluxwall blacklist 198.51.100.22${NC}"
            exit 1
        fi
        docker exec antiddos_redis redis-cli SADD ip:blacklist "$IP" > /dev/null
        echo -e "${GREEN}✓ IP $IP berhasil dimasukkan ke Blacklist Permanen!${NC}"
        ;;

    unblacklist)
        IP="$1"
        if [ -z "$IP" ]; then
            echo -e "${RED}Error: Masukkan IP address. Contoh: fluxwall unblacklist 198.51.100.22${NC}"
            exit 1
        fi
        docker exec antiddos_redis redis-cli SREM ip:blacklist "$IP" > /dev/null
        echo -e "${GREEN}✓ IP $IP berhasil dihapus dari Blacklist Permanen!${NC}"
        ;;

    test)
        bash test/test_rate_limit.sh
        ;;

    *)
        show_help
        ;;
esac
