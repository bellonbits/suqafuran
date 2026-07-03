# 🐳 Docker Quick Start Guide

## Installation

### macOS
```bash
# Method 1: Using Homebrew
brew install --cask docker

# Method 2: Download Docker Desktop
# Visit: https://www.docker.com/products/docker-desktop
# Download for Mac (Intel or Apple Silicon)
# Install and launch
```

### Windows
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Run installer
3. Restart your computer
4. Docker will start automatically

### Linux (Ubuntu/Debian)
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Add current user to docker group (avoid sudo)
sudo usermod -aG docker $USER

# Verify
docker --version
```

## Verify Installation

```bash
docker --version
docker-compose --version
# Should show version numbers
```

## 🚀 Quick Start (5 minutes)

### 1. Navigate to Project Directory
```bash
cd /Users/mac/suqafuran
```

### 2. Start All Services
```bash
# Using the helper script (easiest)
./docker.sh start

# OR using docker-compose directly
docker-compose up -d
```

### 3. Wait for Health Checks
```bash
# Check status (wait for "healthy" status)
./docker.sh status
# or
docker-compose ps
```

### 4. Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Redis CLI:** `./docker.sh shell redis`
- **PostgreSQL:** `./docker.sh shell postgres`

## Common Tasks

### View Logs
```bash
# All services
./docker.sh logs

# Specific service
./docker.sh logs backend
./docker.sh logs frontend
./docker.sh logs postgres
./docker.sh logs redis
```

### Access Containers
```bash
# Backend shell
./docker.sh shell backend

# Frontend shell
./docker.sh shell frontend

# PostgreSQL
./docker.sh shell postgres

# Redis
./docker.sh shell redis
```

### Stop Services
```bash
./docker.sh stop
```

### Restart Services
```bash
./docker.sh restart
```

### Clean Everything
```bash
./docker.sh clean
```

## Default Credentials

| Service | Host | Port | User | Password |
|---------|------|------|------|----------|
| Frontend | localhost | 3000 | - | - |
| Backend API | localhost | 8000 | - | - |
| PostgreSQL | postgres | 5432 | doadmin | AVNS_n3l_adWBnU_ieYWiXYS |
| Redis | redis | 6379 | - | suqaredis |

## Troubleshooting

### Port Already in Use
```bash
# Kill process using port
lsof -i :3000  # Frontend
# or
lsof -i :8000  # Backend
# Then: kill -9 <PID>

# Or change port in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
./docker.sh logs <service_name>

# Rebuild
./docker.sh build

# Restart
./docker.sh restart
```

### Connection Refused
```bash
# Make sure all services are healthy
./docker.sh status

# Wait 30 seconds for health checks to pass
# Then restart
./docker.sh restart
```

## Docker Commands (Direct)

```bash
# See all running containers
docker ps

# View container logs
docker logs suqafuran-backend -f

# Execute command in container
docker exec suqafuran-backend python -m pytest

# Stop all containers
docker-compose down

# Remove all data (WARNING: Deletes database)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# View resource usage
docker stats
```

## File Structure

```
suqafuran/
├── docker-compose.yml          # Service orchestration
├── Dockerfile.backend          # Backend container image
├── Dockerfile.frontend         # Frontend container image
├── .dockerignore               # Files to ignore in images
├── .env.docker                 # Example environment file
├── docker.sh                   # Helper script
├── DOCKER_SETUP.md            # Complete Docker guide
├── DOCKER_QUICK_START.md      # This file
│
├── backend/                    # FastAPI app
│   ├── app/
│   └── requirements.txt
│
└── new-frontend/               # Next.js app
    ├── src/
    └── package.json
```

## What's Running Inside Docker

| Container | Image | Purpose |
|-----------|-------|---------|
| suqafuran-postgres | postgres:16-alpine | Database (5432) |
| suqafuran-redis | redis:7-alpine | Cache & OTP (6379) |
| suqafuran-backend | Custom | FastAPI API (8000) |
| suqafuran-frontend | Custom | Next.js App (3000) |
| suqafuran-celery | Custom | Background tasks |

## Testing the Setup

### 1. Sign Up
```bash
# Open http://localhost:3000
# Click "Sign Up"
# Enter email, name, password
# Get OTP from Redis:
docker-compose exec redis redis-cli -a suqaredis KEYS "otp:*"
# Verify OTP and complete signup
```

### 2. Login
```bash
# Use credentials from signup
# Should auto-load profile from /users/me
```

### 3. View Logs
```bash
# Watch real-time logs
./docker.sh logs

# Errors appear here
```

## Production Notes

For production deployment:

1. Update `.env` with production values
2. Set `ENVIRONMENT=production`
3. Use strong passwords for database & Redis
4. Set proper `CORS_ORIGINS`
5. Configure SSL/TLS certificates
6. Use environment secrets, not .env files
7. Set up backup strategy for volumes
8. Monitor container resource usage
9. Configure logging aggregation
10. Set up health check monitoring

## Next Steps

✅ Install Docker  
✅ Run `./docker.sh start`  
✅ Open http://localhost:3000  
✅ Test signup/login flow  
✅ Check logs with `./docker.sh logs`  

For detailed information, see [DOCKER_SETUP.md](DOCKER_SETUP.md)

Need help? Run: `./docker.sh help`
