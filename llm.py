from flask import Blueprint, request, jsonify
from datetime import datetime
from config import get_settings, get_entries, save_entries
import re
import json

llm_bp = Blueprint("llm", __name__)


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "crear_registro",
            "description": "Crea un nuevo registro de síntomas. Usa esta herramienta cuando el usuario haya completado de dar la información del registro (fecha, síntoma, intensidad, etc.)",
            "parameters": {
                "type": "object",
                "properties": {
                    "fecha": {
                        "type": "string",
                        "description": "Fecha y hora en formato ISO 8601 (YYYY-MM-DDTHH:MM:SS). Si el usuario no especifica, usa la fecha y hora actual.",
                    },
                    "sintoma_tipo": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Tipos de síntoma separados por coma",
                    },
                    "intensidad": {
                        "type": "number",
                        "description": "Intensidad del 1 al 10",
                    },
                    "ubicacion": {
                        "type": "string",
                        "description": "Ubicación del síntoma",
                    },
                    "comida": {
                        "type": "string",
                        "description": "Descripción de lo que comió",
                    },
                    "estres": {
                        "type": "number",
                        "description": "Nivel de estrés del 1 al 10",
                    },
                    "sueno_horas": {"type": "number", "description": "Horas de sueño"},
                    "medicacion": {
                        "type": "string",
                        "description": "Medicación actual",
                    },
                    "notas": {"type": "string", "description": "Notas adicionales"},
                },
                "required": ["fecha"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "actualizar_registro",
            "description": "Actualiza un registro de síntomas existente. Necesitas el ID del registro para actualizarlo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "number",
                        "description": "ID del registro a actualizar",
                    },
                    "fecha": {
                        "type": "string",
                        "description": "Nueva fecha en formato ISO 8601",
                    },
                    "sintoma_tipo": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Tipos de síntoma",
                    },
                    "intensidad": {
                        "type": "number",
                        "description": "Intensidad del 1 al 10",
                    },
                    "ubicacion": {
                        "type": "string",
                        "description": "Ubicación del síntoma",
                    },
                    "comida": {
                        "type": "string",
                        "description": "Descripción de lo que comió",
                    },
                    "estres": {
                        "type": "number",
                        "description": "Nivel de estrés del 1 al 10",
                    },
                    "sueno_horas": {"type": "number", "description": "Horas de sueño"},
                    "medicacion": {
                        "type": "string",
                        "description": "Medicación actual",
                    },
                    "notas": {"type": "string", "description": "Notas adicionales"},
                },
                "required": ["id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "guardar_fecha_hora",
            "description": "Guarda la fecha y hora del registro actual. Úsala al inicio cuando el usuario mencione una fecha/hora específica, o para confirmar la fecha actual.",
            "parameters": {
                "type": "object",
                "properties": {
                    "fecha": {
                        "type": "string",
                        "description": "Fecha y hora. Formato preferido: YYYY-MM-DDTHH:MM:SS. Pero también puedes usar texto como '28/03/2026 14:30' y el sistema lo convertirá.",
                    }
                },
                "required": ["fecha"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "eliminar_registro",
            "description": "Elimina un registro existente. Necesitas el ID del registro para eliminarlo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "number",
                        "description": "ID del registro a eliminar",
                    }
                },
                "required": ["id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "consultar_historial",
            "description": "Consulta el historial de registros de síntomas. Útil para recordar al usuario sus patrones o mostrar registros previos.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limite": {
                        "type": "number",
                        "description": "Cantidad de registros a devolver (por defecto 10)",
                    }
                },
            },
        },
    },
]


def parse_fecha(fecha_str):
    if not fecha_str:
        return datetime.now().isoformat()

    fecha_str = str(fecha_str).strip()
    try:
        if "T" in fecha_str:
            return fecha_str
        for fmt in [
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%d/%m/%Y %H:%M",
            "%d/%m/%Y",
        ]:
            try:
                return datetime.strptime(fecha_str, fmt).isoformat()
            except:
                continue
        return fecha_str
    except:
        return datetime.now().isoformat()


def execute_tool(tool_name, arguments):
    try:
        if tool_name == "crear_registro":
            entries = get_entries()
            entry = {
                "id": int(datetime.now().timestamp() * 1000),
                "fecha": parse_fecha(arguments.get("fecha")),
                "sintoma_tipo": arguments.get("sintoma_tipo", []),
                "intensidad": arguments.get("intensidad", 0),
                "ubicacion": arguments.get("ubicacion", ""),
                "comida": arguments.get("comida", ""),
                "estres": arguments.get("estres", 0),
                "sueno_horas": arguments.get("sueno_horas", 0),
                "medicacion": arguments.get("medicacion", ""),
                "notas": arguments.get("notas", ""),
            }
            entries.insert(0, entry)
            save_entries(entries)
            return {
                "success": True,
                "message": f"Registro creado con ID {entry['id']}",
                "entry_id": entry["id"],
            }

        elif tool_name == "actualizar_registro":
            entry_id = arguments.get("id")
            if not entry_id:
                return {"success": False, "error": "Se requiere el ID del registro"}
            entries = get_entries()
            found = False
            for i, e in enumerate(entries):
                if e.get("id") == entry_id:
                    updates = {k: v for k, v in arguments.items() if k != "id"}
                    if "fecha" in updates:
                        updates["fecha"] = parse_fecha(updates["fecha"])
                    entries[i] = {**e, **updates}
                    save_entries(entries)
                    found = True
                    break
            if found:
                return {"success": True, "message": f"Registro {entry_id} actualizado"}
            return {"success": False, "error": f"Registro {entry_id} no encontrado"}

        elif tool_name == "guardar_fecha_hora":
            fecha_iso = parse_fecha(arguments.get("fecha"))
            return {
                "success": True,
                "message": f"Fecha guardada: {fecha_iso}",
                "fecha": fecha_iso,
            }

        elif tool_name == "eliminar_registro":
            entry_id = arguments.get("id")
            if not entry_id:
                return {"success": False, "error": "Se requiere el ID del registro"}
            entries = get_entries()
            original_len = len(entries)
            entries = [e for e in entries if e.get("id") != entry_id]
            if len(entries) < original_len:
                save_entries(entries)
                return {"success": True, "message": f"Registro {entry_id} eliminado"}
            return {"success": False, "error": f"Registro {entry_id} no encontrado"}

        elif tool_name == "consultar_historial":
            limite = arguments.get("limite", 10)
            entries = get_entries()[:limite]
            formatted = []
            for e in entries:
                fecha = e.get("fecha", "")
                sintoma = ", ".join(e.get("sintoma_tipo", []))
                intensidad = e.get("intensidad", "")
                formatted.append(
                    f"ID: {e.get('id')} | Fecha: {fecha} | Síntoma: {sintoma} | Intensidad: {intensidad}"
                )
            if not formatted:
                return {"success": True, "message": "No hay registros", "historial": []}
            return {
                "success": True,
                "message": f"Últimos {len(entries)} registros:",
                "historial": formatted,
            }

        return {"success": False, "error": f"Tool desconocido: {tool_name}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


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
                max_tokens=2048,
                system=system_prompt,
                messages=[
                    {"role": m["role"], "content": m["content"]} for m in messages
                ],
            )
            tool_results = []
            if hasattr(response, "content"):
                for block in response.content:
                    if hasattr(block, "type") and block.type == "tool_use":
                        tool_name = block.name
                        tool_args = block.input
                        result = execute_tool(tool_name, tool_args)
                        tool_results.append(
                            {
                                "tool_call_id": block.id,
                                "tool_name": tool_name,
                                "result": result,
                            }
                        )

            if tool_results:
                messages.append(
                    {"role": "assistant", "content": "[Herramienta ejecutada]"}
                )
                for tr in tool_results:
                    messages.append(
                        {
                            "role": "user",
                            "content": f"Resultado de {tr['tool_name']}: {tr['result']}",
                        }
                    )
                response2 = client.messages.create(
                    model=model,
                    max_tokens=2048,
                    system=system_prompt,
                    messages=messages,
                )
                content = response2.content[0].text if response2.content else ""
            else:
                content = response.content[0].text if response.content else ""
        else:
            from openai import OpenAI
            import json

            base_url = api_url.replace("/chat/completions", "").rstrip("/")
            client = OpenAI(api_key=api_key, base_url=base_url)

            max_iterations = 5
            for iteration in range(max_iterations):
                # Build messages for API call
                api_messages = [{"role": "system", "content": system_prompt}]
                for m in messages:
                    if m["role"] == "tool":
                        msg = {
                            "role": "tool",
                            "tool_call_id": m["tool_call_id"],
                            "content": m["content"],
                        }
                    elif m.get("tool_calls"):
                        msg = {
                            "role": "assistant",
                            "tool_calls": [
                                {
                                    "id": tc["id"],
                                    "type": "function",
                                    "function": {
                                        "name": tc["function"]["name"],
                                        "arguments": tc["function"]["arguments"],
                                    },
                                }
                                for tc in m["tool_calls"]
                            ],
                            "content": None,
                        }
                    else:
                        msg = {"role": m["role"], "content": m.get("content") or ""}
                    api_messages.append(msg)

                response = client.chat.completions.create(
                    model=model,
                    messages=api_messages,
                    tools=TOOLS if iteration == 0 else None,
                    tool_choice="auto" if iteration == 0 else None,
                    temperature=0.7,
                )

                message = response.choices[0].message
                tool_calls = message.tool_calls
                entry_created = False

                if tool_calls:
                    messages.append(
                        {
                            "role": "assistant",
                            "content": message.content,
                            "tool_calls": [
                                {
                                    "id": tc.id,
                                    "type": "function",
                                    "function": {
                                        "name": tc.function.name,
                                        "arguments": tc.function.arguments,
                                    },
                                }
                                for tc in tool_calls
                            ],
                        }
                    )

                    for tc in tool_calls:
                        try:
                            args = (
                                json.loads(tc.function.arguments)
                                if isinstance(tc.function.arguments, str)
                                else tc.function.arguments
                            )
                        except:
                            args = {}
                        result = execute_tool(tc.function.name, args)
                        if tc.function.name == "crear_registro" and result.get(
                            "success"
                        ):
                            entry_created = True
                        messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": tc.id,
                                "content": json.dumps(result),
                            }
                        )
                else:
                    # Fallback: try to parse JSON from content if no tool_calls
                    content = message.content if message.content else ""
                    json_match = None
                    entry_created = False
                    if content:
                        json_match = re.search(r"\{[\s\S]*\}", content)

                    if json_match:
                        try:
                            entry_data = json.loads(json_match.group(0))
                            if "fecha" not in entry_data or not entry_data.get("fecha"):
                                entry_data["fecha"] = datetime.now().isoformat()
                            entries = get_entries()
                            entry = {
                                "id": int(datetime.now().timestamp() * 1000),
                                "fecha": parse_fecha(entry_data.get("fecha")),
                                "sintoma_tipo": entry_data.get("sintoma_tipo", []),
                                "intensidad": entry_data.get("intensidad", 0),
                                "ubicacion": entry_data.get("ubicacion", ""),
                                "comida": entry_data.get("comida", ""),
                                "estres": entry_data.get("estres", 0),
                                "sueno_horas": entry_data.get("sueno_horas", 0),
                                "medicacion": entry_data.get("medicacion", ""),
                                "notas": entry_data.get("notas", ""),
                            }
                            entries.insert(0, entry)
                            save_entries(entries)
                            entry_created = True
                            content = f"Registro guardado correctamente (ID: {entry['id']}). ¿Deseas anotar algo más?"
                        except Exception as e:
                            pass

                    break

        return jsonify({"content": content, "entryCreated": entry_created})
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
