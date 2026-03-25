#!/usr/bin/env python3
"""Flask API server for Dispepsia Tracker.

Run:
  python3 api.py --host 0.0.0.0 --port 5001

Or run both app.py (frontend) and api.py (backend) together.
"""

import os
import json
import requests
from datetime import datetime
from flask import Flask, request, jsonify, g
from flask_cors import CORS

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "data")
ENTRIES_FILE = os.path.join(DATA_DIR, "entries.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")
CONVERSATIONS_FILE = os.path.join(DATA_DIR, "conversations.json")

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


def load_json(filepath, default):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return default


def save_json(filepath, data):
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


DEFAULT_SYSTEM_PROMPT = """Eres un médico asistente especializado en dispepsia funcional. 
Tu objetivo es ayudar al usuario a registrar sus síntomas, alimentación, medicación y estilo de vida.
Tono: empático, breve y conversacional. 
Reglas: 
1. No diagnosticar ni recetar. Solo registrar y preguntar.
2. AL FINALIZAR la conversación, genera un bloque de código JSON con esta estructura exacta:
{
  "fecha": "2024-01-01T00:00:00.000Z",
  "sintoma_tipo": ["tipo"],
  "intensidad": 5,
  "ubicacion": "texto",
  "comida": "descripción",
  "estres": 5,
  "sueno_horas": 8,
  "medicacion": "texto",
  "notas": "texto"
}"""


def get_settings():
    if "settings" not in g:
        g.settings = load_json(
            SETTINGS_FILE,
            {
                "assistantName": "DigestiveBot",
                "systemPrompt": DEFAULT_SYSTEM_PROMPT,
                "model": "gpt-3.5-turbo",
                "apiUrl": "https://api.openai.com/v1/chat/completions",
                "apiKey": "",
            },
        )
    return g.settings


def get_entries():
    if "entries" not in g:
        g.entries = load_json(ENTRIES_FILE, [])
    return g.entries


def save_entries(data):
    save_json(ENTRIES_FILE, data)
    g.entries = data


def save_settings(data):
    save_json(SETTINGS_FILE, data)
    g.settings = data


def get_conversations():
    if "conversations" not in g:
        g.conversations = load_json(CONVERSATIONS_FILE, [])
    return g.conversations


def save_conversations(data):
    save_json(CONVERSATIONS_FILE, data)
    g.conversations = data


@app.route("/api/settings", methods=["GET"])
def get_settings_route():
    return jsonify(get_settings())


@app.route("/api/settings", methods=["POST"])
def save_settings_route():
    data = request.get_json()
    if data:
        save_settings(data)
    return jsonify({"success": True})


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


def get_models_base_url(api_url):
    if "openai" in api_url.lower():
        return api_url.replace("/chat/completions", "/models")
    elif "anthropic" in api_url.lower():
        return api_url.replace("/messages", "/models")
    else:
        base = (
            api_url.split("/v1")[0] if "/v1" in api_url else api_url.split("/chat")[0]
        )
        return f"{base}/v1/models"


@app.route("/api/models", methods=["GET"])
def get_models_route():
    settings = get_settings()
    api_key = settings.get("apiKey", "")
    api_url = settings.get("apiUrl", "")

    if not api_key:
        return jsonify({"error": "API Key no configurada"}), 400

    if not api_url:
        return jsonify({"error": "URL de API no configurada"}), 400

    models_url = get_models_base_url(api_url)

    try:
        headers = {"Authorization": f"Bearer {api_key}"}

        if "anthropic" in api_url.lower():
            headers["x-api-key"] = api_key

        response = requests.get(models_url, headers=headers, timeout=10)

        if not response.ok:
            return jsonify(
                {"error": f"Error del proveedor: {response.status_code}"}
            ), response.status_code

        data = response.json()

        if "openai" in api_url.lower():
            models = [
                {"id": m["id"], "name": m.get("name", m["id"])}
                for m in data.get("data", [])
                if "gpt" in m["id"].lower() or "o1" in m["id"].lower()
            ]
        elif "anthropic" in api_url.lower():
            models = [
                {"id": m["id"], "name": m.get("display_name", m["id"])}
                for m in data.get("models", [])
            ]
        else:
            models = [
                {"id": m.get("id", ""), "name": m.get("id", "")}
                for m in data.get("data", [])
            ]

        return jsonify({"models": models})
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Error de conexión: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Error: {str(e)}"}), 500


if __name__ == "__main__":
    import argparse
    import requests

    parser = argparse.ArgumentParser(description="Dispepsia Tracker API")
    parser.add_argument("--host", "-H", default="127.0.0.1")
    parser.add_argument("--port", "-p", type=int, default=5001)
    parser.add_argument("--debug", "-d", action="store_true")
    args = parser.parse_args()
    print(f"API running on http://{args.host}:{args.port}")
    app.run(host=args.host, port=args.port, debug=args.debug)
