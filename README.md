# OutOfOffice

AI agent-powered platform for optimizing PTO and vacation planning. Provide your available days off, destination preferences, and remaining PTO; a multi-agent pipeline built on LangGraph finds and ranks the best trips.

> See [App Preview](#app-preview) at the bottom for a look at the app.

## Tech Stack

**Frontend**

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Backend**

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

**DevOps**

![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonwebservices&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![SonarQube](https://img.shields.io/badge/SonarQube-4E9BCD?style=for-the-badge&logo=sonarqube&logoColor=white)

## Features

- **PTO yield optimization**: finds trip windows that maximize total days off by bridging weekends and public holidays around your PTO days
- **Multi-agent pipeline**: LangGraph orchestrates planner, travel search, ranker, itinerary, and feedback agents with Redis-persisted state between steps
- **Flight search**: fetches real flight options with SerpAPI, filtered by a configurable budget
- **Smart ranking**: sort results by best yield, lowest cost, most time off, or fewest PTO days used
- **Iterative refinement**: submit feedback and the pipeline re-plans without losing conversation state
- **Company holiday awareness**: mark company holidays so they count as free days in the optimizer
- **Preferred month filtering**: constrain the search to specific months of the year

## Project Architecture

```text
Browser (React + Vite + shadcn/ui)
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

On AWS:

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

The backend runs as a Docker container on a single EC2 instance. The frontend is a static build served via S3+CloudFront.

```bash
aws configure               # key, secret, region
aws sts get-caller-identity # confirm it's working
```

### Step 0 — create a tfvars file

Create `terraform/terraform.tfvars` (git-ignored):

```hcl
serpapi_api_key = "sk-..."
openai_api_key  = "sk-..."
```

### Step 1 — push the backend image

```bash
cd terraform && terraform init

# Create the ECR repo first
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

Terraform creates the VPC, EC2 instance, S3 bucket, and CloudFront distribution. EC2 user data pulls the backend image from ECR and starts Redis and the backend as Docker containers on boot.

### Step 3 — build and upload the frontend

```bash
CF_URL=$(cd terraform && terraform output -raw cloudfront_url)
S3_BUCKET=$(cd terraform && terraform output -raw s3_bucket)

cd frontend
VITE_API_BASE_URL=$CF_URL npm run build

aws s3 sync dist/ s3://$S3_BUCKET --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $(cd ../terraform && terraform output -raw cloudfront_url | cut -d/ -f3 | cut -d. -f1) \
  --paths "/*"
```

### Step 4 — access

| Surface    | How                                                         |
|------------|-------------------------------------------------------------|
| Frontend   | `cloudfront_url` from Terraform output                      |
| API        | `cloudfront_url/api/*` routed to EC2 by CloudFront          |
| EC2 direct | `backend_url` from Terraform output (SSH/debugging only)    |

### Deploying an update

```bash
TAG=$(git rev-parse --short HEAD)
ECR_URL=$(cd terraform && terraform output -raw ecr_backend_url)

docker build -f backend/Dockerfile -t $ECR_URL:$TAG ./backend
docker push $ECR_URL:$TAG

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

This deployment was built to practice provisioning a full-stack app with Terraform on AWS. The app is not running live due to hosting costs; decisions favor cost and simplicity over production best practices.

- **Redis for agent state** — Redis persists LangGraph checkpoints across container restarts. `MemorySaver` is process-local and would lose conversation state on every restart; Redis lets the feedback agent resume mid-conversation without re-running the full pipeline.
- **Single EC2 instance** — Redis and the backend share one t3.small on a Docker bridge network (`outofoffice`), keeping Redis off the internet entirely.
- **No NAT gateway** — the instance sits in a public subnet and reaches ECR/AWS APIs directly, avoiding NAT gateway costs.
- **ECR lifecycle policy** — retains the 3 most recent images for one-step rollback without accumulating storage costs.
- **S3 + CloudFront with OAC** — OAC is the current recommended way to grant CloudFront read access to a private S3 bucket. Custom error rules rewrite 403/404 to `index.html` so React Router handles deep links.
- **CloudFront `/api/*` routing** — the frontend routes all API calls through CloudFront instead of directly to EC2, avoiding mixed-content blocks. The `/api/*` cache behavior proxies to EC2 port 8000 with caching disabled so responses are never served stale.

---

## App Preview

<p align="center">
  <img width="565" alt="Trip Form" src="https://github.com/user-attachments/assets/06edb6ff-42b4-48c5-951f-1bb50c206343" />
</p>

<p align="center">
  <img width="844" alt="Initial Results" src="https://github.com/user-attachments/assets/55454c15-b9aa-46d5-b90a-0c0db255e897" />
</p>

### Expanded Trip Details

<p align="center">
  <img width="900" alt="Expanded Itinerary" src="https://github.com/user-attachments/assets/627daa4e-dcb1-4fa8-80d8-79b98a164836" />
</p>

### Feedback and Refined Results

<p align="center">
  <img width="650" alt="Feedback Option" src="https://github.com/user-attachments/assets/92c52833-13d8-47e7-95cf-b5e915de6abf" />
</p>

<p align="center">
  <img width="650" alt="Feedback Results" src="https://github.com/user-attachments/assets/4c8345a4-daee-40b3-8962-3162fa4c6e80" />
</p>
