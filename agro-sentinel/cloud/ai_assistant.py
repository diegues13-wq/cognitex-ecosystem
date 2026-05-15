import functions_framework
import logging
import os
import json
from google.cloud import bigquery

import vertexai
try:
    from vertexai.generative_models import GenerativeModel          # type: ignore[import] # >= 1.38
except ImportError:                                                  # pragma: no cover
    from vertexai.preview.generative_models import GenerativeModel  # type: ignore[import] # < 1.38

bq_client = bigquery.Client()

ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', '*')

SCHEMA_CONTEXT = """
BigQuery Table: `agro_sentinel_data.sensor_logs`
Partitioned by DAY on the `timestamp` column.

Columns:
  sensor_id      STRING   REQUIRED  — greenhouse ID, e.g. 'GH-AMB-01'
  timestamp      TIMESTAMP REQUIRED — UTC reading time
  temperature    FLOAT    — air temperature in °C
  humidity       FLOAT    — relative humidity in %
  soil_moisture  FLOAT    — volumetric soil moisture in %
  co2_ppm        FLOAT    — CO2 concentration in ppm
  par_umol       FLOAT    — PAR radiation µmol/m²/s
  soil_ec        FLOAT    — soil electrical conductivity mS/cm
  vpd_kpa        FLOAT    — vapour pressure deficit kPa
  dew_point_c    FLOAT    — dew point °C
  soil_temp_c    FLOAT    — soil temperature °C
  battery_level  INTEGER  — sensor battery %
  rssi_dbm       INTEGER  — WiFi signal strength dBm

Alarm thresholds (CRITICAL):
  temperature    < 10 or > 38 °C
  humidity       < 25 or > 98 %
  co2_ppm        > 1800 ppm
  soil_moisture  < 25 %
  battery_level  < 15 %
  rssi_dbm       < -90 dBm

Farm IDs: GH-AMB-01 (Ambato), GH-DUR-01 (Duran), GH-CAY-01 (Cayambe),
          GH-ORO-01 (Machala/El Oro), GH-TEN-01 (Tena/Selva)
"""

_model: GenerativeModel | None = None


def _get_model() -> GenerativeModel:
    global _model
    if _model is None:
        vertexai.init(location=os.environ.get('VERTEX_LOCATION', 'us-central1'))
        _model = GenerativeModel("gemini-1.5-flash")
    return _model


def _cors_headers(origin: str | None) -> dict:
    allowed = ALLOWED_ORIGIN
    # If wildcard configured, echo back the requesting origin (better for cookies)
    if allowed == '*' and origin:
        allowed = origin
    return {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600',
    }


@functions_framework.http
def ask_ai(request):
    origin = request.headers.get('Origin')
    cors = _cors_headers(origin)

    if request.method == 'OPTIONS':
        return ('', 204, cors)

    body = request.get_json(silent=True)
    if not body or 'query' not in body:
        return ({'error': "Missing 'query' in request body"}, 400, cors)

    user_query   = body['query']
    location_id  = body.get('location_id')
    logging.info(f"AI query: {user_query!r}  location={location_id}")

    location_filter = f"AND sensor_id = '{location_id}'" if location_id else ""

    try:
        model = _get_model()

        # ── Step 1: text → SQL ────────────────────────────────────────────────
        sql_prompt = f"""You are a data analyst for Agro-Sentinel, an IoT platform for greenhouse monitoring.
The user writes queries in Spanish or English. Always respond with valid Standard SQL for BigQuery.

{SCHEMA_CONTEXT}

Rules:
- Return ONLY the SQL query. No markdown fences, no explanations.
- Always include: WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 365 DAY) {location_filter}
- For alarm queries: use the CRITICAL thresholds defined above.
- If the question is conversational (greetings, thanks, etc.), return exactly the string: CONVERSATIONAL
- Limit results to 20 rows unless the user asks for aggregates.

User question: "{user_query}"
"""

        if os.environ.get('MOCK_AI') == 'true':
            sql_query = (
                f"SELECT MAX(temperature) as max_temp, MIN(temperature) as min_temp, "
                f"AVG(temperature) as avg_temp FROM `agro_sentinel_data.sensor_logs` "
                f"WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 365 DAY) "
                f"{location_filter}"
            )
        else:
            response  = model.generate_content(sql_prompt)
            sql_query = response.text.strip().replace("```sql", "").replace("```", "").strip()

        logging.info(f"Generated SQL: {sql_query}")

        if sql_query == 'CONVERSATIONAL':
            return ({'answer': '¡Hola! Soy Agro-Sentinel AI. Pregúntame sobre temperatura, alarmas, humedad, CO2 o el estado del cultivo.', 'sql': ''}, 200, cors)

        # ── Step 2: execute SQL ───────────────────────────────────────────────
        if os.environ.get('MOCK_DB') == 'true':
            rows = [{"max_temp": 34.2, "min_temp": 12.1, "avg_temp": 22.7}]
        else:
            job  = bq_client.query(sql_query)
            rows = [dict(row) for row in job]

        # ── Step 3: rows → natural-language answer ────────────────────────────
        summary_prompt = f"""You are Agro-Sentinel AI, an assistant for greenhouse monitoring.
The user asked (in Spanish or English): "{user_query}"
The BigQuery result is: {json.dumps(rows[:10], default=str)}

Instructions:
- Answer in the same language the user used.
- Be concise and professional. Use emojis sparingly for readability.
- Format numbers with units (°C, %, ppm, kPa, µmol/m²/s).
- If the result is empty, say no data was found for the requested period.
- Do not mention SQL or technical details unless explicitly asked.
"""

        if os.environ.get('MOCK_AI') == 'true':
            final_answer = f"La temperatura máxima registrada fue **{rows[0].get('max_temp')}°C**, con un promedio de **{rows[0].get('avg_temp')}°C** en el periodo analizado."
        else:
            summary = model.generate_content(summary_prompt)
            final_answer = summary.text.strip()

        return ({'answer': final_answer, 'sql': sql_query}, 200, cors)

    except Exception as e:
        logging.error(f"AI error: {e}", exc_info=True)
        return ({'error': str(e)}, 500, cors)
