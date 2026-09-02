#!/usr/bin/env bash

echo "======================================================="
echo "       PRINTR HARDWARE PRINT DAEMON (macOS / Linux)    "
echo "======================================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js (https://nodejs.org/)"
    exit 1
fi

if [ -z "$BACKEND_URL" ]; then
    read -p "Enter your deployed Printr website URL (or press ENTER for http://localhost:3000): " input_url
    if [ -n "$input_url" ]; then
        export BACKEND_URL="$input_url"
    else
        export BACKEND_URL="http://localhost:3000"
    fi
fi

if [ -z "$PRINT_AGENT_AUTH_SECRET" ]; then
    export PRINT_AGENT_AUTH_SECRET="99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63"
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
node "$SCRIPT_DIR/agent.js"
