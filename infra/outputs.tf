output "alb_dns_name" {
  value       = module.alb.alb_dns_name
  description = "Public DNS name — point your domain CNAME here"
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
  description = "RDS PostgreSQL endpoint"
  sensitive   = true
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "github_actions_role_arn" {
  value       = module.iam.github_actions_role_arn
  description = "Add this as AWS_ROLE_TO_ASSUME secret in GitHub"
}
