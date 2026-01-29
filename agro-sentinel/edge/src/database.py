import sqlite3
import json
import time
from datetime import datetime

DB_PATH = "edge_buffer.db"

def init_db():
    """Initialize the local SQLite buffer."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS readings
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  sensor_id TEXT,
                  value REAL,
                  timestamp TEXT,
                  synced INTEGER DEFAULT 0)''')
    conn.commit()
    conn.close()
    print(f"[{datetime.now()}] Database initialized.")

def buffer_reading(sensor_id, value):
    """Store a sensor reading locally (Offline First)."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    ts = datetime.utcnow().isoformat()
    c.execute("INSERT INTO readings (sensor_id, value, timestamp) VALUES (?, ?, ?)",
              (sensor_id, value, ts))
    conn.commit()
    conn.close()
    # print(f"Buffered: {sensor_id}={value} at {ts}")

def get_unsynced(limit=50):
    """Retrieve readings that haven't been uploaded yet."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM readings WHERE synced = 0 LIMIT ?", (limit,))
    rows = [dict(row) for row in c.fetchall()]
    conn.close()
    return rows

def mark_synced(reading_ids):
    """Mark a batch of readings as uploaded."""
    if not reading_ids:
        return
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    placeholders = ','.join('?' * len(reading_ids))
    c.execute(f"UPDATE readings SET synced = 1 WHERE id IN ({placeholders})", reading_ids)
    conn.commit()
    conn.close()
    print(f"[{datetime.now()}] marked {len(reading_ids)} records as synced.")
