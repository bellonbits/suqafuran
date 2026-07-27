#!/bin/bash

# Suqafuran Services Setup Script
# Automates PostgreSQL, Redis, and service startup

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker installed"
    else
        print_error "Docker not found. Please install Docker from https://www.docker.com"
        exit 1
    fi

    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | awk '{print $2}')
        print_success "Python $PYTHON_VERSION installed"
    else
        print_error "Python 3 not found. Please install Python 3.9+"
        exit 1
    fi

    # Check pip
    if command -v pip3 &> /dev/null; then
        print_success "pip3 installed"
    else
        print_error "pip3 not found"
        exit 1
    fi
}

# Setup PostgreSQL
setup_postgres() {
    print_header "Setting up PostgreSQL"

    # Check if container exists
    if docker ps -a --format '{{.Names}}' | grep -q suqafuran-postgres; then
        print_warning "PostgreSQL container already exists"
        docker start suqafuran-postgres 2>/dev/null && print_success "PostgreSQL started" || print_error "Failed to start PostgreSQL"
    else
        print_warning "Creating new PostgreSQL container..."
        docker run -d \
            --name suqafuran-postgres \
            -e POSTGRES_PASSWORD=password \
            -e POSTGRES_DB=suqafuran \
            -p 5432:5432 \
            -v postgres_data:/var/lib/postgresql/data \
            postgres:15

        # Wait for PostgreSQL to be ready
        sleep 5
        print_success "PostgreSQL started"
    fi

    # Verify connection
    if psql -U postgres -h localhost -d suqafuran -c "SELECT 1" &> /dev/null; then
        print_success "PostgreSQL connection verified"
    else
        print_error "Failed to connect to PostgreSQL"
        exit 1
    fi
}

# Setup Redis
setup_redis() {
    print_header "Setting up Redis"

    # Check if container exists
    if docker ps -a --format '{{.Names}}' | grep -q suqafuran-redis; then
        print_warning "Redis container already exists"
        docker start suqafuran-redis 2>/dev/null && print_success "Redis started" || print_error "Failed to start Redis"
    else
        print_warning "Creating new Redis container..."
        docker run -d \
            --name suqafuran-redis \
            -p 6379:6379 \
            -v redis_data:/data \
            redis:7 redis-server --appendonly yes

        sleep 2
        print_success "Redis started"
    fi

    # Verify connection
    if redis-cli ping &> /dev/null; then
        print_success "Redis connection verified"
    else
        print_error "Failed to connect to Redis"
        exit 1
    fi
}

# Create database tables
create_tables() {
    print_header "Creating database tables"

    cd "$BACKEND_DIR"

    python3 << 'EOF'
try:
    from database import Base, engine
    from models import *

    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")
except Exception as e:
    print(f"✗ Error creating tables: {e}")
    exit(1)
EOF
}

# Install Python dependencies
install_dependencies() {
    print_header "Installing Python dependencies"

    cd "$BACKEND_DIR"

    if [ ! -d "venv" ]; then
        print_warning "Creating virtual environment..."
        python3 -m venv venv
    fi

    # Activate venv
    source venv/bin/activate

    print_warning "Installing packages..."
    pip install -q -r requirements.txt

    print_success "Dependencies installed"
}

# Verify environment configuration
verify_env() {
    print_header "Verifying environment configuration"

    cd "$BACKEND_DIR"

    if [ ! -f ".env" ]; then
        print_warning "Creating .env from template..."
        if [ -f ".env.phase4" ]; then
            cp .env.phase4 .env
            print_warning "Edit .env with your credentials:"
            echo "  - RESEND_API_KEY"
            echo "  - AFRICASTALKING_USERNAME"
            echo "  - AFRICASTALKING_API_KEY"
            echo "  - FIREBASE_CREDENTIALS_JSON (optional)"
        else
            print_error ".env.phase4 template not found"
            exit 1
        fi
    else
        print_success ".env file exists"
    fi
}

# Summary
print_summary() {
    print_header "Setup Complete!"

    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo ""
    echo "1. Update .env with your credentials:"
    echo "   nano backend/.env"
    echo ""
    echo "2. In Terminal 1 (Celery Worker):"
    echo "   cd backend && source venv/bin/activate && celery -A celery_app worker --loglevel=info"
    echo ""
    echo "3. In Terminal 2 (FastAPI Backend):"
    echo "   cd backend && source venv/bin/activate && python main.py"
    echo ""
    echo "4. In Terminal 3 (Testing):"
    echo "   curl http://localhost:8000/health"
    echo ""
    echo -e "${GREEN}For more information, see: WEEK1_DEPLOYMENT_GUIDE.md${NC}"
    echo ""
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ Suqafuran Services Setup${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""

    check_prerequisites
    setup_postgres
    setup_redis
    install_dependencies
    create_tables
    verify_env
    print_summary
}

# Run main function
main "$@"
