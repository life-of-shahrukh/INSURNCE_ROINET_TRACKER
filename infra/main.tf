terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }

  backend "s3" {
    bucket         = "roinet-crm-tf-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "roinet-crm-tf-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.env
      ManagedBy   = "terraform"
    }
  }
}

# ── Reuse existing default VPC — RDS is already provisioned here ─────────────
data "aws_vpc" "main" {
  id = var.vpc_id
}

# Public subnets of the default VPC (ap-south-1a/1b/1c)
data "aws_subnet" "public_a" { id = "subnet-03e2ee4177d04fe4c" }
data "aws_subnet" "public_b" { id = "subnet-0b1a690ff88c9c277" }
data "aws_subnet" "public_c" { id = "subnet-0e92bd16cd26f25e5" }

locals {
  public_subnet_ids = [
    data.aws_subnet.public_a.id,
    data.aws_subnet.public_b.id,
    data.aws_subnet.public_c.id,
  ]
  # Default VPC has no private subnets — use public for ECS (Fargate assigns ENIs)
  private_subnet_ids = [
    data.aws_subnet.public_a.id,
    data.aws_subnet.public_b.id,
    data.aws_subnet.public_c.id,
  ]
}

# Security groups scoped to this project
resource "aws_security_group" "alb" {
  name        = "${var.project}-${var.env}-alb-sg"
  description = "Allow HTTP/HTTPS from internet to ALB"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-${var.env}-alb-sg" }
}

resource "aws_security_group" "ecs" {
  name        = "${var.project}-${var.env}-ecs-sg"
  description = "Allow traffic from ALB to ECS tasks"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-${var.env}-ecs-sg" }
}

resource "aws_security_group" "rds" {
  name        = "${var.project}-${var.env}-rds-sg"
  description = "Allow PostgreSQL from ECS only"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project}-${var.env}-rds-sg" }
}

# ── Container registries ──────────────────────────────────────────────────────
module "ecr" {
  source  = "./modules/ecr"
  project = var.project
}

# ── IAM roles ─────────────────────────────────────────────────────────────────
module "iam" {
  source          = "./modules/iam"
  project         = var.project
  env             = var.env
  github_repo     = var.github_repo
  tf_state_bucket = "roinet-crm-tf-state"
  tf_lock_table   = "roinet-crm-tf-lock"
}

# ── Database ──────────────────────────────────────────────────────────────────
module "rds" {
  source = "./modules/rds"

  project           = var.project
  env               = var.env
  subnet_ids        = local.private_subnet_ids
  security_group_id = aws_security_group.rds.id
  instance_class    = var.rds_instance_class
  db_name           = var.db_name
  db_username       = var.db_username
  db_password       = var.db_password
}

# ── Load balancer ─────────────────────────────────────────────────────────────
module "alb" {
  source = "./modules/alb"

  project               = var.project
  env                   = var.env
  vpc_id                = data.aws_vpc.main.id
  public_subnet_ids     = local.public_subnet_ids
  alb_security_group_id = aws_security_group.alb.id
  certificate_arn       = var.certificate_arn
}

# ── ECS Cluster + Services ────────────────────────────────────────────────────
module "ecs" {
  source = "./modules/ecs"

  project    = var.project
  env        = var.env
  aws_region = var.aws_region

  private_subnet_ids    = local.private_subnet_ids
  ecs_security_group_id = aws_security_group.ecs.id

  app_target_group_arn    = module.alb.app_target_group_arn
  server_target_group_arn = module.alb.server_target_group_arn
  alb_listener_arn        = module.alb.http_listener_arn

  execution_role_arn = module.iam.ecs_execution_role_arn
  task_role_arn      = module.iam.ecs_task_role_arn

  app_image    = module.ecr.app_repository_url
  server_image = module.ecr.server_repository_url
  image_tag    = var.image_tag

  api_url      = "http://${module.alb.alb_dns_name}/api"
  database_url = "postgresql://${var.db_username}:${var.db_password}@${module.rds.address}:5432/${var.db_name}"

  app_cpu    = var.app_cpu
  app_memory = var.app_memory

  server_cpu    = var.server_cpu
  server_memory = var.server_memory
}
