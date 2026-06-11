variable "project" { type = string }
variable "env" { type = string }

variable "subnet_ids" {
  type        = list(string)
  description = "Subnet IDs for the DB subnet group. Must include at least one subnet with an internet-gateway route when publicly_accessible = true."
}

variable "security_group_id" {
  type        = string
  description = "Security group ID for the RDS instance"
}

variable "instance_class" {
  type        = string
  default     = "db.t3.small" # db.t3.micro is NOT supported for SQL Server on RDS
  description = "RDS instance class. Minimum for SQL Server is db.t3.small."
}

variable "allocated_storage" {
  type    = number
  default = 20
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}
