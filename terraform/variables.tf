# Variables are used to pass values to the Terraform configuration

variable "aws_region" {
    type        = string
    description = "AWS region to deploy into"
    default     = "us-east-1"
}

variable "project_name" {
    type        = string
    description = "Project name used as a prefix on all resource names"
    default     = "outofoffice"
}

variable "instance_type" {
    type        = string
    description = "EC2 instance type for the backend"
    default     = "t3.small"
}

variable "image_tag" {
    type        = string
    description = "Docker image tag to deploy (use git SHA for rollback safety)"
    default     = "latest"
}

variable "serpapi_api_key" {
    type        = string
    description = "SerpAPI key consumed by the backend agent pipeline"
    sensitive   = true
}

variable "openai_api_key" {
    type        = string
    description = "OpenAI API key consumed by the backend agent pipeline"
    sensitive   = true
}

variable "monitoring_cidr" {
    type        = string
    description = "CIDR allowed to SSH into the EC2 instance. Defaults to the public IP of the machine running terraform apply. Override in terraform.tfvars if needed."
    default     = null

    validation {
        condition     = var.monitoring_cidr == null || var.monitoring_cidr != "0.0.0.0/0"
        error_message = "monitoring_cidr must not be 0.0.0.0/0 — SSH should never be open to the entire internet."
    }
}
