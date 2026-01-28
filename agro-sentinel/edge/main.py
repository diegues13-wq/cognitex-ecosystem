import time
import logging
import paho.mqtt.client as mqtt
from simulator import GreenhouseSimulator
from storage import LocalBuffer

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Configuration
GCP_PROJECT_ID = "cognitex-agro" # Placeholder
REGISTRY_ID = "greenhouse-registry"
DEVICE_ID = "GH-ECU-01"
REGION = "us-central1"
# In a real IOT Core scenario, we would use JWT generation here.
# For this MVP/Architecture demonstration, we will assume a standard MQTT broker or 
# a bridge approach. Let's simulate the connection behavior.

MQTT_BROKER = "mqtt.googleapis.com" # Or your private mosquitto bridge
MQTT_PORT = 8883
TOPIC = f"projects/{GCP_PROJECT_ID}/topics/sensors"

class Gateway:
    def __init__(self):
        self.buffer = LocalBuffer()
        self.connected = False
        self.client = mqtt.Client(client_id=DEVICE_ID)
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        
        # In real GCP IoT Core, you need SSL & JWT
        # self.client.tls_set(ca_certs="roots.pem")
        # self.client.username_pw_set(username="unused", password=create_jwt(...)
        
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logging.info("✅ Connected to MQTT Broker")
            self.connected = True
        else:
            logging.error(f"Failed to connect, return code {rc}")

    def on_disconnect(self, client, userdata, rc):
        logging.warning("❌ Disconnected from MQTT Broker")
        self.connected = False

    def start(self):
        # failure to connect shouldn't crash the script
        try:
            # For POC we might not have a real broker running, so expect failures
            # self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
            # self.client.loop_start()
            pass
        except Exception as e:
            logging.warning(f"Could not connect to broker (Simulation Mode): {e}")

    def publish_with_retry(self, payload):
        """Try to publish, buffer if failed."""
        
        # SIMULATION: Randomly toggle connection to demonstrate buffering
        # In real code, rely on self.connected
        mock_connection = int(time.time()) % 20 > 5 # Disconnected for 5s every 20s
        
        if mock_connection:
            try:
                # Real: self.client.publish(TOPIC, json.dumps(payload))
                logging.info(f"📡 PUBLISHING: Temp={payload['temperature_c']}C")
                
                # Check buffer
                self.flush_buffer()
                return True
            except Exception as e:
                logging.error(f"Publish failed: {e}")
                self.buffer.add(payload)
                return False
        else:
            logging.warning("⚠️ No Connection. Buffering data.")
            self.buffer.add(payload)
            return False

    def flush_buffer(self):
        """Check if we have old data to send."""
        count = self.buffer.count()
        if count > 0:
            logging.info(f"🔄 Flushing {count} buffered records...")
            batch = self.buffer.get_batch(10)
            ids_to_remove = []
            for item in batch:
                # Simulate publish
                logging.info(f"   >> Re-sending deferred: {item['payload']['timestamp']}")
                ids_to_remove.append(item['id'])
            
            self.buffer.remove_batch(ids_to_remove)

def main():
    gateway = Gateway()
    gateway.start()
    
    sim = GreenhouseSimulator(DEVICE_ID)
    logging.info(f"Starting Agro-Sentinel Edge Gateway for {DEVICE_ID}")
    
    try:
        while True:
            data = sim.get_data()
            gateway.publish_with_retry(data)
            time.sleep(2) # Faster polling for visual debugging
            
    except KeyboardInterrupt:
        logging.info("Stopping Gateway...")

if __name__ == "__main__":
    main()
