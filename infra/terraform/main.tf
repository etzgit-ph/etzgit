// Terraform placeholders - fill in provider and backend in real infra.
// This file provides a safe, configurable starting point:
// - optional AWS provider + example S3 bucket (guarded by `aws_enabled`)
// - commented example backend stanza for S3 remote state
// - lightweight `null_resource` fallback when AWS is not enabled

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
    null = {
      source  = "hashicorp/null"
      version = ">= 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }

  # If you want to use an S3 backend for remote state, uncomment and
  # configure the backend block below. Do NOT commit secrets/credentials.
  # backend "s3" {
  #   bucket         = var.state_bucket
  #   key            = "terraform.tfstate"
  #   region         = var.aws_region
  #   dynamodb_table = var.state_dynamodb_table
  #   encrypt        = true
  # }
}

// Global tags variable for cost/governance tracking
variable "tags" {
  type = map(string)
  default = {
    Project     = "ACA"
    Environment = "dev"
    ManagedBy   = "AutonomousAgent"
  }
}

// Toggle real AWS resources on/off. Default: disabled so `terraform plan` is safe.
variable "aws_enabled" {
  description = "When true, create example AWS resources (requires AWS provider credentials)."
  type        = bool
  default     = false
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "state_bucket" {
  type    = string
  default = ""
}

variable "state_dynamodb_table" {
  type    = string
  default = ""
}

// Optional image variable to simulate deployment input
variable "image" {
  type    = string
  default = ""
}

locals {
  // allow consumers to override/add tags; merge keeps defaults
  merged_tags = merge({
    Name = "aca-agent"
  }, var.tags)

  resource_name_prefix = "aca-${terraform.workspace}"
}

// AWS provider (declared always; resources are conditional)
provider "aws" {
  region = var.aws_region
}

// Example: create an S3 bucket only when aws_enabled = true. This is a
// minimal example showing how to gate cloud resources behind a flag so the
// repository remains safe for users without cloud credentials.
resource "aws_s3_bucket" "example" {
  count = var.aws_enabled ? 1 : 0

  # random_id is created only when aws_enabled is true so index [0] is safe here
  bucket = substr("${local.resource_name_prefix}-bucket-${random_id.suffix[0].hex}", 0, 63)
  acl    = "private"

  tags = local.merged_tags

  lifecycle_rule {
    enabled = true
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

// random_id used for stable-but-unique bucket names when enabled
resource "random_id" "suffix" {
  count = var.aws_enabled ? 1 : 0
  byte_length = 4
}

// Example null_resource fallback: keeps the repo self-contained and testable
resource "null_resource" "container_hosting" {
  # include image and a hash of tags so changes are detected
  triggers = {
    image = var.image != null ? var.image : ""
    tags  = jsonencode(local.merged_tags)
  }

  # metadata placeholder for tags - real provider resources should consume var.tags
  lifecycle {}
}

// Outputs that surface what was created or would be created
output "hosting_type" {
  value = var.aws_enabled ? "aws_s3_bucket" : "null_resource"
}

output "s3_bucket_id" {
  value       = var.aws_enabled ? aws_s3_bucket.example[0].id : null
  description = "The ID of the example S3 bucket when aws_enabled is true."
}

output "s3_bucket_arn" {
  value       = var.aws_enabled ? aws_s3_bucket.example[0].arn : null
  description = "The ARN of the example S3 bucket when aws_enabled is true."
}

output "container_hosting_null_id" {
  value       = null_resource.container_hosting.id
  description = "ID of the placeholder null_resource (always present)."
}

