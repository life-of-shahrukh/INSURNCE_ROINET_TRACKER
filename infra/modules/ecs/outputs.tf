output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  value = aws_ecs_cluster.main.arn
}

output "app_service_name" {
  value = aws_ecs_service.app.name
}

output "server_service_name" {
  value = aws_ecs_service.server.name
}

output "app_task_definition_arn" {
  value = aws_ecs_task_definition.app.arn
}

output "server_task_definition_arn" {
  value = aws_ecs_task_definition.server.arn
}
