#!/usr/bin/env python3
"""Flask API server for Dispepsia Tracker.

Run:
  python3 api.py --host 0.0.0.0 --port 5001

Or run both app.py (frontend) and api.py (backend) together.
"""

import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

from config import (
    DATA_DIR,
    get_settings,
    save_settings,
    get_entries,
    save_entries,
    get_conversations,
    save_conversations,
)
from llm import llm_bp

app = Flask(__name__)
CORS(
    app,
    origins=[
        "http://localhost:5000",
        "http://localhost:5173",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:5173",
    ],
)

os.makedirs(DATA_DIR, exist_ok=True)

app.register_blueprint(llm_bp)


# --- Settings ---


@app.route("/api/settings", methods=["GET"])
def get_settings_route():
    return jsonify(get_settings())


@app.route("/api/settings", methods=["POST"])
def save_settings_route():
    data = request.get_json()
    if data:
        save_settings(data)
    return jsonify({"success": True})


# --- Entries ---


@app.route("/api/entries", methods=["GET"])
def get_entries_route():
    return jsonify(get_entries())


@app.route("/api/entries", methods=["POST"])
def add_entry_route():
    data = request.get_json()
    if data:
        entries = get_entries()
        entry = {
            "id": data.get("id", int(datetime.now().timestamp() * 1000)),
            "fecha": data.get("fecha", datetime.now().isoformat()),
            "sintoma_tipo": data.get("sintoma_tipo", []),
            "intensidad": data.get("intensidad", 0),
            "ubicacion": data.get("ubicacion", ""),
            "comida": data.get("comida", ""),
            "estres": data.get("estres", 0),
            "sueno_horas": data.get("sueno_horas", 0),
            "medicacion": data.get("medicacion", ""),
            "notas": data.get("notas", ""),
            "customField0Value": data.get("customField0Value", ""),
            "customField1Value": data.get("customField1Value", ""),
            "customField2Value": data.get("customField2Value", ""),
        }
        entries.insert(0, entry)
        save_entries(entries)
        return jsonify({"success": True, "entry": entry})
    return jsonify({"success": False}), 400


@app.route("/api/entries/<int:entry_id>", methods=["DELETE"])
def delete_entry_route(entry_id):
    entries = get_entries()
    entries = [e for e in entries if e.get("id") != entry_id]
    save_entries(entries)
    return jsonify({"success": True})


@app.route("/api/entries", methods=["DELETE"])
def clear_entries_route():
    save_entries([])
    return jsonify({"success": True})


@app.route("/api/entries/<int:entry_id>", methods=["PUT"])
def update_entry_route(entry_id):
    data = request.get_json()
    if data:
        entries = get_entries()
        for i, e in enumerate(entries):
            if e.get("id") == entry_id:
                entries[i] = {**e, **data, "id": entry_id}
                save_entries(entries)
                return jsonify({"success": True, "entry": entries[i]})
        return jsonify({"success": False, "error": "Entry not found"}), 404
    return jsonify({"success": False}), 400


# --- Conversations ---


@app.route("/api/conversations", methods=["GET"])
def get_conversations_route():
    return jsonify(get_conversations())


@app.route("/api/conversations", methods=["POST"])
def create_conversation_route():
    data = request.get_json() or {}
    conversations = get_conversations()
    conversation = {
        "id": int(datetime.now().timestamp() * 1000),
        "title": data.get("title", "Nueva conversación"),
        "messages": data.get("messages", []),
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat(),
    }
    conversations.insert(0, conversation)
    save_conversations(conversations)
    return jsonify({"success": True, "conversation": conversation})


@app.route("/api/conversations/<int:conversation_id>", methods=["GET"])
def get_conversation_route(conversation_id):
    conversations = get_conversations()
    for c in conversations:
        if c.get("id") == conversation_id:
            return jsonify(c)
    return jsonify({"error": "Not found"}), 404


@app.route("/api/conversations/<int:conversation_id>", methods=["PUT"])
def update_conversation_route(conversation_id):
    data = request.get_json()
    if data:
        conversations = get_conversations()
        for i, c in enumerate(conversations):
            if c.get("id") == conversation_id:
                conversations[i] = {
                    **c,
                    **data,
                    "updatedAt": datetime.now().isoformat(),
                }
                save_conversations(conversations)
                return jsonify({"success": True, "conversation": conversations[i]})
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": False}), 400


@app.route("/api/conversations/<int:conversation_id>", methods=["DELETE"])
def delete_conversation_route(conversation_id):
    conversations = get_conversations()
    conversations = [c for c in conversations if c.get("id") != conversation_id]
    save_conversations(conversations)
    return jsonify({"success": True})


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Dispepsia Tracker API")
    parser.add_argument("--host", "-H", default="127.0.0.1")
    parser.add_argument("--port", "-p", type=int, default=5001)
    parser.add_argument("--debug", "-d", action="store_true")
    args = parser.parse_args()
    print(f"API running on http://{args.host}:{args.port}")
    app.run(host=args.host, port=args.port, debug=args.debug)
