#!/bin/bash
# Run the Dispepsia Tracker (frontend + API on a single port)

echo "Starting Dispepsia Tracker..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON="$SCRIPT_DIR/venv/bin/python3"

echo ""
echo "========================================"
echo "Dispepsia Tracker is running!"
echo "  http://localhost:5000"
echo "========================================"
echo ""

"$PYTHON" "$SCRIPT_DIR/app.py" --host 0.0.0.0 --port 5000 "$@"
