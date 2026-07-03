#!/bin/bash

# Suqafuran Podman Management Script
# Podman is a drop-in replacement for Docker with better security

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_podman() {
    if ! command -v podman &> /dev/null; then
        echo -e "${RED}❌ Podman is not installed${NC}"
        exit 1
    fi
    if ! command -v podman-compose &> /dev/null; then
        echo -e "${YELLOW}⚠️  podman-compose not found${NC}"
        echo "Install with: pip install podman-compose"
        exit 1
    fi
    echo -e "${GREEN}✅ Podman $(podman --version | awk '{print $NF}')${NC}"
}

check_env() {
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env file not found${NC}"
        echo "Creating .env from .env.docker..."
        cp .env.docker .env
        echo -e "${GREEN}✅ .env created${NC}"
    fi
}

# Commands
start() {
    print_header "Starting Suqafuran with Podman..."
    check_podman
    check_env
    podman-compose up -d
    sleep 3
    echo -e "${GREEN}✅ Services started${NC}"
    status
}

stop() {
    print_header "Stopping Suqafuran Services..."
    podman-compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

restart() {
    print_header "Restarting Suqafuran Services..."
    podman-compose restart
    sleep 2
    echo -e "${GREEN}✅ Services restarted${NC}"
    status
}

status() {
    print_header "Service Status"
    podman-compose ps
    echo ""
    echo -e "${GREEN}Frontend:${NC}  http://localhost:3000"
    echo -e "${GREEN}Backend:${NC}   http://localhost:8000"
    echo -e "${GREEN}API Docs:${NC}  http://localhost:8000/docs"
}

logs() {
    SERVICE=${1:-""}
    if [ -z "$SERVICE" ]; then
        podman-compose logs -f
    else
        podman-compose logs -f "$SERVICE"
    fi
}

shell() {
    SERVICE=$1
    if [ -z "$SERVICE" ]; then
        echo "Usage: $0 shell <service>"
        echo "Services: backend, frontend, postgres, redis, celery-worker"
        exit 1
    fi
    podman-compose exec "$SERVICE" sh
}

build() {
    print_header "Building Podman Images..."
    podman-compose build --no-cache
    echo -e "${GREEN}✅ Build complete${NC}"
}

clean() {
    print_header "Cleaning Up Podman Resources..."
    podman-compose down -v
    podman system prune -f
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

ps_cmd() {
    print_header "Running Podman Containers"
    podman ps -a
}

stats() {
    print_header "Resource Usage"
    podman stats --no-stream
}

images() {
    print_header "Podman Images"
    podman images
}

pull() {
    print_header "Pulling Base Images..."
    podman pull postgres:16-alpine
    podman pull redis:7-alpine
    podman pull node:20-alpine
    podman pull python:3.14-slim
    echo -e "${GREEN}✅ Images pulled${NC}"
}

help() {
    echo -e "${GREEN}Suqafuran Podman Management${NC}"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start      - Start all services"
    echo "  stop       - Stop all services"
    echo "  restart    - Restart all services"
    echo "  status     - Show service status"
    echo "  logs       - View service logs (use: logs [service])"
    echo "  shell      - Open shell in service (use: shell <service>)"
    echo "  build      - Build Podman images"
    echo "  pull       - Pull base images"
    echo "  ps         - Show running containers"
    echo "  stats      - Show resource usage"
    echo "  images     - Show Podman images"
    echo "  clean      - Remove all containers and volumes"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 shell postgres"
    echo "  $0 stats"
    echo ""
    echo "Podman Information:"
    echo "  Version: $(podman --version)"
    echo "  Compose: $(podman-compose --version)"
    echo ""
}

# Main
case "${1:-help}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs "$2"
        ;;
    shell)
        shell "$2"
        ;;
    build)
        build
        ;;
    pull)
        pull
        ;;
    ps)
        ps_cmd
        ;;
    stats)
        stats
        ;;
    images)
        images
        ;;
    clean)
        clean
        ;;
    help)
        help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        help
        exit 1
        ;;
esac
