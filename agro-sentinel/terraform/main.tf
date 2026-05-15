terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.51.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ── Pub/Sub ───────────────────────────────────────────────────────────────────
resource "google_pubsub_topic" "sensor_topic" {
  name = "sensors"
}

resource "google_pubsub_subscription" "sensor_subscription" {
  name  = "sensors-sub"
  topic = google_pubsub_topic.sensor_topic.name

  # VULN-18 fix: do not retain acknowledged messages — sensor data is written to
  # BigQuery immediately; retaining it in Pub/Sub only widens the blast radius.
  retain_acked_messages      = false
  message_retention_duration = "3600s"   # 1-hour window for replay if needed
}

# ── BigQuery ──────────────────────────────────────────────────────────────────
resource "google_bigquery_dataset" "dataset" {
  dataset_id    = "agro_sentinel_data"
  friendly_name = "Agro Sentinel Data"
  description   = "Historical sensor data from greenhouses"
  location      = var.region
}

resource "google_bigquery_table" "sensor_logs" {
  dataset_id = google_bigquery_dataset.dataset.dataset_id
  table_id   = "sensor_logs"

  time_partitioning {
    type  = "DAY"
    field = "timestamp"
  }

  schema = <<EOF
[
  { "name": "sensor_id",     "type": "STRING",    "mode": "REQUIRED" },
  { "name": "timestamp",     "type": "TIMESTAMP", "mode": "REQUIRED" },
  { "name": "temperature",   "type": "FLOAT",     "mode": "NULLABLE" },
  { "name": "humidity",      "type": "FLOAT",     "mode": "NULLABLE" },
  { "name": "soil_moisture", "type": "FLOAT",     "mode": "NULLABLE" },
  { "name": "co2_ppm",       "type": "FLOAT",     "mode": "NULLABLE" },
  { "name": "par_umol",      "type": "FLOAT",     "mode": "NULLABLE" },
  { "name": "soil_ec",       "type": "FLOAT",     "mode": "NULLABLE" },
  { "name": "vpd_kpa",       "type": "FLOAT",     "mode": "NULLABLE" },
  { "name": "dew_point_c",   "type": "FLOAT",     "mode": "NULLABLE" },
  { "name": "soil_temp_c",   "type": "FLOAT",     "mode": "NULLABLE" },
  { "name": "battery_level", "type": "INTEGER",   "mode": "NULLABLE" },
  { "name": "rssi_dbm",      "type": "INTEGER",   "mode": "NULLABLE" }
]
EOF
}

# ── Cloud Storage — thermal images (user-uploaded content) ────────────────────
resource "google_storage_bucket" "thermal_images" {
  name          = "${var.project_id}-thermal-images"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition { age = 30 }
    action    { type = "Delete" }
  }
}

# ── Cloud Storage — function source (VULN-14: separate from user uploads) ─────
resource "google_storage_bucket" "function_source" {
  name                        = "${var.project_id}-function-source"
  location                    = var.region
  force_destroy               = false
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
}

# ── Firestore ─────────────────────────────────────────────────────────────────
resource "google_app_engine_application" "app" {
  project       = var.project_id
  location_id   = var.region
  database_type = "CLOUD_FIRESTORE"
}

# ── Function source ZIP ───────────────────────────────────────────────────────
data "archive_file" "source_zip" {
  type        = "zip"
  source_dir  = "../cloud"
  output_path = "/tmp/function-source.zip"
  excludes    = ["*.pyc", "__pycache__", "venv", ".venv", "test_local.py", "mock_gcp.py"]
}

resource "google_storage_bucket_object" "zip" {
  name   = "source-${data.archive_file.source_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_source.name   # VULN-14: dedicated bucket
  source = data.archive_file.source_zip.output_path
}

# ── Cloud Function — process-sensor-data (Pub/Sub triggered) ─────────────────
resource "google_cloudfunctions2_function" "function" {
  name        = "process-sensor-data"
  location    = var.region
  description = "Processes sensor data from Pub/Sub"

  build_config {
    runtime     = "python311"
    entry_point = "process_sensor_data"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.zip.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    available_memory   = "256M"
    timeout_seconds    = 60
    environment_variables = {
      PROJECT_ID = var.project_id
      BQ_TABLE   = "${var.project_id}.${google_bigquery_dataset.dataset.dataset_id}.${google_bigquery_table.sensor_logs.table_id}"
      # HMAC_SECRET — inject at deploy time from Secret Manager, never hardcode here:
      # terraform apply -var="hmac_secret=$(gcloud secrets versions access latest --secret=agro-hmac-secret)"
    }
    secret_environment_variables {
      key        = "HMAC_SECRET"
      project_id = var.project_id
      secret     = "agro-hmac-secret"
      version    = "latest"
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.sensor_topic.id
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}

# ── Cloud Function — process-thermal-image (GCS triggered) ───────────────────
resource "google_cloudfunctions2_function" "thermal_function" {
  name        = "process-thermal-image"
  location    = var.region
  description = "AI Analysis of Thermal Images triggered by GCS"

  build_config {
    runtime     = "python311"
    entry_point = "process_thermal_image"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.zip.name
      }
    }
  }

  service_config {
    max_instance_count = 5
    available_memory   = "1024M"
    timeout_seconds    = 120
    environment_variables = {
      PROJECT_ID = var.project_id
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.storage.object.v1.finalized"
    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.thermal_images.name
    }
    retry_policy = "RETRY_POLICY_RETRY"
  }
}

# ── Cloud Function — ask-ai (HTTP, VULN-03/06) ───────────────────────────────
# The function is reachable without GCP IAM credentials (allUsers) so browsers
# can call it. Authentication is enforced at the application layer: the function
# verifies a Firebase ID token on every request (REQUIRE_AUTH=true).
resource "google_cloudfunctions2_function" "ai_function" {
  name        = "ask-ai"
  location    = var.region
  description = "HTTP API for AI Natural Language Queries — requires Firebase ID token"

  build_config {
    runtime     = "python311"
    entry_point = "ask_ai"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.zip.name
      }
    }
  }

  service_config {
    max_instance_count = 5
    available_memory   = "512M"
    timeout_seconds    = 60
    environment_variables = {
      PROJECT_ID     = var.project_id
      ALLOWED_ORIGIN = var.allowed_origin   # VULN-06: strict CORS, no wildcard
      REQUIRE_AUTH   = "true"               # VULN-03: app-level Firebase token check
    }
  }
}

# Allow browsers to reach the ask-ai function (IAM level).
# Authentication is enforced inside the function via Firebase token verification.
resource "google_cloud_run_service_iam_member" "ask_ai_invoker" {
  location = var.region
  project  = var.project_id
  service  = google_cloudfunctions2_function.ai_function.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "ai_function_uri" {
  value = google_cloudfunctions2_function.ai_function.service_config[0].uri
}
