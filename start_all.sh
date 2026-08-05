#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "Starting MetroMind backend and frontend..."

python "$SCRIPT_DIR/start_services.py" &
BACKEND_PID=$!

cleanup() {
	if kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
		kill "$BACKEND_PID" >/dev/null 2>&1 || true
	fi
}

trap cleanup EXIT INT TERM

sleep 5
cd "$FRONTEND_DIR"
npm start