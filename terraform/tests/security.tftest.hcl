# Tests for iam.tf and ecr.tf
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

run "ecr_scanning_enabled" {
  command = plan

  assert {
    condition     = aws_ecr_repository.backend.image_scanning_configuration[0].scan_on_push == true
    error_message = "ECR backend repo must have scan_on_push enabled to catch known CVEs on every build without extra tooling"
  }
}

run "ec2_role_uses_correct_principal" {
  command = plan

  assert {
    condition     = can(jsondecode(aws_iam_role.backend_ec2.assume_role_policy).Statement[0].Principal.Service == "ec2.amazonaws.com")
    error_message = "Backend EC2 role must only be assumable by ec2.amazonaws.com"
  }
}

run "cloudfront_oac_always_signs" {
  command = plan

  assert {
    condition     = aws_cloudfront_origin_access_control.frontend.signing_behavior == "always"
    error_message = "OAC signing_behavior must be 'always' because unsigned requests to S3 are rejected and would break the frontend"
  }
}
