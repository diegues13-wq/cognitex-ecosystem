import sqlite3
import json
from datetime import datetime, timezone

DB_PATH = "edge_buffer.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # payload stored as JSON blob so all sensor fields travel together
    c.execute('''
        CREATE TABLE IF NOT EXISTS readings (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id  TEXT    NOT NULL,
            payload    TEXT    NOT NULL,
            timestamp  TEXT    NOT NULL,
            synced     INTEGER NOT NULL DEFAULT 0
        )
    ''')
    c.execute('CREATE INDEX IF NOT EXISTS idx_unsynced ON readings (synced, id)')
    conn.commit()
    conn.close()
    print(f"[{datetime.now()}] Database initialized.")


def buffer_reading(sensor_id: str, payload: dict):
    """Store a full sensor reading locally (offline-first)."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    ts = datetime.now(timezone.utc).isoformat()
    c.execute(
        "INSERT INTO readings (sensor_id, payload, timestamp) VALUES (?, ?, ?)",
        (sensor_id, json.dumps(payload), ts),
    )
    conn.commit()
    conn.close()


def get_unsynced(limit: int = 50) -> list:
    """Return unsynced readings as dicts ready to publish."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute(
        "SELECT id, sensor_id, payload, timestamp FROM readings WHERE synced = 0 ORDER BY id LIMIT ?",
        (limit,),
    )
    rows = []
    for row in c.fetchall():
        record = json.loads(row["payload"])
        record["_row_id"]   = row["id"]
        record["sensor_id"] = row["sensor_id"]
        record["timestamp"] = record.get("timestamp") or row["timestamp"]
        rows.append(record)
    conn.close()
    return rows


def mark_synced(reading_ids: list):
    """Mark a batch of row IDs as successfully uploaded."""
    if not reading_ids:
        return
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    placeholders = ','.join('?' * len(reading_ids))
    c.execute(f"UPDATE readings SET synced = 1 WHERE id IN ({placeholders})", reading_ids)
    conn.commit()
    conn.close()
    print(f"[{datetime.now()}] Marked {len(reading_ids)} records as synced.")
