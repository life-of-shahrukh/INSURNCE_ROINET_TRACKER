output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "Dedicated VPC ID for the Roinet CRM project"
}

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
