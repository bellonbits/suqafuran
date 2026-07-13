# 🚀 DigitalOcean Deployment Guide

## Overview
Three ways to deploy Suqafuran backend to DigitalOcean:
1. **App Platform** (easiest, managed)
2. **Kubernetes (DOKS)** (recommended for scaling)
3. **Droplet** (cheapest, manual)

---

## Option 1: DigitalOcean App Platform (Recommended - Easiest)

### Step 1: Prepare Docker Image

```bash
cd /Users/mac/suqafuran/backend

# Build Docker image
docker build -t suqafuran-backend:latest .

# Tag for Docker Hub (or use DO Container Registry)
docker tag suqafuran-backend:latest your-dockerhub/suqafuran-backend:latest

# Push to Docker Hub
docker login
docker push your-dockerhub/suqafuran-backend:latest
```

### Step 2: Create DigitalOcean Container Registry (Optional)

```bash
# Or use DigitalOcean's Container Registry (private)
doctl registry create suqafuran

# Tag image for DO Registry
docker tag suqafuran-backend:latest registry.digitalocean.com/suqafuran/backend:latest

# Push to DO Registry
doctl registry login
docker push registry.digitalocean.com/suqafuran/backend:latest
```

### Step 3: Create App on DigitalOcean

1. Go to **DigitalOcean Dashboard** → **Apps**
2. Click **Create App**
3. Connect your **GitHub repository** (or use container image)
4. Configure:
   - **Name**: suqafuran-api
   - **Source**: Docker Image
   - **Image**: `registry.digitalocean.com/suqafuran/backend:latest`

### Step 4: Set Environment Variables

In App Platform, go to **Settings** → **Environment Variables**:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
ENVIRONMENT=production
LOG_LEVEL=info
API_PORT=8080
WORKERS=4
```

### Step 5: Configure Health Checks

- **HTTP Path**: `/health`
- **Port**: 8080
- **Timeout**: 10s
- **Check Interval**: 60s

### Step 6: Set Up Domain

1. Go to **Settings** → **Domains**
2. Add your domain: `api.suqafuran.com`
3. Point DNS to DigitalOcean nameservers

**Result**: API available at `https://api.suqafuran.com`

**Cost**: $12/month (basic plan)

---

## Option 2: Kubernetes (DOKS) - Recommended for Scale

### Step 1: Create Kubernetes Cluster

```bash
# Install doctl CLI
brew install digitalocean/doctl/doctl

# Authenticate
doctl auth init

# Create cluster (3-node, $60/month)
doctl kubernetes cluster create suqafuran-cluster \
  --region nyc3 \
  --node-pool name=worker-pool count=3 size=s-2vcpu-4gb

# Get kubeconfig
doctl kubernetes cluster kubeconfig save suqafuran-cluster
```

### Step 2: Push Docker Image

```bash
# Using DO Container Registry
doctl registry login
docker push registry.digitalocean.com/suqafuran/backend:latest
```

### Step 3: Deploy Using Our Kubernetes Manifests

```bash
cd /Users/mac/suqafuran/backend/k8s

# Update image in deployment.yaml
sed -i '' 's|suqafuran-backend:latest|registry.digitalocean.com/suqafuran/backend:latest|g' deployment.yaml

# Create namespace
kubectl apply -f namespace.yaml

# Create secrets
kubectl create secret generic suqafuran-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@db.ondigitalocean.com:5432/suqafuran' \
  --from-literal=REDIS_URL='redis://cache.ondigitalocean.com:6379' \
  -n suqafuran

# Deploy all resources
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
kubectl apply -f ingress.yaml
kubectl apply -f network-policy.yaml
kubectl apply -f pdb.yaml

# Verify deployment
kubectl get pods -n suqafuran
kubectl get svc -n suqafuran
```

### Step 4: Set Up Ingress Controller

```bash
# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Get LoadBalancer IP
kubectl get svc -n ingress-nginx
```

### Step 5: Configure DNS

Point your domain to the LoadBalancer IP:

```bash
# Get the external IP from ingress
kubectl get ingress -n suqafuran

# Add A record in DNS:
# api.suqafuran.com → [EXTERNAL-IP]
```

### Step 6: Monitor Deployment

```bash
# Watch pods
kubectl get pods -n suqafuran --watch

# View logs
kubectl logs -f deployment/suqafuran-api -n suqafuran

# Check HPA scaling
kubectl get hpa -n suqafuran --watch

# Check metrics
kubectl top pods -n suqafuran
```

**Cost**: $60-120/month (3 nodes)
**Benefits**: Auto-scaling, high availability, load balancing

---

## Option 3: Simple Droplet Deployment

### Step 1: Create Droplet

```bash
# Using doctl
doctl compute droplet create suqafuran-api \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc3 \
  --enable-monitoring

# Get IP address
doctl compute droplet list
```

### Step 2: SSH and Install Docker

```bash
ssh root@[DROPLET-IP]

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Step 3: Deploy Backend

```bash
# Create app directory
mkdir -p /opt/suqafuran
cd /opt/suqafuran

# Copy docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  api:
    image: suqafuran-backend:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db.ondigitalocean.com:5432/suqafuran
      - REDIS_URL=redis://cache.ondigitalocean.com:6379
      - ENVIRONMENT=production
      - WORKERS=4
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: always
EOF

# Start services
docker-compose up -d

# View logs
docker-compose logs -f api
```

### Step 4: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot certonly --standalone -d api.suqafuran.com

# Auto-renew
systemctl enable certbot.timer
systemctl start certbot.timer
```

**Cost**: $24/month (basic droplet)
**Drawbacks**: Manual scaling, no HA, manual backups

---

## Database Setup - DigitalOcean Managed Database

### Create PostgreSQL Database

```bash
doctl databases create suqafuran-db \
  --engine pg \
  --num-nodes 1 \
  --size db-s-1vcpu-1gb \
  --region nyc3

# Get connection string
doctl databases connection get suqafuran-db
```

### Create Redis Database

```bash
doctl databases create suqafuran-cache \
  --engine redis \
  --num-nodes 1 \
  --size db-s-1vcpu-1gb \
  --region nyc3
```

---

## Comparison

| Feature | App Platform | DOKS | Droplet |
|---------|-------------|------|---------|
| Cost | $12/mo | $60/mo | $24/mo |
| Scaling | Manual | Auto | Manual |
| HA | ❌ | ✅ | ❌ |
| Monitoring | Basic | Advanced | None |
| Setup Time | 5 min | 30 min | 45 min |
| Recommended | Small apps | Production | Dev/Test |

---

## Post-Deployment Checklist

- [ ] Database credentials secured in secrets
- [ ] Health checks passing
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Firewall rules set
- [ ] Environment variables correct
- [ ] Cache working
- [ ] Logs accessible

---

## Monitoring & Logs

### View Logs (App Platform)
```bash
doctl apps logs get [APP-ID]
```

### View Logs (DOKS)
```bash
kubectl logs -f deployment/suqafuran-api -n suqafuran
```

### View Logs (Droplet)
```bash
docker-compose logs -f api
```

---

## Scaling

### App Platform
- Go to **Settings** → **Auto Scaling**
- Set min/max instances

### DOKS (Automatic)
- HPA automatically scales 3-10 replicas
- Nodes auto-scale with cluster autoscaler

### Droplet
- Manual: `docker-compose up -d --scale api=3` (with load balancer)

---

## Cost Optimization

1. **Use Managed Databases** - DigitalOcean handles backups/scaling
2. **Reserve Bandwidth** - Get discounts on data transfer
3. **Spot instances** - Cheaper but can be terminated (App Platform)
4. **Shared CPU** - Good for non-peak traffic (basic plans)
5. **CDN** - Cache API responses to reduce load

---

## Quick Reference

### DigitalOcean CLI Commands

```bash
# Authenticate
doctl auth init

# List resources
doctl compute droplet list
doctl kubernetes cluster list
doctl databases list
doctl apps list

# Create resources
doctl compute droplet create [NAME]
doctl kubernetes cluster create [NAME]
doctl databases create [NAME]

# Delete resources
doctl compute droplet delete [ID]
doctl kubernetes cluster delete [NAME]

# Get credentials
doctl kubeconfig save [CLUSTER-NAME]
doctl databases connection get [DB-NAME]
```

---

## Troubleshooting

### Pod won't start
```bash
kubectl describe pod [POD-NAME] -n suqafuran
kubectl logs [POD-NAME] -n suqafuran
```

### Database connection failing
- Check firewall rules allow your app IP
- Verify DATABASE_URL environment variable
- Test connection locally: `psql postgresql://...`

### High memory usage
- Check queries with `kubectl top pods`
- Reduce replica count temporarily
- Check for memory leaks in logs

### SSL certificate issues
```bash
# Check certificate
certbot certificates

# Renew manually
certbot renew --force-renewal
```

---

## Support

- **DigitalOcean Docs**: https://docs.digitalocean.com
- **Kubernetes Docs**: https://kubernetes.io/docs
- **App Platform Docs**: https://docs.digitalocean.com/products/app-platform
