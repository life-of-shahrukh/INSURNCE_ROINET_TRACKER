resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.env}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.project}-${var.env}-db-subnet-group"
    Project     = var.project
    Environment = var.env
  }
}

resource "aws_db_parameter_group" "postgres" {
  name   = "${var.project}-${var.env}-postgres16"
  family = "postgres16"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  tags = {
    Name        = "${var.project}-${var.env}-pg-params"
    Project     = var.project
    Environment = var.env
  }
}

resource "aws_db_instance" "main" {
  identifier        = "${var.project}-${var.env}-postgres"
  engine            = "postgres"
  engine_version    = "16.6"
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  backup_retention_period   = var.backup_retention_days
  backup_window             = "03:00-04:00"
  maintenance_window        = "Mon:04:00-Mon:05:00"
  deletion_protection       = var.env == "prod"
  skip_final_snapshot       = var.env != "prod"
  final_snapshot_identifier = var.env == "prod" ? "${var.project}-${var.env}-final-snapshot" : null

  multi_az            = var.env == "prod"
  publicly_accessible = false
  apply_immediately   = var.env != "prod"

  tags = {
    Name        = "${var.project}-${var.env}-postgres"
    Project     = var.project
    Environment = var.env
  }
}
