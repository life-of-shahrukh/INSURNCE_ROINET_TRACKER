output "app_repository_url" {
  value       = aws_ecr_repository.app.repository_url
  description = "ECR URL for the Next.js app image"
}

output "server_repository_url" {
  value       = aws_ecr_repository.server.repository_url
  description = "ECR URL for the NestJS server image"
}

output "app_repository_name" {
  value = aws_ecr_repository.app.name
}

output "server_repository_name" {
  value = aws_ecr_repository.server.name
}
