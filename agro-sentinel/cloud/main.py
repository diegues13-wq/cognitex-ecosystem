import base64
import json
import logging
import os
import math
from datetime import datetime, timezone

# Local mock import if not in GCP environment (for POC purposes)
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

# Initialize Clients (Global scope for reuse in warm instances)
project_id = os.environ.get('PROJECT_ID')
bq_client = bigquery.Client(project=project_id)
db = firestore.Client(project=project_id)

THRESHOLDS = {
    "temperature_c": {"min": 15, "max": 30},
    "humidity_rh": {"min": 40, "max": 80},
    "vpd_kpa": {"min": 0.4, "max": 1.6}
}

# --- HELPER FUNCTIONS ---
def calculate_vpd(T, RH):
    """
    Calculate Vapor Pressure Deficit (kPa).
    """
    try:
        # Saturation Vapor Pressure (Tetens formula)
        svp = 0.61078 * math.exp((17.27 * T) / (T + 237.3))
        # Actual Vapor Pressure
        vp = svp * (RH / 100.0)
        return round(svp - vp, 3)
    except Exception:
        return None

def calculate_dew_point(T, RH):
    """
    Calculate Dew Point (°C) using Magnus formula.
    """
    try:
        a = 17.27
        b = 237.7
        alpha = ((a * T) / (b + T)) + math.log(RH / 100.0)
        return round((b * alpha) / (a - alpha), 2)
    except Exception:
        return None

def process_sensor_data(event, context):
    """Triggered from a message on a Cloud Pub/Sub topic."""
    
    # 1. Decode Pub/Sub message
    try:
        if hasattr(event, 'data'):
             pubsub_message = base64.b64decode(event.data).decode('utf-8')
        elif isinstance(event, dict) and 'data' in event:
             pubsub_message = base64.b64decode(event['data']).decode('utf-8')
        else:
            # Fallback for direct HTTP invocation
            data = event
            if isinstance(data, str):
                data = json.loads(data)
            logging.info(f"Processing direct data: {data}")
            if not isinstance(data, dict):
                return

        if 'pubsub_message' in locals():
            data = json.loads(pubsub_message)
            
        logging.info(f"Processing data id={data.get('sensor_id')}")
        
    except Exception as e:
        logging.error(f"Error decoding message: {e}")
        return

    # 2. Logic & Calculations
    sensor_id = data.get("sensor_id")
    temp = data.get('temperature_c')
    humidity = data.get('humidity_rh')
    
    # Calculate physiological metrics
    vpd = calculate_vpd(temp, humidity)
    dew_point = calculate_dew_point(temp, humidity)
    
    # 3. Validation & Alerting
    alerts = []
    
    # Check Temperature
    if temp > THRESHOLDS['temperature_c']['max']:
        alerts.append(f"High Temp Alert: {temp}C")
    elif temp < THRESHOLDS['temperature_c']['min']:
        alerts.append(f"Low Temp Alert: {temp}C")
        
    # Check Humidity
    if humidity < THRESHOLDS['humidity_rh']['min']:
        alerts.append(f"Low Humidity Alert: {humidity}%")
        
    # Check VPD (New)
    if vpd is not None:
        if vpd < THRESHOLDS['vpd_kpa']['min']:
             alerts.append(f"Danger: Low VPD ({vpd} kPa) - Fungal Risk")
        elif vpd > THRESHOLDS['vpd_kpa']['max']:
             alerts.append(f"Danger: High VPD ({vpd} kPa) - Plant Stress")

    # 4. Store in Firestore (Real-time State)
    doc_ref = db.collection("greenhouses").document(sensor_id)
    doc_ref.set({
        "last_update": datetime.now(timezone.utc),
        "current_temp": temp,
        "current_humidity": humidity,
        "current_vpd": vpd,
        "current_co2": data.get('co2_ppm'),
        "status": "ALERT" if alerts else "OK",
        "active_alerts": alerts
    }, merge=True)

    # 5. Insert into BigQuery (Historical)
    table_id = os.environ.get('BQ_TABLE', "agro_sentinel_data.sensor_logs")
    
    row = {
        "sensor_id": sensor_id,
        "timestamp": data['timestamp'],
        "temperature": temp,
        "humidity": humidity,
        "soil_moisture": data.get('soil_moisture'),
        "co2_ppm": data.get('co2_ppm'),
        "par_umol": data.get('par_umol'),
        "soil_ec": data.get('soil_ec'),
        "vpd_kpa": vpd,
        "dew_point_c": dew_point,
        "battery_level": data.get('battery_level')
    }
    
    errors = bq_client.insert_rows_json(table_id, [row])
    if errors == []:
        logging.info(f"Inserted row. Calculated VPD={vpd}")
    else:
        logging.error(f"Encountered errors while inserting rows: {errors}")

    if alerts:
        logging.warning(f"🚨 ALERTS GENERATED: {alerts}")
