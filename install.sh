#!/usr/bin/env bash

# FluxWall Quick Installer Forwarder
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$DIR/scripts/install.sh" ]; then
    bash "$DIR/scripts/install.sh" "$@"
else
    # In case downloaded via curl directly from root URL
    curl -fsSL https://raw.githubusercontent.com/RaffiDevYT/fluxwall-antiddos/main/scripts/install.sh | sudo bash
fi
