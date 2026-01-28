import sqlite3
import json
import logging
from datetime import datetime
import threading

DB_PATH = "buffer.sqlite"

class LocalBuffer:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        self.lock = threading.Lock()
        self._init_db()

    def _init_db(self):
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute('''CREATE TABLE IF NOT EXISTS sensor_data
                         (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                          payload TEXT, 
                          created_at TIMESTAMP)''')
            conn.commit()
            conn.close()

    def add(self, payload):
        """Store a JSON payload in the buffer."""
        try:
            with self.lock:
                conn = sqlite3.connect(self.db_path)
                c = conn.cursor()
                c.execute("INSERT INTO sensor_data (payload, created_at) VALUES (?, ?)",
                          (json.dumps(payload), datetime.utcnow()))
                conn.commit()
                conn.close()
                logging.info(f"💾 Buffered data locally. Rows: {self.count()}")
        except Exception as e:
            logging.error(f"Failed to buffer data: {e}")

    def get_batch(self, limit=50):
        """Retrieve oldest N records."""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute("SELECT id, payload FROM sensor_data ORDER BY id ASC LIMIT ?", (limit,))
            rows = c.fetchall()
            conn.close()
            return [{"id": row["id"], "payload": json.loads(row["payload"])} for row in rows]

    def remove_batch(self, ids):
        """Delete records by ID after successful transmission."""
        if not ids:
            return
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            # safe string formatting for ids
            placeholders = ','.join('?' for _ in ids)
            c.execute(f"DELETE FROM sensor_data WHERE id IN ({placeholders})", ids)
            conn.commit()
            conn.close()
            logging.info(f"🗑️ Removed {len(ids)} sent records from buffer.")

    def count(self):
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("SELECT COUNT(*) FROM sensor_data")
            count = c.fetchone()[0]
            conn.close()
            return count
