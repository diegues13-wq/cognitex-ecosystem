import time
import json
import os
import hmac
import hashlib
import logging
from datetime import datetime, timezone

from google.cloud import pubsub_v1  # type: ignore[import]
from .database import get_unsynced, mark_synced

logging.basicConfig(level=logging.INFO, format='%(asctime)s [SYNC] %(message)s')

# ── Config — all values MUST come from environment variables (VULN-02) ─────────
# Never fall back to a hardcoded project ID. The process will raise KeyError on
# startup rather than silently connecting to a production project.
PROJECT_ID = os.environ['GCP_PROJECT_ID']
TOPIC_ID   = os.environ.get('PUBSUB_TOPIC_ID', 'sensors')

# HMAC secret shared with the Cloud Function (VULN-07).
# Store in /etc/agro-sentinel/env or inject via systemd EnvironmentFile.
# If unset, messages are published unsigned (development only — log a warning).
HMAC_SECRET = os.environ.get('HMAC_SECRET', '')

# VULN-17 note: the service account used by this process should be a dedicated
# least-privilege SA with only roles/pubsub.publisher on the 'sensors' topic.
# Create it in Terraform:
#   resource "google_service_account" "edge_publisher" { account_id = "agro-edge-publisher" }
#   resource "google_pubsub_topic_iam_member" "edge_publish" {
#     topic  = google_pubsub_topic.sensor_topic.id
#     role   = "roles/pubsub.publisher"
#     member = "serviceAccount:${google_service_account.edge_publisher.email}"
#   }
# Store the key at /etc/agro-sentinel/credentials.json (chmod 0400, owned by service user)
# and set GOOGLE_APPLICATION_CREDENTIALS=/etc/agro-sentinel/credentials.json.


def is_online() -> bool:
    """TCP connectivity check to Google DNS."""
    import socket
    try:
        socket.setdefaulttimeout(2)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect(('8.8.8.8', 53))
        return True
    except OSError:
        return False


def _sign_payload(payload_bytes: bytes) -> str | None:
    """Return HMAC-SHA256 hex digest, or None if HMAC_SECRET is not configured."""
    if not HMAC_SECRET:
        logging.warning("HMAC_SECRET not set — publishing unsigned (development mode only)")
        return None
    return hmac.new(HMAC_SECRET.encode(), payload_bytes, hashlib.sha256).hexdigest()


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
    """Push unsynced records to Cloud Pub/Sub, then mark them as synced."""
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
            payload      = _build_pubsub_payload(record)
            data_bytes   = json.dumps(payload).encode('utf-8')
            signature    = _sign_payload(data_bytes)

            # Include HMAC signature as a Pub/Sub message attribute (VULN-07)
            attributes = {'x_signature': signature} if signature else {}

            future = publisher.publish(topic_path, data_bytes, **attributes)
            future.result()   # blocks until ACK or raises
            synced_ids.append(record["_row_id"])
        except Exception as exc:
            logging.error(f"Failed to publish row {record.get('_row_id')}: {exc}")
            break             # stop batch on first error

    if synced_ids:
        mark_synced(synced_ids)
        logging.info(f"Synced {len(synced_ids)} records.")


def start_sync_agent(interval: int = 30):
    """Background loop: sync every `interval` seconds."""
    logging.info(
        f"Starting Cloud Sync Agent "
        f"(project={PROJECT_ID} topic={TOPIC_ID} interval={interval}s "
        f"hmac={'enabled' if HMAC_SECRET else 'DISABLED — set HMAC_SECRET for production'})"
    )
    publisher  = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)

    while True:
        try:
            sync_to_cloud(publisher, topic_path)
        except Exception as exc:
            logging.error(f"Sync agent error: {exc}")
        time.sleep(interval)
