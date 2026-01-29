import time
import json
import os
# from google.cloud import pubsub_v1
from datetime import datetime
from .database import get_unsynced, mark_synced

# Configuration
PROJECT_ID = "cognitex-industrial-prod"
TOPIC_ID = "sensor-readings"

# Placeholder checking connectivity (Mock)
def is_online():
    # In a real scenario, this would check ping google.com
    # For simulation, we toggle random availability or assume True
    return True

def sync_to_cloud(publisher=None, topic_path=None):
    """Push unsynced data to Google Cloud Pub/Sub."""
    
    if not is_online():
        print("Offline... skipping sync.")
        return

    batch = get_unsynced(limit=20)
    if not batch:
        return

    print(f"Attempting to sync {len(batch)} records...")
    
    synced_ids = []
    for record in batch:
        data_str = json.dumps(record)
        data_bytes = data_str.encode("utf-8")

        try:
            # Real implementation:
            # future = publisher.publish(topic_path, data_bytes)
            # future.result() 
            
            # Mock Success
            synced_ids.append(record["id"])
            
        except Exception as e:
            print(f"Failed to publish {record['id']}: {e}")
            break # Stop sync on error

    if synced_ids:
        mark_synced(synced_ids)

def start_sync_agent(interval=5):
    """Background loop to sync data."""
    print("Starting Cloud Sync Agent...")
    
    # Initialize Pub/Sub Client (Commented out until Auth is set)
    # publisher = pubsub_v1.PublisherClient()
    # topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)
    
    while True:
        sync_to_cloud()
        time.sleep(interval)
