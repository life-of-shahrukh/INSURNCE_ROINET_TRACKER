terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }

  backend "s3" {
    bucket         = "roinet-crm-tf-state-702527818159"
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

# ── VPC ───────────────────────────────────────────────────────────────────────
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
  source          = "./modules/iam"
  project         = var.project
  env             = var.env
  github_repo     = var.github_repo
  tf_state_bucket = "roinet-crm-tf-state-702527818159"
  tf_lock_table   = "roinet-crm-tf-lock"
}

# ── Database (SQL Server Express, publicly accessible) ────────────────────────
# The RDS instance is placed in the public subnets so that publicly_accessible
# = true can assign it a public DNS name.  Access is still guarded by the RDS
# security group — only port 1433 is opened.  No db_name is set at the RDS
# level; Prisma creates the "roinet_crm" database on first migrate deploy.
module "rds" {
  source = "./modules/rds"

  project           = var.project
  env               = var.env
  subnet_ids        = module.vpc.public_subnet_ids # public subnets required for publicly_accessible
  security_group_id = module.vpc.rds_security_group_id
  instance_class    = var.rds_instance_class
  db_username       = var.db_username
  db_password       = var.db_password
}

# ── DNS: Route 53 hosted zone + ACM certificate ───────────────────────────────
# Must come BEFORE module.alb so the validated certificate ARN is available.
# Alias A records (apex + api + www) are defined below after the ALB exists,
# which avoids a circular dependency between this module and module.alb.
module "dns" {
  source      = "./modules/dns"
  domain_name = var.domain_name
}

# ── Load balancer ─────────────────────────────────────────────────────────────
module "alb" {
  source = "./modules/alb"

  project               = var.project
  env                   = var.env
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.vpc.alb_security_group_id
  certificate_arn       = module.dns.certificate_arn   # one-way dep: dns → alb
  api_domain            = "api.${var.domain_name}"
}

# ── Route 53 alias A records → ALB ────────────────────────────────────────────
# Defined here (not inside module.dns) to avoid a circular dependency:
#   module.dns produces certificate_arn → consumed by module.alb
#   module.alb produces alb_dns_name/alb_zone_id → consumed by these records
# Both modules are complete by the time Terraform evaluates these resources.

resource "aws_route53_record" "apex" {
  zone_id = module.dns.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api" {
  zone_id = module.dns.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "www" {
  zone_id = module.dns.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = true
  }
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

  api_url      = "https://api.${var.domain_name}"
  frontend_url = "https://${var.domain_name}"

  # SQL Server connection string — Prisma will create the roinet_crm database
  # on the first `prisma migrate deploy` run inside the server container.
  database_url = "sqlserver://${module.rds.address}:1433;database=roinet_crm;user=${var.db_username};password=${var.db_password};encrypt=true;trustServerCertificate=true"

  jwt_secret = var.jwt_secret

  # SSO — ARNs point to Secrets Manager; ECS injects values at startup
  sso_api_key_secret_arn         = var.sso_api_key_secret_arn
  sso_rsa_private_key_secret_arn = var.sso_rsa_private_key_secret_arn
  sso_rsa_public_key_secret_arn  = var.sso_rsa_public_key_secret_arn
  sso_token_expiry_seconds       = var.sso_token_expiry_seconds
  sso_redirect_base_url          = var.sso_redirect_base_url

  app_cpu    = var.app_cpu
  app_memory = var.app_memory

  server_cpu    = var.server_cpu
  server_memory = var.server_memory
}
