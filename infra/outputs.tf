output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "Dedicated VPC ID for the Roinet CRM project"
}

output "alb_dns_name" {
  value       = module.alb.alb_dns_name
  description = "Raw ALB DNS name (alias records in Route 53 point here automatically)"
}

# ── Domain outputs ─────────────────────────────────────────────────────────────
output "route53_name_servers" {
  value       = module.dns.name_servers
  description = "Paste these 4 nameservers into GoDaddy > DNS > Nameservers > Custom"
}

output "frontend_url" {
  value       = "https://${var.domain_name}"
  description = "Public URL of the Next.js frontend"
}

output "api_url" {
  value       = "https://api.${var.domain_name}"
  description = "Public URL of the NestJS API"
}

output "acm_certificate_arn" {
  value       = module.dns.certificate_arn
  description = "ARN of the validated ACM TLS certificate"
}

output "app_ecr_url" {
  value       = module.ecr.app_repository_url
  description = "ECR URL for the Next.js app image"
}

output "server_ecr_url" {
  value       = module.ecr.server_repository_url
  description = "ECR URL for the NestJS server image"
}

output "rds_endpoint" {
  value       = module.rds.endpoint
  description = "RDS SQL Server endpoint — connect with host:1433, username/password"
  sensitive   = true
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "github_actions_role_arn" {
  value       = module.iam.github_actions_role_arn
  description = "Add this as AWS_ROLE_TO_ASSUME secret in GitHub"
}

output "ecs_subnet_id" {
  value       = module.vpc.private_subnet_ids[0]
  description = "Add this as ECS_SUBNET_ID secret in GitHub"
}

output "ecs_security_group_id" {
  value       = module.vpc.ecs_security_group_id
  description = "Add this as ECS_SECURITY_GROUP_ID secret in GitHub"
}
