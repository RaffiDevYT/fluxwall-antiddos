#!/usr/bin/env bash

# ==============================================================================
#  🌊 FluxWall - Quick Install Entrypoint
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$DIR/scripts/install.sh" ]; then
    bash "$DIR/scripts/install.sh" "$@"
else
    TMP_INSTALLER="/tmp/fluxwall_install_$$.sh"
    curl -fsSL https://raw.githubusercontent.com/RaffiDevYT/fluxwall-antiddos/main/scripts/install.sh -o "$TMP_INSTALLER"
    bash "$TMP_INSTALLER" "$@"
    rm -f "$TMP_INSTALLER"
fi
