# OutOfOffice

AI agent-powered platform for optimizing PTO and vacation planning. Provide your available days off, destination preferences, and remaining PTO; a multi-agent pipeline built on LangGraph finds and ranks the best trips.

## Features

- **PTO yield optimization**: finds trip windows that maximize total days off by bridging weekends and public holidays around your PTO days
- **Multi-agent pipeline**: LangGraph orchestrates planner, travel search, ranker, itinerary, and feedback agents with Redis-persisted state between steps
- **Flight search**: fetches real flight options with the SerpAPI and filters by a configurable budget
- **Smart ranking**: sort results by best yield, lowest cost, most time off, or fewest PTO days used
- **Iterative refinement**: submit feedback on results and the pipeline re-plans without losing conversation state
- **Company holiday awareness**: mark company holidays so they count as free days in the optimizer
- **Preferred month filtering**: constrain the search to specific months of the year

## Pictures

## Project Architecture

```text
Browser (React 19 + Vite + shadcn/ui)
    │
    └── HTTP ──────────────► backend :8000  (FastAPI)
                                 │
                           redis :6379
                     (LangGraph checkpoints)
```

| Service  | Port | What it does                                              |
|----------|------|-----------------------------------------------------------|
| backend  | 8000 | FastAPI — agent pipeline, trip planning API               |
| frontend | 5173 | React SPA — or S3+CloudFront in production                |
| redis    | 6379 | LangGraph checkpoint store (agent state between pipeline) |

On AWS it looks like this:

```text
  Browser ──── HTTPS ────► CloudFront
                                ├── /*      ──► S3 (static frontend build)
                                └── /api/*  ──► EC2 t3.small :8000 (HTTP internally)
                                                    ├── backend container  :8000
                                                    └── redis container    :6379  (Docker bridge only)

  ECR: outofoffice-backend
```

---

## Running locally with Docker Compose

You'll need Docker, a SerpAPI key, and an OpenAI API key.

```bash
cp .env.example .env   # fill in your credentials
docker compose up
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:8000 |

---

## Deploying to AWS

The backend runs as a Docker container on a single EC2 instance. The frontend is a static build served via S3+CloudFront. Budget roughly **$15–20/month** (t3.small + S3/CloudFront).

You'll need Terraform >= 1.9, AWS CLI >= 2, and Docker. Your AWS credentials need permission to create EC2, ECR, S3, CloudFront, and IAM resources.

```bash
aws configure               # key, secret, region
aws sts get-caller-identity # confirm it's working
```

### Step 0 — create a tfvars file

Instead of passing `-var` flags on every command, create `terraform/terraform.tfvars`:

```hcl
serpapi_api_key = "sk-..."
openai_api_key  = "sk-..."
```

`terraform.tfvars` is git-ignored. Once it exists you can drop the `-var` flags from every command below.

### Step 1 — push the backend image

```bash
cd terraform && terraform init

# Create the ECR repo first so we have somewhere to push
terraform apply -target=aws_ecr_repository.backend

TAG=$(git rev-parse --short HEAD)
ECR_URL=$(terraform output -raw ecr_backend_url)

aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin $ECR_URL

docker build -f ../backend/Dockerfile -t $ECR_URL:$TAG ../backend
docker push $ECR_URL:$TAG
```

### Step 2 — provision everything

```bash
terraform apply -var="image_tag=$TAG"
```

Terraform creates the VPC, EC2 instance, S3 bucket, and CloudFront distribution. The EC2 user data script pulls the backend image from ECR and starts Redis and the backend as Docker containers on boot.

### Step 3 — build and upload the frontend

The frontend calls the API via CloudFront (`/api/*`), so bake in the CloudFront URL — not the EC2 URL directly.

```bash
CF_URL=$(cd terraform && terraform output -raw cloudfront_url)
S3_BUCKET=$(cd terraform && terraform output -raw s3_bucket)

cd frontend
VITE_API_BASE_URL=$CF_URL npm run build

aws s3 sync dist/ s3://$S3_BUCKET --delete

# Invalidate CloudFront so users get the new build immediately
aws cloudfront create-invalidation \
  --distribution-id $(cd ../terraform && terraform output -raw cloudfront_url | cut -d/ -f3 | cut -d. -f1) \
  --paths "/*"
```

### Step 4 — access

| Surface  | How                                                           |
|----------|---------------------------------------------------------------|
| Frontend | `cloudfront_url` from Terraform output                        |
| API      | `cloudfront_url/api/*` routed to EC2 by CloudFront          |
| EC2 direct | `backend_url` from Terraform output (SSH/debugging only)    |

### Deploying an update

```bash
TAG=$(git rev-parse --short HEAD)
ECR_URL=$(cd terraform && terraform output -raw ecr_backend_url)

docker build -f backend/Dockerfile -t $ECR_URL:$TAG ./backend
docker push $ECR_URL:$TAG

# Re-apply to update the user data and replace the instance
cd terraform && terraform apply -var="image_tag=$TAG"
```

### Tearing down

```bash
cd terraform
aws s3 rm s3://$(terraform output -raw s3_bucket) --recursive
terraform destroy -var="image_tag=$TAG"
```

---

## Environment variables

| Variable            | Description                                                        |
|---------------------|--------------------------------------------------------------------|
| `SERPAPI_API_KEY`   | SerpAPI key used by the travel agent to search for trips           |
| `OPENAI_API_KEY`    | OpenAI key used by LangGraph agents (GPT-4o by default)            |
| `REDIS_URL`         | Redis connection string (e.g. `redis://redis:6379`)                |
| `CORS_ORIGINS`      | Comma-separated allowed origins for the CORS middleware            |
| `VITE_API_BASE_URL` | Backend URL for the frontend (defaults to `http://localhost:8000`) |
---

## Architecture Design Decisions

The primary goal of this deployment was to get practice with provisioning and deploying a full-stack application with Terraform on AWS. The application is not running live due to hosting costs, and architecture decisions were made to design the deployment in a way that balanced cost and functionality over production best practices.

**Redis for agent state** — Redis is used as the LangGraph checkpoint store rather than LangGraph's in-memory `MemorySaver`. `MemorySaver` is process-local and lost on every restart; Redis survives container restarts and allows the feedback agent to resume mid-conversation state without re-running the full pipeline.

**Single EC2 instance** — Redis and the backend run as Docker containers on one t3.small. They share a Docker bridge network (`outofoffice`) so Redis is never exposed to the internet.

**No NAT gateway** — the instance sits in a public subnet with a public IP, reaching ECR and AWS APIs directly.

**ECR lifecycle policy** — keeps the 3 most recent images so you can roll back once after a bad deploy without accumulating storage costs.

**S3 + CloudFront with OAC** — OAC is the current recommended way to give CloudFront read access to a private S3 bucket. The `custom_error_response` rules rewrite 403/404 to `index.html` so React Router handles deep links correctly.

**CloudFront `/api/*` routing** — rather than calling EC2 directly (which would be plain HTTP and blocked by browsers as mixed content), the frontend sends all API requests to CloudFront. An `ordered_cache_behavior` for `/api/*` proxies those requests to EC2 port 8000 over HTTP internally. CloudFront handles HTTPS end-to-end so the browser only ever sees a secure connection. Caching is disabled on this behavior so API responses are never served stale.

**Git SHA tags** — passing `image_tag=$(git rev-parse --short HEAD)` at apply time means every deploy maps to a real pullable image.
