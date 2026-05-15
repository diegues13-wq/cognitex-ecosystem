import base64
import json
import logging
import os
import math
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
bq_client = bigquery.Client(project=project_id)
db = firestore.Client(project=project_id)

# ISA 18.2 — CRITICAL thresholds (immediate action required)
CRITICAL = {
    "temperature":   {"min": 10,   "max": 38},
    "humidity":      {"min": 25,   "max": 98},
    "vpd_kpa":       {"min": 0.2,  "max": 2.0},
    "co2_ppm":       {"min": 300,  "max": 1800},
    "soil_moisture": {"min": 25,   "max": 92},
    "battery_level": {"min": 15,   "max": None},
    "rssi_dbm":      {"min": -90,  "max": None},
}

# WARNING thresholds (review recommended)
WARNING = {
    "temperature":   {"min": 15,   "max": 30},
    "humidity":      {"min": 50,   "max": 85},
    "vpd_kpa":       {"min": 0.4,  "max": 1.2},
    "co2_ppm":       {"min": 400,  "max": 1200},
    "soil_moisture": {"min": 45,   "max": 80},
    "par_umol":      {"min": 200,  "max": 800},
}


def calculate_vpd(T, RH):
    try:
        svp = 0.61078 * math.exp((17.27 * T) / (T + 237.3))
        return round(max(0, svp - svp * (RH / 100.0)), 3)
    except Exception:
        return None


def calculate_dew_point(T, RH):
    try:
        a, b = 17.27, 237.7
        alpha = ((a * T) / (b + T)) + math.log(RH / 100.0)
        return round((b * alpha) / (a - alpha), 2)
    except Exception:
        return None


def _check_threshold(value, key, thresholds, label):
    alerts = []
    if value is None:
        return alerts
    t = thresholds.get(key, {})
    if t.get("max") is not None and value > t["max"]:
        alerts.append({"key": key, "level": label, "value": value, "breach": "HIGH"})
    if t.get("min") is not None and value < t["min"]:
        alerts.append({"key": key, "level": label, "value": value, "breach": "LOW"})
    return alerts


def process_sensor_data(event, context):
    """Triggered from a message on a Cloud Pub/Sub topic."""
    try:
        if hasattr(event, 'data'):
            pubsub_message = base64.b64decode(event.data).decode('utf-8')
        elif isinstance(event, dict) and 'data' in event:
            pubsub_message = base64.b64decode(event['data']).decode('utf-8')
        else:
            data = event if isinstance(event, dict) else json.loads(event)
            pubsub_message = None

        if pubsub_message is not None:
            data = json.loads(pubsub_message)

        logging.info(f"Processing sensor_id={data.get('sensor_id')}")
    except Exception as e:
        logging.error(f"Error decoding message: {e}")
        return

    sensor_id   = data.get("sensor_id")
    temp        = data.get('temperature_c')
    humidity    = data.get('humidity_rh')
    co2         = data.get('co2_ppm')
    soil        = data.get('soil_moisture')
    par         = data.get('par_umol')
    soil_ec     = data.get('soil_ec')
    soil_temp   = data.get('soil_temp_c')
    battery     = data.get('battery_level')
    rssi        = data.get('rssi_dbm')

    vpd         = calculate_vpd(temp, humidity)
    dew_point   = calculate_dew_point(temp, humidity)

    # ── Alerting (ISA 18.2) ────────────────────────────────────────────────────
    critical_alerts, warning_alerts = [], []
    for key, val in [("temperature", temp), ("humidity", humidity), ("vpd_kpa", vpd),
                     ("co2_ppm", co2), ("soil_moisture", soil),
                     ("battery_level", battery), ("rssi_dbm", rssi)]:
        critical_alerts += _check_threshold(val, key, CRITICAL, "CRITICAL")
    for key, val in [("temperature", temp), ("humidity", humidity), ("vpd_kpa", vpd),
                     ("co2_ppm", co2), ("soil_moisture", soil), ("par_umol", par)]:
        warning_alerts += _check_threshold(val, key, WARNING, "WARNING")

    # Botrytis risk: temp 15–25°C + humidity > 85%
    botrytis_risk = "HIGH" if (temp and humidity and 15 <= temp <= 25 and humidity > 85) else "LOW"

    all_alerts = critical_alerts + warning_alerts
    if all_alerts:
        logging.warning(f"🚨 ALERTS for {sensor_id}: {all_alerts}")

    # ── Firestore (real-time state) ────────────────────────────────────────────
    doc_ref = db.collection("greenhouses").document(sensor_id)
    doc_ref.set({
        "last_update":      datetime.now(timezone.utc),
        "temperature":      temp,
        "humidity":         humidity,
        "vpd_kpa":          vpd,
        "co2_ppm":          co2,
        "soil_moisture":    soil,
        "par_umol":         par,
        "soil_ec":          soil_ec,
        "soil_temp_c":      soil_temp,
        "battery_level":    battery,
        "rssi_dbm":         rssi,
        "dew_point_c":      dew_point,
        "botrytis_risk":    botrytis_risk,
        "status":           "CRITICAL" if critical_alerts else ("WARNING" if warning_alerts else "OK"),
        "active_alerts":    all_alerts,
    }, merge=True)

    # ── BigQuery (historical) ──────────────────────────────────────────────────
    table_id = os.environ.get('BQ_TABLE', "agro_sentinel_data.sensor_logs")
    row = {
        "sensor_id":     sensor_id,
        "timestamp":     data['timestamp'],
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
