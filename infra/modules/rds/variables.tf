variable "project" { type = string }
variable "env"     { type = string }

variable "subnet_ids" {
  type        = list(string)
  description = "Database subnet IDs"
}

variable "security_group_id" {
  type        = string
  description = "Security group ID for RDS"
}

variable "instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "allocated_storage" {
  type    = number
  default = 20
}

variable "db_name" {
  type    = string
  default = "roinet"
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "backup_retention_days" {
  type    = number
  default = 7
}
