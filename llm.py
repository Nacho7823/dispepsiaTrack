from flask import Blueprint, request, jsonify
from config import get_settings

llm_bp = Blueprint("llm", __name__)


def is_anthropic(api_url):
    return "anthropic" in api_url.lower()


@llm_bp.route("/api/chat", methods=["POST"])
def chat_route():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Sin datos"}), 400

    settings = get_settings()
    api_key = settings.get("apiKey", "")
    api_url = settings.get("apiUrl", "")
    model = data.get("model", settings.get("model", "gpt-3.5-turbo"))
    system_prompt = data.get("systemPrompt", settings.get("systemPrompt", ""))
    messages = data.get("messages", [])

    if not api_key:
        return jsonify({"error": "API Key no configurada"}), 400

    try:
        if is_anthropic(api_url):
            import anthropic

            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model=model,
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": m["role"], "content": m["content"]} for m in messages
                ],
            )
            content = response.content[0].text if response.content else ""
        else:
            from openai import OpenAI

            base_url = api_url.replace("/chat/completions", "").rstrip("/")
            client = OpenAI(api_key=api_key, base_url=base_url)
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    *[{"role": m["role"], "content": m["content"]} for m in messages],
                ],
                temperature=0.7,
            )
            content = response.choices[0].message.content if response.choices else ""

        return jsonify({"content": content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@llm_bp.route("/api/models", methods=["GET"])
def get_models_route():
    settings = get_settings()
    api_key = settings.get("apiKey", "")
    api_url = settings.get("apiUrl", "")

    if not api_key:
        return jsonify({"error": "API Key no configurada"}), 400

    try:
        if is_anthropic(api_url):
            import anthropic

            client = anthropic.Anthropic(api_key=api_key)
            response = client.models.list()
            models = [
                {"id": m.id, "name": m.display_name or m.id} for m in response.data
            ]
        else:
            from openai import OpenAI

            base_url = api_url.replace("/chat/completions", "").rstrip("/")
            client = OpenAI(api_key=api_key, base_url=base_url)
            response = client.models.list()
            models = [
                {"id": m.id, "name": m.id}
                for m in response.data
                if any(
                    k in m.id.lower()
                    for k in (
                        "gpt",
                        "o1",
                        "o3",
                        "o4",
                        "chat",
                        "gemini",
                        "deepseek",
                        "llama",
                        "mistral",
                    )
                )
            ]

        return jsonify({"models": models})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
