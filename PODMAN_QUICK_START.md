# 🐳 Podman Quick Start Guide

Podman is a daemon-less, secure container engine that's a drop-in replacement for Docker.

## ✅ Podman is Already Installed!

```bash
podman --version
# podman version 5.8.2

podman-compose --version
# podman-compose version 1.5.0
```

## 🚀 Quick Start (5 minutes)

### 1. Navigate to Project Directory
```bash
cd /Users/mac/suqafuran
```

### 2. Start All Services
```bash
# Using the Podman helper script
./podman.sh start

# OR using podman-compose directly
podman-compose up -d
```

### 3. Wait for Services
```bash
# Check status
./podman.sh status
# Wait for all services to show "healthy"
```

### 4. Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## Common Commands

### View Status & Logs
```bash
# Service status
./podman.sh status

# View logs
./podman.sh logs           # All services
./podman.sh logs backend   # Specific service
./podman.sh logs frontend
./podman.sh logs postgres
./podman.sh logs redis

# Follow logs in real-time
podman-compose logs -f backend
```

### Access Containers
```bash
# Backend shell
./podman.sh shell backend

# Frontend shell
./podman.sh shell frontend

# PostgreSQL shell
./podman.sh shell postgres

# Redis CLI
./podman.sh shell redis
# Then in Redis: redis-cli -a suqaredis
```

### Manage Services
```bash
# Stop services
./podman.sh stop

# Restart services
./podman.sh restart

# Rebuild images
./podman.sh build

# Pull base images
./podman.sh pull

# View running containers
./podman.sh ps

# View resource usage
./podman.sh stats

# View images
./podman.sh images

# Clean everything
./podman.sh clean
```

## Podman vs Docker

| Feature | Podman | Docker |
|---------|--------|--------|
| Daemon | ❌ None (daemonless) | ✅ Required |
| Security | ✅ Rootless by default | ⚠️ Requires root |
| API | ✅ Docker-compatible | ✅ Docker API |
| Compose | ✅ podman-compose | ✅ docker-compose |
| Performance | ✅ Slightly faster | ✓ Good |
| Windows | ⚠️ WSL required | ✅ Native |

## Podman Advantages

✅ **No daemon** - Lower resource usage, instant startup  
✅ **Rootless** - Better security out of the box  
✅ **Docker compatible** - Use existing docker-compose files  
✅ **Pod support** - Group containers like Kubernetes  
✅ **Open source** - Red Hat backed  

## Podman-Specific Commands

```bash
# Check Podman version
podman --version

# List all containers (running and stopped)
podman ps -a

# List images
podman images

# Remove image
podman rmi image_name

# Run single container
podman run -it alpine sh

# View container details
podman inspect container_name

# View system info
podman system info

# Prune unused resources
podman system prune

# Check Podman socket (if needed)
podman unshare id
```

## Using podman-compose

```bash
# Start services
podman-compose up -d

# Stop services
podman-compose down

# View logs
podman-compose logs -f

# Rebuild images
podman-compose build --no-cache

# Execute command in container
podman-compose exec backend sh

# Scale service
podman-compose up -d --scale celery-worker=2
```

## Environment Setup

```bash
# Copy environment file
cp .env.docker .env

# Edit if needed
nano .env

# Verify
cat .env | grep "^[^#]"  # Show non-comment lines
```

## Default Credentials

| Service | Host | Port | User | Password |
|---------|------|------|------|----------|
| Frontend | localhost | 3000 | - | - |
| Backend | localhost | 8000 | - | - |
| PostgreSQL | postgres | 5432 | doadmin | AVNS_n3l_adWBnU_ieYWiXYS |
| Redis | redis | 6379 | - | suqaredis |

## Testing the Setup

### 1. Check All Services
```bash
./podman.sh status
# Should show 5 containers: postgres, redis, backend, frontend, celery-worker
```

### 2. Test Backend API
```bash
curl http://localhost:8000/docs
# Should return Swagger UI HTML
```

### 3. Test Frontend
```bash
curl http://localhost:3000 | head -20
# Should return Next.js HTML
```

### 4. Sign Up & Login
```bash
# Open http://localhost:3000
# Sign up with email
# Get OTP from Redis:
podman-compose exec redis redis-cli -a suqaredis KEYS "otp:*"
# Complete signup and test login
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :8000
lsof -i :6379

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
./podman.sh logs <service>

# Rebuild
./podman.sh build

# Restart
./podman.sh restart
```

### Permission Denied
```bash
# Podman should work without sudo, but if issues:
sudo podman-compose up -d

# Or fix permissions
podman system migrate
podman system reset
```

### Networking Issues
```bash
# Check Podman network
podman network ls

# Inspect network
podman network inspect podman

# Reset network
podman network rm podman
podman-compose restart
```

## Advanced Usage

### Rootless Containers
```bash
# Podman runs rootless by default
podman run alpine id
# uid=0(root) gid=0(root) groups=0(root)
# But it's actually your unprivileged user!

# Check user namespace
podman unshare whoami
# root
```

### Pod Management
```bash
# Create a pod
podman pod create --name suqafuran-pod -p 3000:3000 -p 8000:8000

# Run containers in pod
podman run -d --pod suqafuran-pod --name frontend alpine sleep 3600
podman run -d --pod suqafuran-pod --name backend alpine sleep 3600

# List pods
podman pod ls

# Remove pod
podman pod rm -f suqafuran-pod
```

### Volume Management
```bash
# List volumes
podman volume ls

# Inspect volume
podman volume inspect volume_name

# Remove volume
podman volume rm volume_name

# Clean unused volumes
podman volume prune
```

### Export/Import
```bash
# Save image
podman save suqafuran-backend:latest -o backend.tar

# Load image
podman load -i backend.tar

# Export container
podman export container_name -o container.tar

# Import container
podman import container.tar myimage:latest
```

## Performance Monitoring

```bash
# Real-time resource usage
./podman.sh stats

# Detailed container info
podman stats --no-stream

# System info
podman system info

# Disk usage
podman system df
```

## Cleanup

```bash
# Remove stopped containers
podman container prune

# Remove unused images
podman image prune

# Remove unused volumes
podman volume prune

# Remove all unused resources
podman system prune --all --volumes
```

## Next Steps

1. ✅ Verify Podman: `./podman.sh help`
2. ✅ Start services: `./podman.sh start`
3. ✅ Check status: `./podman.sh status`
4. ✅ Open http://localhost:3000
5. ✅ Test signup/login
6. ✅ View logs: `./podman.sh logs`

## Getting Help

```bash
# Podman help
podman --help
podman-compose --help

# Our helper script
./podman.sh help

# Check service logs
./podman.sh logs backend

# Inspect container
podman inspect suqafuran-backend
```

## Resources

- **Podman Official:** https://podman.io
- **Podman Docs:** https://docs.podman.io
- **podman-compose:** https://github.com/containers/podman-compose
- **Rootless Containers:** https://github.com/containers/podman/blob/main/docs/tutorials/rootless_tutorial.md

---

**You're all set!** Podman is ready to go. Run `./podman.sh start` to begin. 🚀
