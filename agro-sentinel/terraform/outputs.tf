output "pubsub_topic" {
  value = google_pubsub_topic.sensor_topic.id
}

output "bq_table_id" {
  value = "${var.project_id}.${google_bigquery_dataset.dataset.dataset_id}.${google_bigquery_table.sensor_logs.table_id}"
}

output "bucket_name" {
  value = google_storage_bucket.thermal_images.name
}

output "function_uri" {
  value = google_cloudfunctions2_function.function.service_config[0].uri
}
