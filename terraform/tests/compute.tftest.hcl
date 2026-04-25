# Tests for ec2.tf
# All tests use command=plan so no AWS resources are created.

mock_provider "http" {
  mock_data "http" {
    defaults = { response_body = "203.0.113.1\n" }
  }
}

mock_provider "aws" {
  mock_data "aws_availability_zones" {
    defaults = { names = ["us-east-1a", "us-east-1b"] }
  }
  mock_data "aws_caller_identity" {
    defaults = { account_id = "123456789012" }
  }
  mock_data "aws_ami" {
    defaults = { id = "ami-0abcdef1234567890" }
  }
}

variables {
  serpapi_api_key = "test-serpapi-key"
  openai_api_key  = "test-openai-key"
}

run "backend_sg_exposes_api_port" {
  command = plan

  assert {
    condition = anytrue([
      for rule in aws_security_group.backend.ingress :
      rule.from_port == 8000 && rule.to_port == 8000
    ])
    error_message = "Backend security group must allow inbound traffic on port 8000"
  }
}
