#!/usr/bin/env bash
set -e

echo "================================================================"
echo "  AUTONOMOUS AI BUSINESS OPERATIONS MANAGER"
echo "  Enterprise ODAEA Autonomous Execution Engine"
echo "================================================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ "$1" == "--test" ]; then
    echo "[*] Running Test Suite..."
    pytest -v tests/
    exit $?
fi

echo "[*] Initializing Database & Seed Data..."
python -c "import asyncio; from backend.app.core.database import init_db; from backend.app.services.seed_service import seed_all; asyncio.run(init_db()); asyncio.run(seed_all())"

echo "[+] Starting Backend (FastAPI on http://127.0.0.1:8000)..."
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[+] Starting Background Worker..."
python -m workers.worker &
WORKER_PID=$!

echo "[+] Starting Frontend Dev Server..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
cd "$ROOT_DIR"

echo "All services running. Press Ctrl+C to terminate."

trap "kill $BACKEND_PID $WORKER_PID $FRONTEND_PID; exit" SIGINT SIGTERM
wait
