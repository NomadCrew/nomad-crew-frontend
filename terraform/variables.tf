variable "aws_region" {
  description = "The AWS region to deploy resources to"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "supabase_url" {
  description = "Supabase URL"
  type        = string
}

variable "google_web_client_id" {
  description = "Google Web Client ID"
  type        = string
}

variable "google_places_api_key" {
  description = "Google Places API Key"
  type        = string
  sensitive   = true
}

variable "docker_image" {
  description = "The Docker image to deploy"
  type        = string
  default     = ""
} 