#!/usr/bin/env python3
"""Simple Flask server that serves index.html and static assets from repo root.

Run:
  python3 app.py --host 0.0.0.0 --port 5000 --debug

Install dependencies:
  python3 -m pip install flask
"""

import os
from flask import Flask, send_from_directory, abort

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")

app = Flask(__name__, static_folder=None)


@app.route("/")
def index():
    """Serve index.html from the dist folder (Vite build)."""
    index_file = os.path.join(DIST, "index.html")
    if not os.path.exists(index_file):
        return "index.html not found - run 'yarn build' first", 404
    return send_from_directory(DIST, "index.html")


@app.route("/<path:filename>")
def serve_file(filename):
    """Serve static files from the dist folder (Vite build output)."""
    if ".." in filename or filename.startswith("/"):
        abort(404)
    target = os.path.join(DIST, filename)
    if not os.path.exists(target):
        return "File not found", 404
    return send_from_directory(DIST, filename)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Serve index.html and static files via Flask"
    )
    parser.add_argument(
        "--host", "-H", default="127.0.0.1", help="Host to bind to (default: 127.0.0.1)"
    )
    parser.add_argument(
        "--port", "-p", type=int, default=5000, help="Port to listen on (default: 5000)"
    )
    parser.add_argument("--debug", "-d", action="store_true", help="Run in debug mode")
    args = parser.parse_args()

    print(
        f"Serving {os.path.join(DIST, 'index.html')} on http://{args.host}:{args.port}/"
    )
    app.run(host=args.host, port=args.port, debug=args.debug)
