# Tests for vpc.tf
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

run "public_subnet_assigns_public_ips" {
  command = plan

  assert {
    condition     = aws_subnet.public.map_public_ip_on_launch == true
    error_message = "Public subnet must assign public IPs so the EC2 instance is reachable from the internet"
  }
}
