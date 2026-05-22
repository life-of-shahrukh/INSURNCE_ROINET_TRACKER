variable "project"     { type = string }
variable "env"         { type = string }

variable "github_repo" {
  type        = string
  description = "GitHub repo in owner/repo format (e.g. life-of-shahrukh/INSURNCE_ROINET_TRACKER)"
}

variable "tf_state_bucket" {
  type        = string
  description = "Name of the S3 bucket used for Terraform remote state"
  default     = "roinet-crm-tf-state"
}

variable "tf_lock_table" {
  type        = string
  description = "Name of the DynamoDB table used for Terraform state locking"
  default     = "roinet-crm-tf-lock"
}
