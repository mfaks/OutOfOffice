# Tests for s3.tf
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

run "s3_public_access_fully_blocked" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.frontend.block_public_acls == true
    error_message = "S3 public ACLs must be blocked so objects are only reachable via CloudFront"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.frontend.restrict_public_buckets == true
    error_message = "S3 public bucket policy must be restricted to prevent accidental public exposure of build artifacts"
  }
}

run "cloudfront_serves_spa_root" {
  command = plan

  assert {
    condition     = aws_cloudfront_distribution.frontend.default_root_object == "index.html"
    error_message = "CloudFront must serve index.html at the root so the React SPA loads on the bare domain"
  }
}

run "cloudfront_spa_error_rewrites" {
  command = plan

  # S3 returns 403 (not 404) for missing objects in private buckets.
  # Both codes need rewriting to index.html so React Router handles deep links.
  assert {
    condition = anytrue([
      for r in aws_cloudfront_distribution.frontend.custom_error_response :
      r.error_code == 403 && r.response_code == 200 && r.response_page_path == "/index.html"
    ])
    error_message = "CloudFront must rewrite 403 to index.html because S3 returns 403 for missing objects in private buckets"
  }

  assert {
    condition = anytrue([
      for r in aws_cloudfront_distribution.frontend.custom_error_response :
      r.error_code == 404 && r.response_code == 200 && r.response_page_path == "/index.html"
    ])
    error_message = "CloudFront must rewrite 404 to index.html so React Router deep links work"
  }
}
