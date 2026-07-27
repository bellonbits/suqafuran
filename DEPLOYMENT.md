# Suqafuran Monitoring Dashboard - Deployment Guide

## Quick Start (Docker Compose)

### Prerequisites
- Docker & Docker Compose installed
- Server with at least 2GB RAM, 10GB storage
- Domain name (optional, for production)

### 1. Environment Setup

Create `.env` file in project root:

```bash
# Backend
API_PORT=8000
DATABASE_URL=postgresql://suqafuran:suqafuran@postgres:5432/suqafuran
REDIS_URL=redis://redis:6379/0
ENVIRONMENT=production
SECRET_KEY=$(openssl rand -hex 32)

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Services
JAEGER_QUERY_URL=http://jaeger:16686
KAFKA_BOOTSTRAP_SERVERS=kafka:9092

# Optional: Email/Slack for alerts
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 2. Build & Deploy

```bash
# Clone and setup
git clone https://github.com/bellonbits/suqafuran.git
cd suqafuran

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend python -m alembic upgrade head

# Verify services are running
docker-compose ps
```

### 3. Access Dashboard

- **Backend API**: `http://your-server:8000/api/v1`
- **Frontend**: `http://your-server:3000`
- **Monitoring**: `http://your-server:3000/admin/monitoring`
- **Jaeger**: `http://your-server:16686`
- **Kafka UI**: `http://your-server:8080`

---

## Production Deployment (Ubuntu 22.04)

### 1. Server Setup

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Add user to docker group
usermod -aG docker $USER
newgrp docker
```

### 2. Clone Repository

```bash
# Create app directory
mkdir -p /opt/suqafuran
cd /opt/suqafuran

# Clone repo
git clone https://github.com/bellonbits/suqafuran.git .

# Set proper permissions
chown -R ubuntu:ubuntu /opt/suqafuran
```

### 3. Configure Environment

```bash
# Create production .env
cat > .env << 'EOF'
# Backend
API_PORT=8000
DATABASE_URL=postgresql://suqafuran:$(openssl rand -hex 16)@postgres:5432/suqafuran
REDIS_URL=redis://redis:6379/0
ENVIRONMENT=production
SECRET_KEY=$(openssl rand -hex 32)
NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1

# Services
JAEGER_QUERY_URL=http://jaeger:16686
KAFKA_BOOTSTRAP_SERVERS=kafka:9092

# Admin Credentials (CHANGE THESE!)
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=$(openssl rand -base64 32)

# Email (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@your-domain.com
SMTP_PASSWORD=your-app-password

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
EOF
```

### 4. SSL/HTTPS with Nginx

```bash
# Install Nginx
apt install -y nginx certbot python3-certbot-nginx

# Create Nginx config
cat > /etc/nginx/sites-available/suqafuran << 'EOF'
upstream api {
    server 127.0.0.1:8000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # API reverse proxy
    location /api/v1 {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    # WebSocket for live events
    location /api/v1/admin/monitoring/live/ws {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        proxy_cache_valid 30d;
        add_header Cache-Control "public, immutable";
    }

    # Monitoring dashboards
    location /jaeger {
        proxy_pass http://127.0.0.1:16686;
        proxy_set_header Host $host;
    }

    location /kafka-ui {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/suqafuran /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Get SSL certificate
certbot certonly --nginx -d your-domain.com

# Enable Nginx
systemctl enable nginx
systemctl start nginx
```

### 5. Start Services

```bash
cd /opt/suqafuran

# Pull latest images
docker-compose pull

# Start all services
docker-compose up -d

# Watch logs
docker-compose logs -f

# Run migrations
docker-compose exec backend python -m alembic upgrade head

# Create admin user (if needed)
docker-compose exec backend python -c "
from app.database import SessionLocal
from app.models.user import User
from sqlalchemy.orm import Session

db = SessionLocal()
admin = User(
    email='admin@your-domain.com',
    full_name='Admin',
    is_admin=True,
    is_verified=True,
    password='secure-password-here'
)
db.add(admin)
db.commit()
print('Admin user created')
"
```

### 6. Verify Deployment

```bash
# Check all containers running
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs frontend

# Test API
curl https://your-domain.com/api/v1/admin/monitoring/overview

# Check Nginx
systemctl status nginx
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Backend health
docker-compose exec backend curl http://localhost:8000/health

# Database
docker-compose exec postgres psql -U suqafuran -d suqafuran -c "SELECT NOW();"

# Redis
docker-compose exec redis redis-cli PING

# Kafka
docker-compose exec kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

### Backups

```bash
# Database backup
docker-compose exec postgres pg_dump -U suqafuran suqafuran > backup-$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U suqafuran suqafuran < backup-20240717.sql
```

### Updates

```bash
# Pull latest code
cd /opt/suqafuran
git pull origin main

# Rebuild images
docker-compose build

# Restart services
docker-compose up -d

# Run migrations
docker-compose exec backend python -m alembic upgrade head
```

### Logs & Monitoring

```bash
# Real-time logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery

# Past logs
docker-compose logs backend --tail 100

# System resources
docker stats

# Container stats
docker-compose exec backend top
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check database logs
docker-compose logs postgres

# Verify database exists
docker-compose exec postgres psql -U suqafuran -l

# Reconnect
docker-compose restart postgres backend
```

### Memory Issues

```bash
# Increase Docker memory
# Edit docker-compose.yml and add:
# mem_limit: 2g

# Restart
docker-compose up -d
```

### SSL Certificate Issues

```bash
# Renew certificate
certbot renew --force-renewal

# Auto-renew setup
systemctl enable certbot.timer
systemctl start certbot.timer
```

### WebSocket Connection Issues

Check Nginx logs:
```bash
tail -f /var/log/nginx/error.log
```

Ensure `/live/ws` is proxied correctly in Nginx config.

---

## Security Checklist

- [ ] Change `SECRET_KEY` in `.env`
- [ ] Change database password
- [ ] Change admin password
- [ ] Enable SSL/HTTPS
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure firewall (only ports 80, 443, 22)
- [ ] Set up log rotation
- [ ] Enable automated backups
- [ ] Configure monitoring alerts
- [ ] Set up fail2ban for brute-force protection

---

## Performance Optimization

### Database
```sql
-- Create indexes for common queries
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled);
CREATE INDEX idx_alert_history_fired_at ON alert_history(fired_at DESC);
CREATE INDEX idx_notification_log_status ON notification_log(status);
```

### Redis Caching
```bash
# Verify Redis is working
docker-compose exec redis redis-cli INFO stats
```

### Nginx Gzip
Already enabled in config for CSS/JS compression.

---

## Support & Monitoring

### Access Monitoring Dashboard
- **URL**: `https://your-domain.com/admin/monitoring`
- **Kafka Topics**: `https://your-domain.com/kafka-ui`
- **Jaeger Traces**: `https://your-domain.com/jaeger`

### Alert Endpoints
- View alerts: `https://your-domain.com/admin/monitoring/alerts`
- Create alert rule: POST to `/api/v1/admin/monitoring/alerts/rules`
- Get alert history: GET `/api/v1/admin/monitoring/alerts/history`

---

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml - Scale workers
services:
  celery-worker:
    deploy:
      replicas: 3
```

### Load Balancing

```bash
# Add multiple backends in Nginx upstream
upstream api {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}
```

---

For support, issues, or questions:
- GitHub Issues: https://github.com/bellonbits/suqafuran/issues
- Documentation: `/MONITORING_README.md`
