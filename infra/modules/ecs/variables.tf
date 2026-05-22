variable "project"               { type = string }
variable "env"                   { type = string }
variable "aws_region"            { type = string }

variable "private_subnet_ids"    { type = list(string) }
variable "ecs_security_group_id" { type = string }

variable "app_target_group_arn"    { type = string }
variable "server_target_group_arn" { type = string }
variable "alb_listener_arn"        { type = string }

variable "execution_role_arn" { type = string }
variable "task_role_arn"      { type = string }

variable "app_image"    { type = string }
variable "server_image" { type = string }

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "api_url" {
  type        = string
  description = "Public URL of the API (used as NEXT_PUBLIC_API_URL)"
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "app_cpu"    { type = number; default = 256 }
variable "app_memory" { type = number; default = 512 }

variable "server_cpu"    { type = number; default = 256 }
variable "server_memory" { type = number; default = 512 }

variable "app_desired_count"    { type = number; default = 1 }
variable "server_desired_count" { type = number; default = 1 }
