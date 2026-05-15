import functions_framework
import logging
import re
import os

if os.environ.get('USE_MOCK_GCP') == 'true':
    import mock_gcp as firestore
    import mock_gcp as storage
    class MockGenerativeModel:
        def __init__(self, model_name): pass
    model = MockGenerativeModel("gemini-pro-vision")
    db = firestore.Client()
    storage_client = storage.StorageClient()
else:
    try:
        from google.cloud import firestore
        from google.cloud import storage
        import vertexai
        try:
            from vertexai.generative_models import GenerativeModel          # type: ignore[import]
        except ImportError:
            from vertexai.preview.generative_models import GenerativeModel  # type: ignore[import]
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

# Allowlist of valid sensor ID patterns (VULN-09)
_SENSOR_ID_RE    = re.compile(r'^GH-[A-Z]{3}-\d{2}$')
KNOWN_SENSOR_IDS = frozenset({'GH-AMB-01', 'GH-DUR-01', 'GH-CAY-01', 'GH-ORO-01', 'GH-TEN-01'})

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png'}


def _extract_sensor_id(file_name: str) -> str | None:
    """
    Extract and validate sensor_id from filename convention: GH-XXX-NN_<date>.jpg
    Returns None if the extracted value doesn't match the known sensor pattern.
    """
    base = file_name.rsplit('/', 1)[-1]   # strip any path prefix
    segment = base.split('_')[0]          # take the first underscore-delimited segment
    if _SENSOR_ID_RE.match(segment) and segment in KNOWN_SENSOR_IDS:
        return segment
    logging.warning(f"Unrecognised sensor_id '{segment}' extracted from '{file_name}' — rejected")
    return None


@functions_framework.cloud_event
def process_thermal_image(cloud_event):
    """Triggered by a GCS object finalise event. Analyses thermal images for hot spots."""
    data        = cloud_event.data
    bucket_name = data["bucket"]
    file_name   = data["name"]

    logging.info(f"Processing thermal image: gs://{bucket_name}/{file_name}")

    # Only process image files
    ext = '.' + file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else ''
    if ext not in ALLOWED_EXTENSIONS:
        logging.info(f"Skipping non-image file: {file_name}")
        return

    # Validate sensor_id before any Firestore write (VULN-09)
    sensor_id = _extract_sensor_id(file_name)
    if sensor_id is None:
        logging.error(f"Cannot process image: invalid sensor_id in filename '{file_name}'")
        return

    try:
        # MOCK ANALYSIS — replace with real Gemini Vision call when deploying
        analysis_result = {
            "max_temp_detected": 42.5,
            "anomaly_detected":  True,
            "description": (
                "Detected a localised hot spot in the upper-right quadrant, "
                "potentially indicating a heater malfunction or ventilation blockage."
            ),
            "timestamp": data.get("timeCreated"),
        }

        logging.info(f"AI analysis result for {sensor_id}: {analysis_result}")

        # Write thermal scan sub-document
        (db.collection("greenhouses")
           .document(sensor_id)
           .collection("thermal_scans")
           .document()
           .set({
               "image_uri": f"gs://{bucket_name}/{file_name}",
               "analysis":  analysis_result,
               "created_at": firestore.SERVER_TIMESTAMP,
           }))

        # Update parent greenhouse document if anomaly found
        if analysis_result["anomaly_detected"]:
            (db.collection("greenhouses")
               .document(sensor_id)
               .update({
                   "thermal_alert":      True,
                   "last_thermal_check": firestore.SERVER_TIMESTAMP,
               }))

    except Exception as e:
        logging.error(f"Failed to process thermal image '{file_name}': {e}")
