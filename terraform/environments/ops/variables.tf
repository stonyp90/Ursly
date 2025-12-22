# =============================================================================
# URSLY-OPS Account Variables
# =============================================================================

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ursly"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# =============================================================================
# Account IDs
# =============================================================================

variable "ops_account_id" {
  description = "AWS Account ID for URSLY-OPS"
  type        = string
}

variable "dev_account_id" {
  description = "AWS Account ID for URSLY-DEV"
  type        = string
}

variable "prod_account_id" {
  description = "AWS Account ID for URSLY-PROD"
  type        = string
}

# =============================================================================
# GitHub Configuration
# =============================================================================

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "ursly"
}

