terraform {
    required_version = ">= 1.9"

    required_providers {
        aws = {
            source  = "hashicorp/aws"
            version = "~> 5.0"
        }
        http = {
            source  = "hashicorp/http"
            version = "~> 3.0"
        }
    }
}

provider "aws" {
    region = var.aws_region
}

data "aws_availability_zones" "available" {
    state = "available"
}

data "aws_caller_identity" "current" {}

# Used to auto-detect the caller's public IP for the SSH security group rule
data "http" "my_ip" {
    url = "https://checkip.amazonaws.com"
}
