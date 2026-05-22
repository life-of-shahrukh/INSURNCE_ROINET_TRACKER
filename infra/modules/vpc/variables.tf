variable "project" {
  type        = string
  description = "Project name used as a prefix for all resources"
}

variable "env" {
  type        = string
  description = "Deployment environment (prod, staging)"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of AZs to distribute subnets across"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for public subnets (one per AZ)"
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for private subnets (one per AZ)"
}

variable "database_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for database subnets (one per AZ)"
}
