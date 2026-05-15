variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region (e.g., us-central1)"
  type        = string
  default     = "us-central1"
}

variable "allowed_origin" {
  description = "Exact origin allowed to call the ask-ai Cloud Function (e.g. https://agro.cognitexindustrial.com)"
  type        = string
}
