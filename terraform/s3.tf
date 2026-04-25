# Account ID suffix guarantees a globally unique bucket name
resource "aws_s3_bucket" "frontend" {
    bucket        = "${var.project_name}-frontend-${data.aws_caller_identity.current.account_id}"
    force_destroy = true
    tags          = { Name = "${var.project_name}-frontend" }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
    bucket                  = aws_s3_bucket.frontend.id
    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true
}

# Use OAC to grant CloudFront read access to a private S3 bucket
resource "aws_cloudfront_origin_access_control" "frontend" {
    name                              = "${var.project_name}-frontend-oac"
    origin_access_control_origin_type = "s3"
    signing_behavior                  = "always"
    signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
    enabled             = true
    default_root_object = "index.html"
    wait_for_deployment = false

    origin {
        domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
        origin_id                = "s3-frontend"
        origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    }

    # CloudFront connects to EC2 over HTTP internally; the browser only ever sees HTTPS
    origin {
        domain_name = aws_instance.backend.public_dns
        origin_id   = "ec2-backend"

        custom_origin_config {
            http_port              = 8000
            https_port             = 443
            origin_protocol_policy = "http-only"
            origin_ssl_protocols   = ["TLSv1.2"]
            origin_read_timeout    = 60
        }
    }

    # API requests are routed to EC2; evaluated before the default S3 behavior
    ordered_cache_behavior {
        path_pattern           = "/api/*"
        allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
        cached_methods         = ["GET", "HEAD"]
        target_origin_id       = "ec2-backend"
        viewer_protocol_policy = "https-only"
        compress               = false

        cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
        origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AllViewerExceptHostHeader
    }

    default_cache_behavior {
        allowed_methods        = ["GET", "HEAD"]
        cached_methods         = ["GET", "HEAD"]
        target_origin_id       = "s3-frontend"
        viewer_protocol_policy = "redirect-to-https"

        forwarded_values {
            query_string = false
            cookies { forward = "none" }
        }

        min_ttl     = 0
        default_ttl = 3600
        max_ttl     = 86400
    }

    # S3 returns 403/404 for missing files; rewrite to index.html so React Router handles the route
    custom_error_response {
        error_code         = 403
        response_code      = 200
        response_page_path = "/index.html"
    }

    custom_error_response {
        error_code         = 404
        response_code      = 200
        response_page_path = "/index.html"
    }

    restrictions {
        geo_restriction { restriction_type = "none" }
    }

    viewer_certificate {
        cloudfront_default_certificate = true
    }

    tags = { Name = "${var.project_name}-frontend-cdn" }
}

data "aws_iam_policy_document" "frontend_s3" {
    statement {
        effect    = "Allow"
        actions   = ["s3:GetObject"]
        resources = ["${aws_s3_bucket.frontend.arn}/*"]

        principals {
            type        = "Service"
            identifiers = ["cloudfront.amazonaws.com"]
        }

        condition {
            test     = "StringEquals"
            variable = "AWS:SourceArn"
            values   = [aws_cloudfront_distribution.frontend.arn]
        }
    }
}

resource "aws_s3_bucket_policy" "frontend" {
    bucket = aws_s3_bucket.frontend.id
    policy = data.aws_iam_policy_document.frontend_s3.json
}
