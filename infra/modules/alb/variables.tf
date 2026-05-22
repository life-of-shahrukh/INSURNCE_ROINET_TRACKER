variable "project" { type = string }
variable "env" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "alb_security_group_id" { type = string }

variable "certificate_arn" {
  type        = string
  description = "ACM certificate ARN. Leave empty to use HTTP only."
  default     = ""
}
