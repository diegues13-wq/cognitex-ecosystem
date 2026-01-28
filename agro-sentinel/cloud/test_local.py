import logging
import base64
import json
from main import process_sensor_data

# Configure logging to see output
logging.basicConfig(level=logging.INFO)

def test_local_invocation():
    # Sample payload from Edge
    payload = {
        "sensor_id": "GH-TEST-01",
        "timestamp": "2026-01-20T12:00:00Z",
        "temperature_c": 32.5,  # Should trigger High Temp Alert
        "humidity_rh": 60.0,
        "soil_moisture": 42.0,
        "battery_level": 95.0
    }
    
    # Wrap in Pub/Sub message format (base64 encoded data)
    json_str = json.dumps(payload)
    data_b64 = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
    
    event = {'data': data_b64}
    
    print("--- Starting Local Cloud Function Test ---")
    process_sensor_data(event, {})
    print("--- Test Completed ---")

if __name__ == "__main__":
    test_local_invocation()
