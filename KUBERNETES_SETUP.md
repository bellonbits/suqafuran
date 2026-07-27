# Suqafuran Kubernetes & Performance Setup

## 🎯 What's Been Implemented

### 1. Mobile Bottom Navigation (✅ DONE)
**Location**: `/new-frontend/src/components/shared/BottomNav.tsx`

**New Design**:
- Clean 5-icon bottom navigation
- Home | Cart | Search | Categories | Profile
- Blue (#6cd4ff) active states
- Responsive and smooth transitions
- No emoji icons (replaced with lucide-react)

### 2. Kubernetes Infrastructure (✅ DONE)
**Location**: `/backend/k8s/`

**Files Created**:

#### Core Manifests
- `namespace.yaml` - Suqafuran namespace
- `deployment.yaml` - 3-10 replicas with health checks
- `service.yaml` - ClusterIP service
- `hpa.yaml` - Horizontal Pod Autoscaler
- `ingress.yaml` - External access with TLS
- `network-policy.yaml` - Security policies
- `pdb.yaml` - Pod Disruption Budget
- `configmap.yaml` - Configuration & timeouts
- `DEPLOYMENT.md` - Complete deployment guide
- `deploy.sh` - Automated deployment script

## ⚡ Performance Improvements

### Timeout Configurations
```
REQUEST_TIMEOUT: 60 seconds (total request)
DATABASE_TIMEOUT: 30 seconds (DB queries)
CACHE_TIMEOUT: 300 seconds (cache entries)
EXTERNAL_API_TIMEOUT: 45 seconds (external APIs)
```

### Auto-Scaling
- **Min Replicas**: 3
- **Max Replicas**: 10
- **CPU Target**: 70% utilization
- **Memory Target**: 80% utilization
- **Scale Up**: +100% every 30 seconds
- **Scale Down**: -50% every 60 seconds

### Database Connection Pooling
- **Pool Size**: 20 connections
- **Max Overflow**: 40 additional connections
- **Pool Timeout**: 30 seconds
- **Pool Recycle**: 3600 seconds

### Health Checks
- **Liveness Probe**: Every 10s (3 failures = restart)
- **Readiness Probe**: Every 5s (2 failures = drain)
- **Startup Probe**: 30 attempts over 300s

### Resource Limits
```
Requests:
  CPU: 250m (0.25 cores)
  Memory: 512Mi

Limits:
  CPU: 500m (0.5 cores)
  Memory: 1Gi
```

## 🚀 Deployment Instructions

### Step 1: Prepare Docker Image
```bash
cd /Users/mac/suqafuran/backend
docker build -t suqafuran-backend:latest .
docker tag suqafuran-backend:latest your-registry/suqafuran-backend:latest
docker push your-registry/suqafuran-backend:latest
```

### Step 2: Create Kubernetes Secrets
```bash
kubectl create secret generic suqafuran-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@host:5432/db' \
  --from-literal=REDIS_URL='redis://host:6379' \
  -n suqafuran
```

### Step 3: Deploy
```bash
cd /Users/mac/suqafuran/backend/k8s
./deploy.sh
```

Or manually:
```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
kubectl apply -f network-policy.yaml
kubectl apply -f pdb.yaml
kubectl apply -f ingress.yaml
```

## 📊 Monitoring

### Check Deployment Status
```bash
# Pods
kubectl get pods -n suqafuran

# Services
kubectl get svc -n suqafuran

# HPA
kubectl get hpa -n suqafuran

# Logs
kubectl logs -f deployment/suqafuran-api -n suqafuran
```

### Watch Auto-Scaling
```bash
kubectl get hpa suqafuran-api-hpa -n suqafuran --watch
```

### View Metrics
```bash
kubectl top pods -n suqafuran
kubectl top nodes
```

## 🔧 Timeout Handling

The system now handles timeouts gracefully:

1. **Short Operations** (< 10s): Connection timeout
2. **Medium Operations** (10-30s): Database operations
3. **Long Operations** (30-60s): Full request cycle
4. **External APIs** (< 45s): Third-party integrations

**In the backend**, timeouts are enforced via:
- Database pool timeouts
- Redis connection timeouts
- HTTP client timeouts
- Request processing timeouts (per ConfigMap)

## 💡 Key Features

✅ **High Availability**: 3 minimum replicas + pod anti-affinity
✅ **Auto-Scaling**: Automatic scale up/down based on load
✅ **Health Checks**: Liveness, readiness, startup probes
✅ **Rolling Updates**: Zero-downtime deployments
✅ **Network Policies**: Security and traffic control
✅ **Resource Limits**: Prevent resource exhaustion
✅ **Pod Disruption Budget**: Maintain availability during maintenance

## 📱 Mobile UI Updates

### Bottom Navigation
- Removed: "Sell" button
- Updated: Home, Cart, Search, Categories, Profile
- Color: Blue (#6cd4ff) for active states
- Icons: lucide-react (no emojis)

### Responsive Design
- Optimized for mobile screens
- Full height footer with 5 main actions
- Touch-friendly icon spacing

## 🔐 Security

- Network policies restrict traffic
- Resource limits prevent DoS
- Health checks catch failed instances
- Pod disruption budget ensures availability
- Rate limiting via ConfigMap

## 📈 Expected Performance Improvements

1. **Faster Response Times**: Connection pooling + caching
2. **Better Resource Utilization**: Auto-scaling distributes load
3. **Higher Availability**: Multiple replicas + health checks
4. **Timeout Prevention**: Configured at all levels
5. **Automatic Recovery**: Failed pods restart automatically

## 🛠️ Next Steps

1. **Build & Push Docker Image**
   ```bash
   cd backend && docker build -t your-registry/suqafuran-backend:latest .
   docker push your-registry/suqafuran-backend:latest
   ```

2. **Set Up Kubernetes Cluster**
   - Use managed K8s (AWS EKS, GCP GKE, Azure AKS, DigitalOcean)
   - Or self-managed (kubeadm, k3s, etc.)

3. **Install Required Components**
   - nginx-ingress controller
   - cert-manager for SSL
   - metrics-server for HPA

4. **Deploy Using Script**
   ```bash
   cd backend/k8s
   chmod +x deploy.sh
   DOCKER_REGISTRY=your-registry ./deploy.sh
   ```

5. **Monitor & Iterate**
   - Watch HPA metrics
   - Tune resource limits
   - Adjust timeout values based on actual usage

## 📞 Support

For issues or questions about the Kubernetes setup:
1. Check deployment logs: `kubectl logs -n suqafuran`
2. Review DEPLOYMENT.md for troubleshooting
3. Check ConfigMap values: `kubectl get configmap suqafuran-config -n suqafuran -o yaml`
