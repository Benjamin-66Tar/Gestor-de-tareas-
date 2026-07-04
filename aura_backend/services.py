import json
from django.conf import settings
import openai

def procesar_texto_con_nlp(texto_usuario: str):
    """
    Analiza texto libre del usuario para extraer metas o eventos estructurados de forma ultra rápida.
    """
    # Use key from settings if configured, otherwise fallback gracefully
    api_key = getattr(settings, 'OPENAI_API_KEY', 'mock-key-for-now')
    client = openai.OpenAI(api_key=api_key)
    
    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Extrae la planificación del usuario en el esquema JSON estructurado."},
            {"role": "user", "content": texto_usuario}
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "esquema_planificacion",
                "schema": {
                    "type": "object",
                    "properties": {
                        "titulo": {"type": "string"},
                        "descripcion": {"type": "string"},
                        "tipo": {"type": "string", "enum": ["OBJETIVO", "PROYECTO", "EVENTO", "ACTIVIDAD"]},
                        "color_hex": {"type": "string"}
                    },
                    "required": ["titulo", "tipo", "color_hex"],
                    "additionalProperties": False
                }
            }
        }
    )
    return json.loads(response.choices[0].message.content)
