import functions_framework
import logging
from google.cloud import firestore
from google.cloud import storage


import os

# Initialize clients
if os.environ.get('USE_MOCK_GCP') == 'true':
    import mock_gcp as firestore
    import mock_gcp as storage
    # Mock Vertex AI
    class MockGenerativeModel:
        def __init__(self, model_name): pass
    
    vertexai = None
    model = MockGenerativeModel("gemini-pro-vision")
    db = firestore.Client()
    storage_client = storage.StorageClient()
else:
    try:
        from google.cloud import firestore
        from google.cloud import storage
        import vertexai
        from vertexai.preview.generative_models import GenerativeModel
        
        db = firestore.Client()
        storage_client = storage.Client()
        vertexai.init(location="us-central1")
        model = GenerativeModel("gemini-pro-vision")
    except ImportError:
        import mock_gcp as firestore
        import mock_gcp as storage
        logging.warning("GCP libraries not found, using mocks")
        db = firestore.Client()
        storage_client = storage.Client()
        model = None

@functions_framework.cloud_event
def process_thermal_image(cloud_event):
    """
    Triggered by a change to a Cloud Storage object.
    Analyzes thermal images for hot spots using Gemini Vision.
    """
    data = cloud_event.data
    bucket_name = data["bucket"]
    file_name = data["name"]

    logging.info(f"Processing new thermal image: gs://{bucket_name}/{file_name}")

    if not file_name.endswith(('.jpg', '.jpeg', '.png')):
        logging.info("Not an image file, skipping.")
        return

    try:
        # 1. Get the image from GCS
        # In a real scenario, we might pass the GCS URI directly to Gemini if supported/accessible
        # uri = f"gs://{bucket_name}/{file_name}"
        # image_part = Part.from_uri(uri, mime_type="image/jpeg")
        
        # For this stub, we simulate the analysis result
        # real_response = model.generate_content([
        #     image_part, 
        #     "Analyze this thermal image. Are there anomalies? Return JSON with max_temp and status."
        # ])
        
        # MOCK ANALYSIS for MVP
        analysis_result = {
            "max_temp_detected": 42.5,
            "anomaly_detected": True,
            "description": "Detected a localized hot spot in the upper right quadrant, potentially indicating a heater malfunction or ventilation blockage.",
            "timestamp": data["timeCreated"]
        }
        
        logging.info(f"AI Analysis Result: {analysis_result}")

        # 2. Store Analysis in Firestore
        # Extract sensor ID from filename convention (e.g., GH-001_2024-01-20.jpg)
        sensor_id = file_name.split('_')[0] 
        
        doc_ref = db.collection("greenhouses").document(sensor_id).collection("thermal_scans").document()
        doc_ref.set({
            "image_uri": f"gs://{bucket_name}/{file_name}",
            "analysis": analysis_result,
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        # 3. Update main greenhouse status if anomaly
        if analysis_result["anomaly_detected"]:
             db.collection("greenhouses").document(sensor_id).update({
                 "thermal_alert": True,
                 "last_thermal_check": firestore.SERVER_TIMESTAMP
             })

    except Exception as e:
        logging.error(f"Failed to process thermal image: {e}")
