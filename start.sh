#!/bin/bash
# Run both API and Frontend servers

echo "Starting Dispepsia Tracker..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON="$SCRIPT_DIR/venv/bin/python3"

# Start API server in background
echo "Starting API server on port 5001..."
"$PYTHON" "$SCRIPT_DIR/api.py" --host 0.0.0.0 --port 5001 &
API_PID=$!

# Wait a moment for API to start
sleep 2

# Start frontend server
echo "Starting Frontend server on port 5000..."
"$PYTHON" "$SCRIPT_DIR/app.py" --host 0.0.0.0 --port 5000 &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Dispepsia Tracker is running!"
echo "  API:    http://localhost:5001"
echo "  Frontend: http://localhost:5000"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for interrupt
trap "kill $API_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
