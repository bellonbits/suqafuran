#!/bin/bash

# Suqafuran Docker Management Script

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo "Install Docker from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is installed${NC}"
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
    print_header "Starting Suqafuran Services..."
    check_docker
    check_env
    docker-compose up -d
    sleep 3
    echo -e "${GREEN}✅ Services started${NC}"
    status
}

stop() {
    print_header "Stopping Suqafuran Services..."
    docker-compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

restart() {
    print_header "Restarting Suqafuran Services..."
    docker-compose restart
    sleep 2
    echo -e "${GREEN}✅ Services restarted${NC}"
    status
}

status() {
    print_header "Service Status"
    docker-compose ps
    echo ""
    echo -e "${GREEN}Frontend:${NC}  http://localhost:3000"
    echo -e "${GREEN}Backend:${NC}   http://localhost:8000"
    echo -e "${GREEN}API Docs:${NC}  http://localhost:8000/docs"
}

logs() {
    SERVICE=${1:-""}
    if [ -z "$SERVICE" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$SERVICE"
    fi
}

shell() {
    SERVICE=$1
    if [ -z "$SERVICE" ]; then
        echo "Usage: $0 shell <service>"
        echo "Services: backend, frontend, postgres, redis"
        exit 1
    fi
    docker-compose exec "$SERVICE" sh
}

build() {
    print_header "Building Docker Images..."
    docker-compose build --no-cache
    echo -e "${GREEN}✅ Build complete${NC}"
}

clean() {
    print_header "Cleaning Up Docker Resources..."
    docker-compose down -v
    docker system prune -f
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

help() {
    echo -e "${GREEN}Suqafuran Docker Management${NC}"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start     - Start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  status    - Show service status"
    echo "  logs      - View service logs (use: logs [service])"
    echo "  shell     - Open shell in service (use: shell <service>)"
    echo "  build     - Build Docker images"
    echo "  clean     - Remove all containers and volumes"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 shell postgres"
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
