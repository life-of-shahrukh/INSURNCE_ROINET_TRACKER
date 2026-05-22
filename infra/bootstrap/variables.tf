variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "state_bucket_name" {
  type    = string
  default = "roinet-crm-tf-state"
}

variable "lock_table_name" {
  type    = string
  default = "roinet-crm-tf-lock"
}
