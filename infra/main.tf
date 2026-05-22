terraform {
  required_version = ">= 1.7"

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

# ── Networking ────────────────────────────────────────────────────────────────
module "vpc" {
  source = "./modules/vpc"

  project               = var.project
  env                   = var.env
  vpc_cidr              = var.vpc_cidr
  availability_zones    = var.availability_zones
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs
}

# ── Container registries ──────────────────────────────────────────────────────
module "ecr" {
  source  = "./modules/ecr"
  project = var.project
}

# ── IAM roles ─────────────────────────────────────────────────────────────────
module "iam" {
  source      = "./modules/iam"
  project     = var.project
  env         = var.env
  github_repo = var.github_repo

  # Pass the state bucket/lock table names so the GitHub Actions role gets
  # S3 + DynamoDB permissions scoped to these exact resources
  tf_state_bucket = "roinet-crm-tf-state"
  tf_lock_table   = "roinet-crm-tf-lock"
}

# ── Database ──────────────────────────────────────────────────────────────────
module "rds" {
  source = "./modules/rds"

  project           = var.project
  env               = var.env
  subnet_ids        = module.vpc.database_subnet_ids
  security_group_id = module.vpc.rds_security_group_id
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
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.vpc.alb_security_group_id
  certificate_arn       = var.certificate_arn
}

# ── ECS Cluster + Services ────────────────────────────────────────────────────
module "ecs" {
  source = "./modules/ecs"

  project    = var.project
  env        = var.env
  aws_region = var.aws_region

  private_subnet_ids    = module.vpc.private_subnet_ids
  ecs_security_group_id = module.vpc.ecs_security_group_id

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
