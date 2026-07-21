variable "project" {
  type    = string
  default = "studentvoice"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "primary_location" {
  type    = string
  default = "Central India"
}

variable "dr_location" {
  type    = string
  default = "South India"
}

variable "web_image" {
  type        = string
  description = "Immutable ACR image reference for the web container"
}

variable "api_image" {
  type        = string
  description = "Immutable ACR image reference for the API container"
}

variable "worker_image" {
  type        = string
  description = "Immutable ACR image reference for the worker container"
}

variable "entra_admin_object_id" {
  type        = string
  description = "Object id for the Entra PostgreSQL administrator"
}

variable "entra_admin_name" {
  type        = string
  description = "Display/login name for the Entra PostgreSQL administrator"
}

variable "alert_email" {
  type        = string
  description = "Operational security alert destination"
}
