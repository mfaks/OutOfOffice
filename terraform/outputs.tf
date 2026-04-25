# Outputs are used to export the values of the resources created by Terraform

output "backend_url" {
    description = "Direct EC2 backend URL (for SSH/debugging only since it's not behind CloudFront)"
    value       = "http://${aws_instance.backend.public_dns}:8000"
}

output "cloudfront_url" {
    description = "Frontend URL (CloudFront is the CDN)"
    value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "ecr_backend_url" {
    description = "ECR repository URL to tag and push images before applying"
    value       = aws_ecr_repository.backend.repository_url
}

output "s3_bucket" {
    description = "Frontend S3 bucket; aws s3 sync frontend/dist/ s3://<bucket>"
    value       = aws_s3_bucket.frontend.bucket
}
