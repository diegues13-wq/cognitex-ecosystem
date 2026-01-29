import random
import time
from .database import buffer_reading

SENSORS = [
    {"id": "temp_01", "min": 20.0, "max": 35.0},
    {"id": "humid_01", "min": 40.0, "max": 80.0},
    {"id": "soil_01", "min": 300, "max": 800},
]

def simulate_sensors(interval=1):
    """Continuously generate mock sensor data."""
    print("Starting Sensor Simulation...")
    while True:
        for sensor in SENSORS:
            # Simulate value with some jitter
            val = round(random.uniform(sensor["min"], sensor["max"]), 2)
            
            # Write to local DB (Offline First)
            buffer_reading(sensor["id"], val)
            
        time.sleep(interval)
