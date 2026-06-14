output "zone_id" {
  value       = aws_route53_zone.main.zone_id
  description = "Route 53 hosted zone ID — used by alias A records in main.tf"
}

output "name_servers" {
  value       = aws_route53_zone.main.name_servers
  description = "The 4 nameservers to enter in GoDaddy (replace existing NS records)"
}

output "certificate_arn" {
  value       = aws_acm_certificate_validation.main.certificate_arn
  description = "Validated ACM certificate ARN — passed to the ALB HTTPS listener"
}
