# Runs on every apply when image_tag or ecr_url changes
resource "null_resource" "push_backend_image" {
    triggers = {
        image_tag = var.image_tag
        ecr_url   = aws_ecr_repository.backend.repository_url
    }

    provisioner "local-exec" {
        command = <<-EOT
            aws ecr get-login-password --region ${var.aws_region} | \
                docker login --username AWS --password-stdin ${aws_ecr_repository.backend.repository_url}
            docker build --platform linux/amd64 \
                -t ${aws_ecr_repository.backend.repository_url}:${var.image_tag} \
                -f ${path.module}/../backend/Dockerfile \
                ${path.module}/../backend
            docker push ${aws_ecr_repository.backend.repository_url}:${var.image_tag}
        EOT
    }

    depends_on = [aws_ecr_repository.backend]
}

# Builds the frontend with the CloudFront URL baked in, syncs to S3, and invalidates the cache
resource "null_resource" "deploy_frontend" {
    triggers = {
        cloudfront_id = aws_cloudfront_distribution.frontend.id
        bucket        = aws_s3_bucket.frontend.bucket
    }

    provisioner "local-exec" {
        command = <<-EOT
            cd ${path.module}/../frontend
            npm ci
            VITE_API_BASE_URL=https://${aws_cloudfront_distribution.frontend.domain_name} npm run build
            aws s3 sync dist/ s3://${aws_s3_bucket.frontend.bucket} --delete
            aws cloudfront create-invalidation \
                --distribution-id ${aws_cloudfront_distribution.frontend.id} \
                --paths "/*"
        EOT
    }

    depends_on = [
        aws_instance.backend,
        aws_s3_bucket_policy.frontend,
    ]
}
