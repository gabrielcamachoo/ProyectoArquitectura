variable "region" {
  type    = string
  default = "us-east-1"
}

variable "db_user" {
  type    = string
  default = "postgres"
}

variable "db_password" {
  type      = string
  sensitive = true
}
