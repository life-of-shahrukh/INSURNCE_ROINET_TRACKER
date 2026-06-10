output "endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS SQL Server endpoint (host:1433)"
}

output "address" {
  value       = aws_db_instance.main.address
  description = "RDS SQL Server hostname"
}
