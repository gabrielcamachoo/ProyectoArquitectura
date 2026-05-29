terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

resource "aws_ecs_cluster" "main" {
  name = "adaptive-learning-cluster"
}

resource "aws_db_instance" "postgres" {
  identifier             = "adaptive-learning-postgres"
  engine                 = "postgres"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  username               = var.db_user
  password               = var.db_password
  skip_final_snapshot    = true
  publicly_accessible    = false
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "adaptive-learning-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
}
