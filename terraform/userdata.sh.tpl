#!/bin/bash
set -euo pipefail

dnf install -y docker
systemctl enable --now docker

# Authenticate Docker to ECR using the instance's IAM role
aws ecr get-login-password --region ${aws_region} | \
    docker login --username AWS --password-stdin ${ecr_url}

# Bridge network lets containers reach each other by name (e.g. redis://redis:6379)
docker network create outofoffice

# Redis Stack is required — plain Redis lacks the RediSearch module that LangGraph checkpointing depends on
docker run -d \
    --name redis \
    --network outofoffice \
    --restart unless-stopped \
    redis/redis-stack-server:latest

docker run -d \
    --name backend \
    --network outofoffice \
    --restart unless-stopped \
    -p 8000:8000 \
    -e SERPAPI_API_KEY="${serpapi_api_key}" \
    -e OPENAI_API_KEY="${openai_api_key}" \
    -e REDIS_URL="redis://redis:6379" \
    -e CORS_ORIGINS="${cors_origins}" \
    ${ecr_url}:${image_tag}
