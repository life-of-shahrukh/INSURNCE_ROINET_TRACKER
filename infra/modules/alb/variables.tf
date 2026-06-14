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

variable "api_domain" {
  type        = string
  description = "Fully-qualified API subdomain, e.g. api.insuranceroinet.xyz. Used for host-header routing to the server target group."
  default     = ""
}
