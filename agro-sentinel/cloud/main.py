import base64
import json
import logging
import os
import math
import hmac
import hashlib
import re
from datetime import datetime, timezone

if os.environ.get('USE_MOCK_GCP') == 'true':
    import mock_gcp as bigquery
    import mock_gcp as firestore
    logging.info("Using MOCK GCP Clients")
else:
    try:
        from google.cloud import bigquery
        from google.cloud import firestore
    except ImportError:
        import mock_gcp as bigquery
        import mock_gcp as firestore
        logging.info("Using MOCK GCP Clients (ImportError)")

project_id = os.environ.get('PROJECT_ID')
bq_client  = bigquery.Client(project=project_id)
db         = firestore.Client(project=project_id)

# ── Sensor ID allowlist (VULN-07) ─────────────────────────────────────────────
KNOWN_SENSOR_IDS = frozenset({'GH-AMB-01', 'GH-DUR-01', 'GH-CAY-01', 'GH-ORO-01', 'GH-TEN-01'})
_SENSOR_ID_RE    = re.compile(r'^GH-[A-Z]{3}-\d{2}$')

# ── Physically plausible value ranges (VULN-16) ───────────────────────────────
VALID_RANGES = {
    'temperature_c': (-50.0,  100.0),
    'humidity_rh':   (  0.0,  100.0),
    'co2_ppm':       (  0.0, 10000.0),
    'soil_moisture': (  0.0,  100.0),
    'par_umol':      (  0.0, 5000.0),
    'soil_ec':       (  0.0,   20.0),
    'soil_temp_c':   (-20.0,   80.0),
    'battery_level': (  0.0,  100.0),
    'rssi_dbm':      (-120.0,   0.0),
}

# ── ISA 18.2 — CRITICAL thresholds ────────────────────────────────────────────
CRITICAL = {
    "temperature":   {"min": 10,  "max": 38},
    "humidity":      {"min": 25,  "max": 98},
    "vpd_kpa":       {"min": 0.2, "max": 2.0},
    "co2_ppm":       {"min": 300, "max": 1800},
    "soil_moisture": {"min": 25,  "max": 92},
    "battery_level": {"min": 15,  "max": None},
    "rssi_dbm":      {"min": -90, "max": None},
}

WARNING = {
    "temperature":   {"min": 15,  "max": 30},
    "humidity":      {"min": 50,  "max": 85},
    "vpd_kpa":       {"min": 0.4, "max": 1.2},
    "co2_ppm":       {"min": 400, "max": 1200},
    "soil_moisture": {"min": 45,  "max": 80},
    "par_umol":      {"min": 200, "max": 800},
}


def _sanitize_float(value, key: str):
    """Cast to float and reject out-of-range values. Returns None on bad data."""
    if value is None:
        return None
    try:
        v = float(value)
    except (TypeError, ValueError):
        logging.warning(f"Non-numeric value for {key}: {value!r} — discarded")
        return None
    lo, hi = VALID_RANGES[key]
    if not (lo <= v <= hi):
        logging.warning(f"Out-of-range {key}={v} (allowed {lo}–{hi}) — discarded")
        return None
    return round(v, 4)


def _sanitize_int(value, key: str):
    v = _sanitize_float(value, key)
    return int(v) if v is not None else None


def calculate_vpd(T, RH):
    try:
        svp = 0.61078 * math.exp((17.27 * T) / (T + 237.3))
        return round(max(0, svp - svp * (RH / 100.0)), 3)
    except Exception:
        return None


def calculate_dew_point(T, RH):
    try:
        a, b  = 17.27, 237.7
        alpha = ((a * T) / (b + T)) + math.log(RH / 100.0)
        return round((b * alpha) / (a - alpha), 2)
    except Exception:
        return None


def _check_threshold(value, key, thresholds, level):
    if value is None:
        return []
    t = thresholds.get(key, {})
    alerts = []
    if t.get("max") is not None and value > t["max"]:
        alerts.append({"key": key, "level": level, "value": value, "breach": "HIGH"})
    if t.get("min") is not None and value < t["min"]:
        alerts.append({"key": key, "level": level, "value": value, "breach": "LOW"})
    return alerts


# ── HMAC signature verification (VULN-07) ─────────────────────────────────────
def _verify_hmac(payload_bytes: bytes, signature: str | None) -> bool:
    """
    Verifies HMAC-SHA256 signature from the Pub/Sub message attribute 'x_signature'.
    Skipped if HMAC_SECRET env var is not set (development/mock).
    """
    secret = os.environ.get('HMAC_SECRET', '')
    if not secret:
        return True   # Not configured — development mode, allow through with warning
    if not signature:
        logging.warning("Missing x_signature attribute; rejecting message")
        return False
    expected = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
    # Constant-time comparison prevents timing attacks
    return hmac.compare_digest(expected, signature)


def process_sensor_data(event, context):
    """Triggered from a message on a Cloud Pub/Sub topic."""
    raw_bytes = None
    try:
        if hasattr(event, 'data'):
            raw_bytes = base64.b64decode(event.data)
        elif isinstance(event, dict) and 'data' in event:
            raw_bytes = base64.b64decode(event['data'])
        else:
            raw_bytes = (event if isinstance(event, bytes)
                         else json.dumps(event).encode())

        # ── HMAC verification (VULN-07) ────────────────────────────────────────
        attributes = {}
        if isinstance(event, dict):
            attributes = event.get('attributes', {})
        elif hasattr(event, 'attributes'):
            attributes = event.attributes or {}

        signature = attributes.get('x_signature')
        if not _verify_hmac(raw_bytes, signature):
            logging.error("HMAC verification failed — message rejected")
            return

        data = json.loads(raw_bytes.decode('utf-8'))
        logging.info(f"Processing sensor_id={data.get('sensor_id')}")

    except Exception as e:
        logging.error(f"Error decoding message: {e}")
        return

    # ── Sensor ID validation (VULN-07) ─────────────────────────────────────────
    sensor_id = data.get("sensor_id", "")
    if not _SENSOR_ID_RE.match(sensor_id) or sensor_id not in KNOWN_SENSOR_IDS:
        logging.error(f"Unknown or malformed sensor_id '{sensor_id}' — rejected")
        return

    # ── Sanitize + validate all numeric fields (VULN-16) ──────────────────────
    temp      = _sanitize_float(data.get('temperature_c'), 'temperature_c')
    humidity  = _sanitize_float(data.get('humidity_rh'),   'humidity_rh')
    co2       = _sanitize_float(data.get('co2_ppm'),       'co2_ppm')
    soil      = _sanitize_float(data.get('soil_moisture'),  'soil_moisture')
    par       = _sanitize_float(data.get('par_umol'),       'par_umol')
    soil_ec   = _sanitize_float(data.get('soil_ec'),        'soil_ec')
    soil_temp = _sanitize_float(data.get('soil_temp_c'),    'soil_temp_c')
    battery   = _sanitize_int(data.get('battery_level'),    'battery_level')
    rssi      = _sanitize_int(data.get('rssi_dbm'),         'rssi_dbm')

    vpd        = calculate_vpd(temp, humidity)       if temp and humidity else None
    dew_point  = calculate_dew_point(temp, humidity) if temp and humidity else None

    # ── Alerting (ISA 18.2) ────────────────────────────────────────────────────
    critical_alerts, warning_alerts = [], []
    for key, val in [("temperature", temp), ("humidity", humidity), ("vpd_kpa", vpd),
                     ("co2_ppm", co2), ("soil_moisture", soil),
                     ("battery_level", battery), ("rssi_dbm", rssi)]:
        critical_alerts += _check_threshold(val, key, CRITICAL, "CRITICAL")
    for key, val in [("temperature", temp), ("humidity", humidity), ("vpd_kpa", vpd),
                     ("co2_ppm", co2), ("soil_moisture", soil), ("par_umol", par)]:
        warning_alerts += _check_threshold(val, key, WARNING, "WARNING")

    botrytis_risk = ("HIGH" if (temp and humidity and 15 <= temp <= 25 and humidity > 85)
                     else "LOW")
    all_alerts = critical_alerts + warning_alerts
    if all_alerts:
        logging.warning(f"🚨 ALERTS for {sensor_id}: {all_alerts}")

    # ── Firestore (real-time state) ────────────────────────────────────────────
    db.collection("greenhouses").document(sensor_id).set({
        "last_update":   datetime.now(timezone.utc),
        "temperature":   temp,
        "humidity":      humidity,
        "vpd_kpa":       vpd,
        "co2_ppm":       co2,
        "soil_moisture": soil,
        "par_umol":      par,
        "soil_ec":       soil_ec,
        "soil_temp_c":   soil_temp,
        "battery_level": battery,
        "rssi_dbm":      rssi,
        "dew_point_c":   dew_point,
        "botrytis_risk": botrytis_risk,
        "status":        ("CRITICAL" if critical_alerts
                          else ("WARNING" if warning_alerts else "OK")),
        "active_alerts": all_alerts,
    }, merge=True)

    # ── BigQuery (historical) ──────────────────────────────────────────────────
    table_id = os.environ.get('BQ_TABLE', "agro_sentinel_data.sensor_logs")
    row = {
        "sensor_id":     sensor_id,
        "timestamp":     data.get('timestamp') or datetime.now(timezone.utc).isoformat(),
        "temperature":   temp,
        "humidity":      humidity,
        "soil_moisture": soil,
        "co2_ppm":       co2,
        "par_umol":      par,
        "soil_ec":       soil_ec,
        "vpd_kpa":       vpd,
        "dew_point_c":   dew_point,
        "soil_temp_c":   soil_temp,
        "battery_level": battery,
        "rssi_dbm":      rssi,
    }

    errors = bq_client.insert_rows_json(table_id, [row])
    if errors:
        logging.error(f"BigQuery insert errors: {errors}")
    else:
        logging.info(f"Inserted row for {sensor_id}. VPD={vpd} botrytis={botrytis_risk}")
