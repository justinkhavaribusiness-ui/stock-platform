#!/bin/bash
# Stock Platform Launcher
# Starts backend API, frontend, and Cloudflare tunnel

PROJECT_DIR="/Users/justinkhavarimacmini/dev/stock-platform"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

cleanup() {
    echo "Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID $TUNNEL_PID 2>/dev/null
    echo "All services stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend API
echo "Starting backend API on :8001..."
cd "$PROJECT_DIR/services/api"
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend on :3000..."
cd "$PROJECT_DIR/apps/web"
npx next start --port 3000 > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for services to start
sleep 3

# Start Cloudflare tunnel
echo "Starting Cloudflare tunnel..."
cloudflared tunnel run stock-platform > "$LOG_DIR/tunnel.log" 2>&1 &
TUNNEL_PID=$!

echo ""
echo "Stock Platform is running!"
echo "  Local:    http://localhost:3000"
echo "  Public:   https://stocks.justinkhavari.com"
echo "  API:      https://api-stocks.justinkhavari.com"
echo ""
echo "Logs: $LOG_DIR/"
echo "Press Ctrl+C to stop all services."

wait
