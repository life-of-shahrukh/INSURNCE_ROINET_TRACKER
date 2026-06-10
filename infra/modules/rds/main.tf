resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.env}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.project}-${var.env}-db-subnet-group"
    Project     = var.project
    Environment = var.env
  }
}

resource "aws_db_instance" "main" {
  identifier        = "${var.project}-${var.env}-mssql"
  engine            = "sqlserver-ex"
  engine_version    = "15.00.4153.1.v1" # SQL Server 2019 Express
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  license_model     = "license-included"

  # SQL Server RDS uses username/password — no db_name at instance level.
  # The target database is specified in the Prisma connection string (database=roinet_crm).
  username = var.db_username
  password = var.db_password
  port     = 1433

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]

  # SQL Server Express does not support automated backups or Multi-AZ.
  backup_retention_period = 0
  multi_az                = false

  maintenance_window = "Mon:04:00-Mon:05:00"

  deletion_protection       = false
  skip_final_snapshot       = true
  final_snapshot_identifier = null

  # Publicly accessible so the DB can be reached from outside the VPC
  # (e.g. local dev tools, DBeaver, SSMS).  Access is still guarded by the
  # security group — only port 1433 is open.
  publicly_accessible = true

  apply_immediately = var.env != "prod"

  tags = {
    Name        = "${var.project}-${var.env}-mssql"
    Project     = var.project
    Environment = var.env
  }
}
