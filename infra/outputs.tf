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

output "ecs_subnet_id" {
  value       = data.aws_subnet.public_a.id
  description = "Add this as ECS_SUBNET_ID secret in GitHub"
}

output "ecs_security_group_id" {
  value       = aws_security_group.ecs.id
  description = "Add this as ECS_SECURITY_GROUP_ID secret in GitHub"
}
