#!/usr/bin/env bash

# ==============================================================================
#  FluxWall - Quick 1-Line VPS Install Entrypoint
# ==============================================================================

set -eo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"

if [ -f "$DIR/scripts/install.sh" ]; then
    if [ -c /dev/tty ] && [ -r /dev/tty ]; then
        bash "$DIR/scripts/install.sh" "$@" < /dev/tty
    else
        bash "$DIR/scripts/install.sh" "$@"
    fi
else
    TMP_INSTALLER="/tmp/fluxwall_install_$$.sh"
    curl -fsSL https://raw.githubusercontent.com/RaffiDevYT/fluxwall-antiddos/main/scripts/install.sh -o "$TMP_INSTALLER"
    if [ -c /dev/tty ] && [ -r /dev/tty ]; then
        bash "$TMP_INSTALLER" "$@" < /dev/tty
    else
        bash "$TMP_INSTALLER" "$@"
    fi
    rm -f "$TMP_INSTALLER" 2>/dev/null || true
fi
