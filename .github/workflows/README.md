# CrimeLens CI/CD Pipeline

## Workflow Overview

| Workflow | Trigger | Jobs | Deploy Target |
|----------|---------|------|---------------|
| backend.yml | push to main/develop; scoped PR; manual | test → build → deploy | Railway |
| ai-service.yml | push to main/develop; scoped PR; manual | pytest + lint → deploy | HF Spaces |
| frontend.yml | push to main/develop; scoped PR; manual | lint → build → deploy | Vercel |
| smoke-test.yml | completed deployment; manual | deployment barrier → 16 smoke tests | Production |

All three workflows run on every main/develop push. This ensures a main commit has
three matching deployment runs, so the smoke-test barrier can wait for all of them.
Pull requests to main or develop use service path filters and never deploy.
Manual service runs deploy only on main and smoke-test that service's completion
against the whole existing production system. A manual smoke run tests immediately.

Deployments are serialized per service/branch. Unit tests exclude integration
classes, which run separately with Testcontainers (Docker required).
ESLint and Ruff remain advisory while existing lint debt is addressed; test,
build, deployment and health-check failures block success.

Backend images are published to Docker Hub for traceability; Railway deploys the
same commit's backend source using its Dockerfile rather than pulling that image.
Frontend artifacts are uploaded for inspection; Vercel builds again with the
production VITE_API_URL and VITE_WS_URL secrets supplied to the build step.

## Deployment Flow

```
main branch push
       │
       ├──── backend/**  ──→ Unit Tests → Integration Tests → Maven build → Docker push → Railway deploy → Health check
       │
       ├──── ai-service/** ──→ pytest → ruff lint → HF Spaces push → /health poll
       │
       └──── frontend/** ──→ ESLint → Vite build → Vercel deploy → HTTP 200 check
                                                          │
                                                          └──→ smoke-test.yml triggers
                                                                   │
                                                               16 smoke tests
                                                               against production
```

## Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

### Backend (Railway)
| Secret | Value |
|--------|-------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `RAILWAY_TOKEN` | Railway API token |
| `RAILWAY_BACKEND_SERVICE` | Railway service ID |
| `RAILWAY_PROJECT_ID` | Railway project ID |
| `DB_URL` | JDBC PostgreSQL URL: `jdbc:postgresql://host:port/database` |
| `DB_USERNAME` | Production DB username |
| `DB_PASSWORD` | Production DB password |
| `REDIS_HOST` | Production Redis host |
| `REDIS_PORT` | Production Redis port |
| `KAFKA_BOOTSTRAP_SERVERS` | Reachable Kafka bootstrap servers |
| `AI_SERVICE_URL` | Runtime `https://owner-space.hf.space` URL |
| `ELASTICSEARCH_URI` | Production ES URI |
| `JWT_SECRET` | Min 32-char secret key |
| `TWITTER_BEARER_TOKEN` | Twitter API v2 bearer token |
| `FRONTEND_URL` | Vercel production URL |

### AI Service (Hugging Face)
| Secret | Value |
|--------|-------|
| `HF_TOKEN` | Hugging Face write token |
| `HF_SPACE_NAME` | e.g. `yourusername/crimelens-ai` |

### Frontend (Vercel)
| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel org/team ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `VITE_API_URL` | HTTPS backend origin without `/api` suffix |
| `VITE_WS_URL` | HTTPS SockJS endpoint, ending in `/ws` |

### Smoke Tests
| Secret | Value |
|--------|-------|
| `PROD_BACKEND_URL` | `https://crimelens-backend.railway.app` |
| `PROD_FRONTEND_URL` | `https://crimelens.vercel.app` |
| `PROD_AI_SERVICE_URL` | `https://yourname-crimelens-ai.hf.space` |
| `PROD_ADMIN_PASSWORD` | Sets Railway ADMIN_PASSWORD and authenticates smoke tests |

## Setup Guide

### Step 1 — Railway (Backend)
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Choose `backend/` as the service root; use `/backend/railway.json` as the config path.
   The CLI workflow uploads backend as archive root with `--path-as-root`.
   Disable independent GitHub auto-deploys so tests gate every production release.
3. Settings → Generate Domain
4. Account → Tokens → Create token
5. Add to GitHub Secrets: `RAILWAY_TOKEN`, `RAILWAY_PROJECT_ID`, `RAILWAY_BACKEND_SERVICE`

### Step 2 — Hugging Face Spaces (AI Service)
1. Go to [huggingface.co](https://huggingface.co) → New Space
2. Name: `crimelens-ai`, SDK: Docker, Hardware: CPU Basic (free tier)
3. Profile → Settings → Access Tokens → New token (write scope)
4. Add to GitHub Secrets: `HF_TOKEN`, `HF_SPACE_NAME`

### Step 3 — Vercel (Frontend)
1. Go to [vercel.com](https://vercel.com) → New Project → Import `crimelens` repo
2. Root Directory: `frontend`, Framework: Vite
3. Environment Variables: `VITE_API_URL`, `VITE_WS_URL`
4. Settings → General → copy Project ID and Org ID
5. Account → Tokens → Create token
6. Add to GitHub Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### Step 4 — Production Infrastructure
- **PostgreSQL**: Railway → PostgreSQL → convert the connection URL to JDBC format for DB_URL
- **Redis**: Railway → New Service → Redis → copy host/port
- **Kafka**: Provision a Kafka cluster reachable from Railway. Set any required
  authentication/TLS properties directly in the Railway service environment.

## Branch Strategy

| Branch | CI | Deploy |
|--------|----|--------|
| `main` | ✓ full CI | ✓ auto-deploys to production |
| `develop` | ✓ tests only | ✗ no deploy |
| `feature/*` | service CI on PR to main/develop | no deploy |

## Activation and Validation

Tests run immediately after upload. Deployment and production smoke jobs require
the repository Actions variable `DEPLOY_ENABLED` to equal `true`. Leave it unset
until the provider accounts, cloud infrastructure, and all production secrets
below are configured. Enabling it authorizes the configured main-branch workflows
to publish and deploy. Never put account tokens or production passwords in Git.

Initialize or use the CrimeLens GitHub repository, commit these files, and configure
the secrets above.
Create the production, production-ai and production-frontend GitHub environments;
configure protection rules as needed. The workflows are source files until pushed
to GitHub; local validation does not activate remote deployments.

Use the Docker SDK for the HF Space; ai-service/README.md has its SDK and port metadata.
Use the runtime .hf.space URL for both AI_SERVICE_URL and PROD_AI_SERVICE_URL.
The health poll fails on timeout. Unreachable AI services fail smoke tests.
The smoke suite checks real frontend JS/CSS, health, threat feeds, stats, scanner,
admin JWT login, Swagger, metrics, AI scan/classify, SockJS, CORS and rate limits.
The rate-limit test sends 12 scan requests from the runner IP and runs last.
Smoke tests may create scan history; they do not modify admin data or subscriptions.

For a full local backend check run `mvn verify` in backend with Docker running.
Run `pytest tests/ --timeout=120` in ai-service using Python 3.11 and requirements.txt
plus pytest-timeout. Run `npm ci && npm run build` in frontend.
Validate workflow expressions with actionlint. JUnit artifacts are retained for seven days.

## Emergency Procedures

**Skip tests for hotfix:**
Actions → Backend CI/CD → Run workflow → Check "Skip tests"

**Roll back backend:**
Railway dashboard → backend service → Deployments → click previous → Redeploy

**Roll back frontend:**
Vercel dashboard → crimelens → Deployments → previous deployment → Promote to Production
