output "endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS connection endpoint (host:port)"
}

output "db_name" {
  value       = aws_db_instance.main.db_name
  description = "Database name"
}

output "address" {
  value       = aws_db_instance.main.address
  description = "RDS hostname"
}
