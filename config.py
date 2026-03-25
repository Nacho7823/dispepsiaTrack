import os
import json

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "data")
ENTRIES_FILE = os.path.join(DATA_DIR, "entries.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")
CONVERSATIONS_FILE = os.path.join(DATA_DIR, "conversations.json")

DEFAULT_SYSTEM_PROMPT = """Eres un médico asistente especializado en dispepsia funcional.
Tu objetivo es ayudar al usuario a registrar sus síntomas, alimentación, medicación y estilo de vida.
Tono: empático, breve y conversacional.
PASOS PARA REGISTRAR:
1. Primero pregunta la fecha y hora del síntoma (puedes usar la actual si no especifica)
2. Luego pregunta el tipo de síntoma
3. Pregunta la intensidad del 1 al 10
4. Pregunta otros detalles (ubicación, comida, estrés, sueño, medicación)
5. Al FINALIZAR, genera un bloque de código JSON con los datos recopilados."""


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


def get_entries():
    from flask import g

    if "entries" not in g:
        g.entries = load_json(ENTRIES_FILE, [])
    return g.entries


def save_entries(data):
    from flask import g

    save_json(ENTRIES_FILE, data)
    g.entries = data


def get_settings():
    from flask import g

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


def save_settings(data):
    from flask import g

    save_json(SETTINGS_FILE, data)
    g.settings = data


def get_conversations():
    from flask import g

    if "conversations" not in g:
        g.conversations = load_json(CONVERSATIONS_FILE, [])
    return g.conversations


def save_conversations(data):
    from flask import g

    save_json(CONVERSATIONS_FILE, data)
    g.conversations = data
