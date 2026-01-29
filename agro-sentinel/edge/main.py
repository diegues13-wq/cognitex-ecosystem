import threading
import time
from src.database import init_db
from src.capture import simulate_sensors
from src.sync import start_sync_agent

def main():
    print("--- Cognitex Industrial Edge Agent v1.0 ---\n")
    
    # 1. Initialize Local Storage
    init_db()
    
    # 2. Start Sensor Simulation (Producer Thread)
    # in real life, this would read from GPIO / Modbus
    capture_thread = threading.Thread(target=simulate_sensors, args=(2,), daemon=True)
    capture_thread.start()
    
    # 3. Start Cloud Sync (Consumer Thread)
    # uploads data to GCP whenever connection is available
    sync_thread = threading.Thread(target=start_sync_agent, args=(5,), daemon=True)
    sync_thread.start()
    
    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping Agent...")

if __name__ == "__main__":
    main()
