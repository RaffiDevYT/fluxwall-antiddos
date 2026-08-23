#!/usr/bin/env bash

# ==============================================================================
#  🌊 FluxWall - Quick Uninstall Entrypoint
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$DIR/scripts/uninstall.sh" ]; then
    bash "$DIR/scripts/uninstall.sh" "$@"
else
    TMP_UNINSTALLER="/tmp/fluxwall_uninstall_$$.sh"
    curl -fsSL https://raw.githubusercontent.com/RaffiDevYT/fluxwall-antiddos/main/scripts/uninstall.sh -o "$TMP_UNINSTALLER"
    bash "$TMP_UNINSTALLER" "$@"
    rm -f "$TMP_UNINSTALLER"
fi
