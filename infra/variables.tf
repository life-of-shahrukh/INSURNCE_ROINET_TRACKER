variable "project" {
  type        = string
  description = "Project short name used to prefix all AWS resources"
  default     = "roinet-crm"
}

variable "env" {
  type        = string
  description = "Deployment environment"
  default     = "prod"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "ap-south-1"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository in owner/repo format"
  default     = "life-of-shahrukh/INSURNCE_ROINET_TRACKER"
}

# ── Networking ────────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the new dedicated VPC"
  default     = "10.1.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "AZs to distribute subnets across (2 for HA)"
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "CIDRs for public subnets (ALB)"
  default     = ["10.1.1.0/24", "10.1.2.0/24"]
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "CIDRs for private subnets (ECS tasks)"
  default     = ["10.1.11.0/24", "10.1.12.0/24"]
}

variable "database_subnet_cidrs" {
  type        = list(string)
  description = "CIDRs for isolated database subnets (RDS)"
  default     = ["10.1.21.0/24", "10.1.22.0/24"]
}

# ── RDS ───────────────────────────────────────────────────────────────────────
variable "rds_instance_class" {
  type    = string
  default = "db.t3.micro"
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

# ── ECS ───────────────────────────────────────────────────────────────────────
variable "image_tag" {
  type        = string
  description = "Docker image tag to deploy"
  default     = "latest"
}

variable "app_cpu" {
  type    = number
  default = 256
}

variable "app_memory" {
  type    = number
  default = 512
}

variable "server_cpu" {
  type    = number
  default = 256
}

variable "server_memory" {
  type    = number
  default = 512
}

# ── ALB / TLS ─────────────────────────────────────────────────────────────────
variable "certificate_arn" {
  type        = string
  description = "ACM certificate ARN for HTTPS. Leave empty to skip TLS."
  default     = ""
}
