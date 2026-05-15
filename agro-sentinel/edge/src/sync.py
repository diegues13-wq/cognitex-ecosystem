import time
import json
import os
import logging
from datetime import datetime, timezone

from google.cloud import pubsub_v1  # type: ignore[import]
from .database import get_unsynced, mark_synced

logging.basicConfig(level=logging.INFO, format='%(asctime)s [SYNC] %(message)s')

PROJECT_ID = os.environ.get('GCP_PROJECT_ID', 'cognitex-industrial-prod')
TOPIC_ID   = os.environ.get('PUBSUB_TOPIC_ID', 'sensors')


def is_online() -> bool:
    """Quick connectivity check — attempts to reach Google DNS."""
    import socket
    try:
        socket.setdefaulttimeout(2)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect(('8.8.8.8', 53))
        return True
    except OSError:
        return False


def _build_pubsub_payload(record: dict) -> dict:
    """Map SQLite row fields to the Cloud Function's expected schema."""
    return {
        "sensor_id":     record.get("sensor_id"),
        "timestamp":     record.get("timestamp") or datetime.now(timezone.utc).isoformat(),
        "temperature_c": record.get("temperature_c") or record.get("temperature"),
        "humidity_rh":   record.get("humidity_rh")   or record.get("humidity"),
        "co2_ppm":       record.get("co2_ppm")        or record.get("co2"),
        "soil_moisture": record.get("soil_moisture"),
        "par_umol":      record.get("par_umol")       or record.get("par"),
        "soil_ec":       record.get("soil_ec"),
        "soil_temp_c":   record.get("soil_temp_c")    or record.get("soil_temp"),
        "battery_level": record.get("battery_level")  or record.get("battery"),
        "rssi_dbm":      record.get("rssi_dbm")       or record.get("rssi"),
    }


def sync_to_cloud(publisher: pubsub_v1.PublisherClient, topic_path: str):
    """Push unsynced records to Cloud Pub/Sub, then mark them done."""
    if not is_online():
        logging.info("Offline — skipping sync.")
        return

    batch = get_unsynced(limit=50)
    if not batch:
        return

    logging.info(f"Syncing {len(batch)} records…")
    synced_ids = []

    for record in batch:
        try:
            payload = _build_pubsub_payload(record)
            data    = json.dumps(payload).encode('utf-8')
            future  = publisher.publish(topic_path, data)
            future.result()                        # blocks until ACK or raises
            synced_ids.append(record["_row_id"])
        except Exception as exc:
            logging.error(f"Failed to publish row {record.get('_row_id')}: {exc}")
            break                                  # stop batch on first error

    if synced_ids:
        mark_synced(synced_ids)
        logging.info(f"Synced {len(synced_ids)} records.")


def start_sync_agent(interval: int = 30):
    """Background loop: sync every `interval` seconds."""
    logging.info(f"Starting Cloud Sync Agent (project={PROJECT_ID} topic={TOPIC_ID} interval={interval}s)")
    publisher  = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)

    while True:
        try:
            sync_to_cloud(publisher, topic_path)
        except Exception as exc:
            logging.error(f"Sync agent error: {exc}")
        time.sleep(interval)
