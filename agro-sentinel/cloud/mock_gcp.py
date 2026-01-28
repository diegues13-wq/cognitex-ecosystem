class Client:
    def __init__(self, *args, **kwargs):
        pass
    
    def collection(self, name):
        return self
        
    def document(self, name):
        return self
        
    def set(self, data, merge=False):
        print(f"[MOCK Firestore] Setting doc data: {data}")
        
    def insert_rows_json(self, table_id, rows):
        print(f"[MOCK BigQuery] Inserting into {table_id}: {rows}")
        return [] # Return empty list means no errors

class StorageClient:
    def __init__(self, *args, **kwargs): pass
    def bucket(self, name): return Bucket(name)

class Bucket:
    def __init__(self, name): self.name = name
    def blob(self, name): return Blob(name)

class Blob:
    def __init__(self, name): self.name = name
    def download_as_string(self): return b"fake-image-content"

