# Suqafuran Docker Setup Guide

This guide will help you run the entire Suqafuran application using Docker containers.

## Prerequisites

### Install Docker & Docker Compose

**macOS:**
```bash
# Using Homebrew
brew install --cask docker
# Or download Docker Desktop from https://www.docker.com/products/docker-desktop
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
```

**Windows:**
- Download Docker Desktop from https://www.docker.com/products/docker-desktop
- Install and restart your system

Verify installation:
```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Prepare Environment Variables

```bash
# Copy the Docker env file
cp .env.docker .env

# (Optional) Edit .env if you want to customize settings
nano .env
```

### 2. Build and Start Services

```bash
# Build all images and start containers
docker-compose up -d

# Or rebuild from scratch (if you made code changes)
docker-compose up -d --build
```

### 3. Verify Services

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs backend
docker-compose logs frontend
```

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Redis:** localhost:6379
- **PostgreSQL:** localhost:5432

## Common Commands

### Start Services
```bash
# Start in background
docker-compose up -d

# Start with logs displayed
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: Deletes data)
docker-compose down -v

# Stop specific service
docker-compose stop frontend
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100
```

### Execute Commands in Container
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Run Python commands
docker-compose exec backend python -c "print('Hello')"

# Database shell
docker-compose exec postgres psql -U doadmin -d defaultdb
```

### Database Operations
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U doadmin -d defaultdb

# Create backup
docker-compose exec postgres pg_dump -U doadmin defaultdb > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U doadmin defaultdb < backup.sql
```

### Redis Operations
```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli -a suqaredis

# Check OTP codes
docker-compose exec redis redis-cli -a suqaredis KEYS "otp:*"

# Clear all data
docker-compose exec redis redis-cli -a suqaredis FLUSHALL
```

## Architecture

```
suqafuran/
├── docker-compose.yml       # Service orchestration
├── Dockerfile.backend       # Backend image
├── Dockerfile.frontend      # Frontend image
├── .env.docker             # Docker environment variables
│
├── backend/                 # FastAPI application
│   ├── app/                # Application code
│   ├── requirements.txt     # Python dependencies
│   └── uploads/            # User uploads (mounted volume)
│
└── new-frontend/           # Next.js application
    ├── src/                # React components
    ├── public/             # Static assets
    └── package.json        # Node dependencies
```

## Services

### PostgreSQL (postgres:16-alpine)
- **Container Name:** suqafuran-postgres
- **Port:** 5432
- **Default User:** doadmin
- **Default Password:** AVNS_n3l_adWBnU_ieYWiXYS
- **Database:** defaultdb
- **Volume:** postgres_data

### Redis (redis:7-alpine)
- **Container Name:** suqafuran-redis
- **Port:** 6379
- **Password:** suqaredis
- **Volume:** redis_data

### Backend (FastAPI)
- **Container Name:** suqafuran-backend
- **Port:** 8000
- **Depends on:** PostgreSQL, Redis
- **Volume:** ./backend:/app

### Frontend (Next.js)
- **Container Name:** suqafuran-frontend
- **Port:** 3000
- **Depends on:** Backend
- **Volume:** ./new-frontend:/app

### Celery Worker (Optional)
- **Container Name:** suqafuran-celery
- **For:** Background tasks (email, notifications)
- **Depends on:** Redis, PostgreSQL

## Health Checks

Each service includes health checks:
```bash
# View health status
docker-compose ps

# Health check logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs backend
docker-compose logs frontend
```

## Troubleshooting

### Port Already in Use
```bash
# Check which process is using the port
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :6379  # Redis
lsof -i :5432  # PostgreSQL

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
# ports:
#   - "3001:3000"  # Changed from 3000:3000
```

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Rebuild image
docker-compose build --no-cache backend

# Remove and restart
docker-compose down
docker-compose up -d
```

### Connection Refused
```bash
# Make sure services are healthy
docker-compose ps

# Wait for services to be ready (health checks)
docker-compose logs postgres
docker-compose logs redis

# Restart dependent services
docker-compose restart backend frontend
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose exec postgres pg_isready

# Verify environment variables
docker-compose exec backend env | grep POSTGRES

# Test connection
docker-compose exec backend python -c "
import psycopg2
conn = psycopg2.connect('dbname=defaultdb user=doadmin password=AVNS_n3l_adWBnU_ieYWiXYS host=postgres')
print('Connected!')
"
```

### Redis Connection Issues
```bash
# Check Redis is running
docker-compose exec redis redis-cli -a suqaredis ping

# Verify environment variables
docker-compose exec backend env | grep REDIS
```

## Development Workflow

### Hot Reload
The containers mount the source directories as volumes:
- Backend code changes reload automatically via Uvicorn
- Frontend code changes reload automatically via Next.js

### Making Code Changes
```bash
# Edit code as usual
nano backend/app/main.py
# or
nano new-frontend/src/components/Header.tsx

# Changes reload automatically in running containers
# Check logs to confirm
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Running Tests
```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests
docker-compose exec frontend npm test
```

### Installing Dependencies
```bash
# Backend: add to requirements.txt then rebuild
docker-compose exec backend pip install <package>
# Or rebuild container
docker-compose build --no-cache backend

# Frontend: add to package.json then rebuild
docker-compose exec frontend npm install <package>
# Or rebuild container
docker-compose build --no-cache frontend
```

## Production Deployment

### Build Images
```bash
# Build production images
docker-compose -f docker-compose.yml build

# Tag images for registry
docker tag suqafuran-backend:latest your-registry/suqafuran-backend:v1.0.0
docker tag suqafuran-frontend:latest your-registry/suqafuran-frontend:v1.0.0

# Push to registry
docker push your-registry/suqafuran-backend:v1.0.0
docker push your-registry/suqafuran-frontend:v1.0.0
```

### Environment for Production
```bash
# Update .env for production
ENVIRONMENT=production
CORS_ORIGINS=https://suqafuran.com,https://www.suqafuran.com,https://api.suqafuran.com
POSTGRES_PASSWORD=<strong-random-password>
REDIS_PASSWORD=<strong-random-password>
SECRET_KEY=<strong-random-key>
```

## Useful Docker Commands

```bash
# Remove unused resources
docker system prune

# Remove specific image
docker rmi suqafuran-backend:latest

# View resource usage
docker stats

# Inspect service
docker-compose exec backend python -c "import sys; print(sys.version)"

# Scale services (for load balancing)
docker-compose up -d --scale celery-worker=3

# View network
docker network ls
docker network inspect suqafuran_suqafuran-network
```

## Next Steps

1. ✅ Start services: `docker-compose up -d`
2. ✅ Wait for health checks to pass: `docker-compose ps`
3. ✅ Open http://localhost:3000 in your browser
4. ✅ Sign up and test the application
5. ✅ Check logs if issues: `docker-compose logs -f`

For more help, run:
```bash
docker-compose --help
docker ps --help
```
