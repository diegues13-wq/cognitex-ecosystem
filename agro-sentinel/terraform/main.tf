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

# ----------------------------------------------------------------------------------------------------------------------
# PUBSUB
# ----------------------------------------------------------------------------------------------------------------------
resource "google_pubsub_topic" "sensor_topic" {
  name = "sensors"
}

resource "google_pubsub_subscription" "sensor_subscription" {
  name  = "sensors-sub"
  topic = google_pubsub_topic.sensor_topic.name

  # Retain acknowledged messages for 7 days
  retain_acked_messages = true
  message_retention_duration = "604800s"
}

# ----------------------------------------------------------------------------------------------------------------------
# BIGQUERY
# ----------------------------------------------------------------------------------------------------------------------
resource "google_bigquery_dataset" "dataset" {
  dataset_id                  = "agro_sentinel_data"
  friendly_name               = "Agro Sentinel Data"
  description                 = "Historical sensor data from greenhouses"
  location                    = var.region
}

resource "google_bigquery_table" "sensor_logs" {
  dataset_id = google_bigquery_dataset.dataset.dataset_id
  table_id   = "sensor_logs"

  time_partitioning {
    type = "DAY"
    field = "timestamp"
  }

  schema = <<EOF
[
  {
    "name": "sensor_id",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "timestamp",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "temperature",
    "type": "FLOAT",
    "mode": "NULLABLE"
  },
  {
    "name": "humidity",
    "type": "FLOAT",
    "mode": "NULLABLE"
  },
  {
    "name": "soil_moisture",
    "type": "FLOAT",
    "mode": "NULLABLE"
  },
  {
    "name": "co2_ppm",
    "type": "FLOAT",
    "mode": "NULLABLE"
  },
  {
    "name": "par_umol",
    "type": "FLOAT",
    "mode": "NULLABLE"
  },
  {
    "name": "soil_ec",
    "type": "FLOAT",
    "mode": "NULLABLE"
  },
  {
    "name": "vpd_kpa",
    "type": "FLOAT",
    "mode": "NULLABLE"
  },
  {
    "name": "dew_point_c",
    "type": "FLOAT",
    "mode": "NULLABLE"
  }
]
EOF
}

# ----------------------------------------------------------------------------------------------------------------------
# CLOUD STORAGE (Images)
# ----------------------------------------------------------------------------------------------------------------------
resource "google_storage_bucket" "thermal_images" {
  name          = "${var.project_id}-thermal-images"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

# ----------------------------------------------------------------------------------------------------------------------
# FIRESTORE (Native Mode)
# ----------------------------------------------------------------------------------------------------------------------
# Note: Firestore provision usually requires App Engine creation first in some older configs, 
# but new provider versions support google_firestore_database.
# We will assume the project has Firestore enabled or use the App Engine resource if needed.
# For simplicity in this Terraform plan, we will create the App Engine application which enables Firestore.

resource "google_app_engine_application" "app" {
  project     = var.project_id
  location_id = var.region
  database_type = "CLOUD_FIRESTORE"
}

# ----------------------------------------------------------------------------------------------------------------------
# CLOUD FUNCTION (V2)
# ----------------------------------------------------------------------------------------------------------------------
# Start by zipping the source code
data "archive_file" "source_zip" {
  type        = "zip"
  source_dir  = "../cloud"
  output_path = "/tmp/function-source.zip"
  excludes    = ["*.pyc", "__pycache__", "venv", "test_local.py", "mock_gcp.py"]
}

resource "google_storage_bucket_object" "zip" {
  name   = "source-${data.archive_file.source_zip.output_md5}.zip"
  bucket = google_storage_bucket.thermal_images.name # Reusing bucket for source (or create a dedicated one)
  source = data.archive_file.source_zip.output_path
}

resource "google_cloudfunctions2_function" "function" {
  name        = "process-sensor-data"
  location    = var.region
  description = "Processes sensor data from Pub/Sub"

  build_config {
    runtime     = "python311"
    entry_point = "process_sensor_data" # Defined in main.py
    source {
      storage_source {
        bucket = google_storage_bucket.thermal_images.name
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
        BQ_TABLE = "${var.project_id}.${google_bigquery_dataset.dataset.dataset_id}.${google_bigquery_table.sensor_logs.table_id}"
    }
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.sensor_topic.id
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}

# ----------------------------------------------------------------------------------------------------------------------
# CLOUD FUNCTION - THERMAL AI
# ----------------------------------------------------------------------------------------------------------------------
resource "google_cloudfunctions2_function" "thermal_function" {
  name        = "process-thermal-image"
  location    = var.region
  description = "AI Analysis of Thermal Images triggered by GCS"

  build_config {
    runtime     = "python311"
    entry_point = "process_thermal_image" # Defined in thermal.py
    source {
      storage_source {
        bucket = google_storage_bucket.thermal_images.name
        object = google_storage_bucket_object.zip.name
      }
    }
  }

  service_config {
    max_instance_count = 5
    available_memory   = "1024M" # More memory for AI client
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
    retry_policy   = "RETRY_POLICY_RETRY"
  }
}

# ----------------------------------------------------------------------------------------------------------------------
# CLOUD FUNCTION - ASK AI (HTTP)
# ----------------------------------------------------------------------------------------------------------------------
resource "google_cloudfunctions2_function" "ai_function" {
  name        = "ask-ai"
  location    = var.region
  description = "HTTP API for AI Natural Language Queries"

  build_config {
    runtime     = "python311"
    entry_point = "ask_ai" # Defined in ai_assistant.py
    source {
      storage_source {
        bucket = google_storage_bucket.thermal_images.name
        object = google_storage_bucket_object.zip.name
      }
    }
  }

  service_config {
    max_instance_count = 5
    available_memory   = "512M"
    timeout_seconds    = 60
    environment_variables = {
        PROJECT_ID = var.project_id
    }
  }
}

output "ai_function_uri" {
  value = google_cloudfunctions2_function.ai_function.service_config[0].uri
}
