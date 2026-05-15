import functions_framework
import logging
import os
import json
import re
from google.cloud import bigquery

import vertexai
try:
    from vertexai.generative_models import GenerativeModel          # type: ignore[import] # >= 1.38
except ImportError:                                                  # pragma: no cover
    from vertexai.preview.generative_models import GenerativeModel  # type: ignore[import]

try:
    import firebase_admin                                            # type: ignore[import]
    from firebase_admin import auth as firebase_auth                 # type: ignore[import]
    _HAS_FIREBASE_ADMIN = True
except ImportError:                                                  # pragma: no cover
    _HAS_FIREBASE_ADMIN = False

bq_client = bigquery.Client()

# ── Config ────────────────────────────────────────────────────────────────────
ALLOWED_ORIGIN  = os.environ.get('ALLOWED_ORIGIN', '')   # must be set in Terraform env vars
REQUIRE_AUTH    = os.environ.get('REQUIRE_AUTH', 'true').lower() == 'true'
MAX_QUERY_LEN   = 500

KNOWN_SENSOR_IDS = frozenset({'GH-AMB-01', 'GH-DUR-01', 'GH-CAY-01', 'GH-ORO-01', 'GH-TEN-01'})

# Blocks any SQL that isn't a plain SELECT (prevents prompt-injection → DDL attacks)
_DDL_PATTERN = re.compile(
    r'\b(DROP|DELETE|INSERT|UPDATE|CREATE|MERGE|TRUNCATE|ALTER|GRANT|REVOKE|'
    r'EXEC|EXECUTE|CALL|LOAD|COPY|EXPORT|IMPORT|DECLARE|BEGIN|COMMIT|ROLLBACK|'
    r'SET|INFORMATION_SCHEMA)\b',
    re.IGNORECASE,
)

SCHEMA_CONTEXT = """
BigQuery Table: `agro_sentinel_data.sensor_logs`
Partitioned by DAY on `timestamp`.

Columns:
  sensor_id      STRING    REQUIRED  — farm ID, e.g. 'GH-AMB-01'
  timestamp      TIMESTAMP REQUIRED  — UTC reading time
  temperature    FLOAT     — air temperature °C
  humidity       FLOAT     — relative humidity %
  soil_moisture  FLOAT     — volumetric soil moisture %
  co2_ppm        FLOAT     — CO2 ppm
  par_umol       FLOAT     — PAR radiation µmol/m²/s
  soil_ec        FLOAT     — soil EC mS/cm
  vpd_kpa        FLOAT     — vapour pressure deficit kPa
  dew_point_c    FLOAT     — dew point °C
  soil_temp_c    FLOAT     — soil temperature °C
  battery_level  INTEGER   — battery %
  rssi_dbm       INTEGER   — WiFi signal dBm

CRITICAL alarm thresholds:
  temperature > 38 or < 10 °C
  humidity < 25 %
  co2_ppm > 1800 ppm
  soil_moisture < 25 %
  battery_level < 15 %
  rssi_dbm < -90 dBm

Known farm IDs: GH-AMB-01 (Ambato), GH-DUR-01 (Duran), GH-CAY-01 (Cayambe),
                GH-ORO-01 (Machala), GH-TEN-01 (Tena)
"""

# ── Lazy singletons ───────────────────────────────────────────────────────────
_model: GenerativeModel | None = None
_firebase_app = None


def _get_model() -> GenerativeModel:
    global _model
    if _model is None:
        vertexai.init(location=os.environ.get('VERTEX_LOCATION', 'us-central1'))
        _model = GenerativeModel("gemini-1.5-flash")
    return _model


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is None and _HAS_FIREBASE_ADMIN:
        _firebase_app = firebase_admin.initialize_app()
    return _firebase_app


# ── Auth ──────────────────────────────────────────────────────────────────────
def _verify_token(request) -> bool:
    if not REQUIRE_AUTH or os.environ.get('MOCK_AI') == 'true':
        return True
    if not _HAS_FIREBASE_ADMIN:
        logging.error("firebase-admin not installed; all requests rejected")
        return False
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return False
    try:
        _get_firebase_app()
        firebase_auth.verify_id_token(auth_header[7:])
        return True
    except Exception as exc:
        logging.warning(f"Token verification failed: {exc}")
        return False


# ── CORS ──────────────────────────────────────────────────────────────────────
def _cors_headers() -> dict:
    # Never reflect the request Origin — use only the explicitly configured value
    origin = ALLOWED_ORIGIN if ALLOWED_ORIGIN else 'null'
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600',
    }


# ── SQL validation ────────────────────────────────────────────────────────────
def _validate_sql(sql: str) -> tuple[bool, str]:
    """
    Accept only bare SELECT statements against our known table.
    Returns (is_valid, cleaned_sql_or_reason).
    """
    cleaned = sql.strip().rstrip(';')

    if not re.match(r'^\s*SELECT\b', cleaned, re.IGNORECASE):
        return False, "Only SELECT statements are permitted"

    if _DDL_PATTERN.search(cleaned):
        return False, "SQL contains disallowed keywords"

    if 'information_schema' in cleaned.lower():
        return False, "Access to INFORMATION_SCHEMA is not permitted"

    # Enforce a hard LIMIT cap if Gemini omitted one
    if not re.search(r'\bLIMIT\s+\d+\b', cleaned, re.IGNORECASE):
        cleaned += ' LIMIT 100'

    return True, cleaned


# ── Main handler ──────────────────────────────────────────────────────────────
@functions_framework.http
def ask_ai(request):
    cors = _cors_headers()

    if request.method == 'OPTIONS':
        return ('', 204, cors)

    if not _verify_token(request):
        return ({'error': 'Unauthorized'}, 401, cors)

    body = request.get_json(silent=True)
    if not body:
        return ({'error': 'Invalid JSON body'}, 400, cors)

    # ── Input validation ───────────────────────────────────────────────────────
    user_query  = body.get('query')
    location_id = body.get('location_id')

    if not isinstance(user_query, str) or not user_query.strip():
        return ({'error': "Field 'query' must be a non-empty string"}, 400, cors)

    if len(user_query) > MAX_QUERY_LEN:
        return ({'error': f"Query exceeds {MAX_QUERY_LEN} characters"}, 400, cors)

    if location_id is not None:
        if not isinstance(location_id, str) or location_id not in KNOWN_SENSOR_IDS:
            return ({'error': 'Invalid location_id'}, 400, cors)

    # Safe to interpolate because location_id passed the allowlist check above
    location_filter = f"AND sensor_id = '{location_id}'" if location_id else ""

    logging.info(f"AI query received (len={len(user_query)}, location={location_id})")

    try:
        model = _get_model()

        # ── Step 1: text → SQL ─────────────────────────────────────────────────
        sql_prompt = f"""You are a data analyst for Agro-Sentinel, an IoT greenhouse platform.
The user writes queries in Spanish or English. Respond with valid Standard SQL for BigQuery.

{SCHEMA_CONTEXT}

Rules:
- Return ONLY the SQL query. No markdown, no explanation, no semicolons.
- Always include: WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 365 DAY) {location_filter}
- Use CRITICAL alarm thresholds defined above for alarm/alert queries.
- Do NOT use DDL (DROP, DELETE, INSERT, UPDATE, CREATE, ALTER, etc.).
- If the question is conversational, return exactly: CONVERSATIONAL
- Always include LIMIT 20 or fewer rows for non-aggregate queries.

User question: "{user_query}"
"""

        if os.environ.get('MOCK_AI') == 'true':
            sql_query = (
                "SELECT MAX(temperature) as max_temp, MIN(temperature) as min_temp, "
                "AVG(temperature) as avg_temp FROM `agro_sentinel_data.sensor_logs` "
                f"WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 365 DAY) {location_filter}"
            )
        else:
            response  = model.generate_content(sql_prompt)
            sql_query = response.text.strip().replace("```sql", "").replace("```", "").strip()

        logging.info(f"Gemini returned SQL (len={len(sql_query)})")

        if sql_query == 'CONVERSATIONAL':
            return ({'answer': '¡Hola! Soy Agro-Sentinel AI. Pregúntame sobre temperatura, alarmas, humedad, CO2 o el estado del cultivo.', 'sql': ''}, 200, cors)

        # ── SQL safety validation (blocks prompt-injection → DDL) ───────────────
        is_valid, result = _validate_sql(sql_query)
        if not is_valid:
            logging.warning(f"SQL rejected ({result}): {sql_query[:200]}")
            return ({'answer': 'No pude generar una consulta segura para esa pregunta. Intenta reformularla con más detalle.', 'sql': ''}, 200, cors)

        validated_sql = result

        # ── Step 2: execute SQL ─────────────────────────────────────────────────
        if os.environ.get('MOCK_DB') == 'true':
            rows = [{"max_temp": 34.2, "min_temp": 12.1, "avg_temp": 22.7}]
        else:
            job  = bq_client.query(validated_sql)
            rows = [dict(row) for row in job]

        # ── Step 3: rows → natural-language answer ──────────────────────────────
        summary_prompt = f"""You are Agro-Sentinel AI, an assistant for greenhouse monitoring.
The user asked: "{user_query}"
BigQuery result: {json.dumps(rows[:10], default=str)}

Instructions:
- Answer in the same language the user used (Spanish or English).
- Be concise and professional. Use emojis sparingly.
- Format numbers with units (°C, %, ppm, kPa, µmol/m²/s).
- If the result is empty, say no data was found for the requested period.
- Do NOT mention SQL, BigQuery, or technical implementation details.
"""

        if os.environ.get('MOCK_AI') == 'true':
            v = rows[0]
            final_answer = f"La temperatura máxima registrada fue **{v.get('max_temp')}°C**, mínima **{v.get('min_temp')}°C**, promedio **{v.get('avg_temp')}°C**."
        else:
            summary      = model.generate_content(summary_prompt)
            final_answer = summary.text.strip()

        return ({'answer': final_answer, 'sql': validated_sql}, 200, cors)

    except Exception:
        # Never leak exception details to the client — log server-side only
        logging.error("ask_ai unhandled error", exc_info=True)
        return ({'error': 'Internal server error'}, 500, cors)
