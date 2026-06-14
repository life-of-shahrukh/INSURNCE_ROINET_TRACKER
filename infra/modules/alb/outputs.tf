output "alb_dns_name" {
  value       = aws_alb.main.dns_name
  description = "Public DNS name of the ALB"
}

output "alb_zone_id" {
  value       = aws_alb.main.zone_id
  description = "Hosted-zone ID of the ALB — required for Route 53 alias A records"
}

output "alb_arn" {
  value = aws_alb.main.arn
}

output "app_target_group_arn" {
  value = aws_alb_target_group.app.arn
}

output "server_target_group_arn" {
  value = aws_alb_target_group.server.arn
}

output "http_listener_arn" {
  value = aws_alb_listener.http.arn
}
