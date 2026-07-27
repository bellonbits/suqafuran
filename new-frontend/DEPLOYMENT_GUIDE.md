# Deployment Guide — Suqafuran Express Frontend

**Target:** DigitalOcean App Platform | **Framework:** Next.js 15 | **Status:** Ready to Deploy

---

## 🚀 Deploy to DigitalOcean App Platform

### Step 1: Prepare Your Repository

```bash
cd /Users/mac/suqafuran/new-frontend

# Ensure all changes are committed
git add .
git commit -m "Complete frontend: driver app + merchant dashboard"

# Push to GitHub
git push origin main
```

### Step 2: Create DigitalOcean Account

1. Go to [DigitalOcean.com](https://www.digitalocean.com)
2. Sign up or login
3. Create a new Project: "Suqafuran Express"

### Step 3: Create App Platform

1. **In DigitalOcean Console:**
   - Click "Apps" → "Create Apps"
   - Choose "GitHub" as source
   - Authorize GitHub account
   - Select repository: `suqafuran` (or your repo)
   - Select branch: `main`

2. **Configure App:**
   - Name: `suqafuran-frontend`
   - Source Branch: `main`
   - Autodeploy: ✅ Enabled

3. **Set Build Command:**
   ```bash
   npm install && npm run build
   ```

4. **Set Start Command:**
   ```bash
   npm start
   ```

5. **Set Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://api.suqafuran.com:8006
   NEXT_PUBLIC_MERCHANT_API=https://api.suqafuran.com:8003
   NEXT_PUBLIC_GATEWAY_URL=https://api.suqafuran.com:8000
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key_here
   NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
   NEXT_PUBLIC_WS_URL=wss://api.suqafuran.com:8007
   ```

6. **Set Resource:**
   - Type: Web Service
   - Plan: Basic ($12/mo) or Professional ($25/mo)
   - HTTP Port: 3000

7. **Review & Deploy**
   - Click "Deploy"
   - Wait for build (5-10 minutes)
   - Get auto-generated URL: `https://suqafuran-frontend-xxxx.ondigitalocean.app`

### Step 4: Configure Custom Domain

1. **In DigitalOcean Console:**
   - Go to App → Settings → Domains
   - Add Domain: `app.suqafuran.com`
   - Follow DNS configuration steps

2. **Update DNS Records** (in your domain registrar):
   ```
   Type: CNAME
   Name: app
   Value: suqafuran-frontend-xxxx.ondigitalocean.app
   TTL: 3600
   ```

3. **Enable HTTPS:**
   - DigitalOcean auto-provisions Let's Encrypt certificate
   - HTTPS enabled automatically

### Step 5: Verify Deployment

```bash
# Test the app
curl https://app.suqafuran.com

# Check logs
# In DigitalOcean Console → App → Logs

# Monitor metrics
# In DigitalOcean Console → App → Metrics
```

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────┐
│     DigitalOcean App Platform           │
├─────────────────────────────────────────┤
│                                         │
│  Frontend (Next.js)                     │
│  ├─ Driver App (/driver)                │
│  ├─ Merchant Dashboard (/merchant)      │
│  └─ Marketplace (/home, /shop)          │
│                                         │
│  http://localhost:3000                  │
│  → https://app.suqafuran.com            │
│                                         │
└────────────────┬────────────────────────┘
                 │
                 ↓ HTTPS (Port 443)
                 │
    ┌────────────┴────────────┐
    ↓                         ↓
┌─────────────┐         ┌─────────────┐
│ Backend     │         │ WebSocket   │
│ Services    │         │ Services    │
│             │         │             │
│ :8006       │         │ :8007       │
│ :8003       │         │ :8008       │
│ :8010       │         │ :8009       │
└─────────────┘         └─────────────┘
     ↓ Private networking (same VPC)
┌────────────────────────────┐
│  PostgreSQL, Redis, NATS   │
│  (Database layer)          │
└────────────────────────────┘
```

---

## 🔧 Environment Variables Reference

### Required for Backend Integration

```bash
# Driver Service (port 8006)
NEXT_PUBLIC_API_URL=https://api.suqafuran.com:8006

# Merchant Service (port 8003)
NEXT_PUBLIC_MERCHANT_API=https://api.suqafuran.com:8003

# API Gateway (port 8000) - for marketplace
NEXT_PUBLIC_GATEWAY_URL=https://api.suqafuran.com:8000

# WebSocket (port 8007) - real-time tracking
NEXT_PUBLIC_WS_URL=wss://api.suqafuran.com:8007
```

### Optional (for Maps & Analytics)

```bash
# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...

# Analytics
NEXT_PUBLIC_SENTRY_DSN=https://...
```

---

## 📱 Mobile App Distribution

### iOS (App Store)

```bash
# 1. Build for production
npm run build

# 2. Sync to Capacitor
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# 4. In Xcode:
# - Select "Suqafuran Express" target
# - Select "Any iOS Device"
# - Product → Archive
# - Distribute App

# 5. Sign in with Apple Developer Account
# 6. Select Automatic signing
# 7. Submit to App Store
```

### Android (Google Play)

```bash
# 1. Build for production
npm run build

# 2. Sync to Capacitor
npx cap sync android

# 3. Open Android Studio
npx cap open android

# 4. In Android Studio:
# - Build → Generate Signed APK/Bundle
# - Select keystore (create if needed)
# - Select release variant
# - Finish

# 5. Upload to Google Play Console
```

### Web PWA

```bash
# Already available at https://app.suqafuran.com
# Users can install from browser menu:
# Chrome: "Install app"
# Safari: "Add to Home Screen"
# Firefox: "Install as App"
```

---

## 🔄 CI/CD Pipeline (Auto-Deployment)

**GitHub Actions Workflow** (optional, for more control):

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Build
        run: npm run build
      
      - name: Deploy to DigitalOcean
        run: |
          # Your deployment script here
          # Using doctl CLI or direct deployment
```

---

## 📊 Monitoring & Scaling

### DigitalOcean App Platform Features

**Auto-Scaling:**
```
CPU threshold: 80%
Memory threshold: 90%
Min instances: 1
Max instances: 5
Scale down after: 5 minutes of low usage
```

**Health Checks:**
- Endpoint: `/health`
- Interval: 30 seconds
- Timeout: 10 seconds

**Logs:**
- View in DigitalOcean Console
- Export to DigitalOcean Spaces (S3 compatible)
- Set retention: 30 days

**Metrics:**
- CPU usage
- Memory usage
- Request count
- Error rate
- Response time

---

## 🔒 Security Hardening

### HTTPS & TLS

- ✅ Auto-provisioned by DigitalOcean
- ✅ Let's Encrypt certificates (auto-renew)
- ✅ HTTP → HTTPS redirect enabled
- ✅ HSTS headers set (1 year)

### API Security

1. **Backend Services:**
   - Only accessible from App Platform (private networking)
   - No public IP exposure
   - VPC isolation

2. **CORS Configuration:**
   - Whitelist frontend domain only
   - `Access-Control-Allow-Origin: https://app.suqafuran.com`

3. **Rate Limiting:**
   - 100 requests/minute per IP
   - 1000 requests/minute per authenticated user
   - Configured in backend

### Environment Variables

- **Never commit secrets** to Git
- Store in DigitalOcean Console (encrypted)
- Rotate API keys monthly
- Use separate secrets for staging/production

---

## 🧪 Testing Pre-Deployment

### Local Testing

```bash
# 1. Start all backend services
cd /Users/mac/suqafuran-express
docker-compose up -d

# 2. Start frontend dev server
cd /Users/mac/suqafuran/new-frontend
npm run dev

# 3. Test each role
# Driver: http://localhost:3000/driver/login
# Merchant: http://localhost:3000/merchant/login
# Customer: http://localhost:3000/home

# 4. Run type check
npx tsc --noEmit

# 5. Run linter
npm run lint

# 6. Build production
npm run build

# 7. Start production server
npm start
```

### Staging Testing (DigitalOcean)

1. **Deploy to staging branch:** `staging`
2. **Run smoke tests:**
   - [ ] Driver login works
   - [ ] Merchant login works
   - [ ] Job offers display
   - [ ] Delivery map loads
   - [ ] WebSocket connects
   - [ ] Chat messages send/receive
   - [ ] Payment initiation works
   - [ ] Mobile app loads

3. **Performance testing:**
   - [ ] Page load time < 2s
   - [ ] WebSocket latency < 100ms
   - [ ] API response time < 500ms

4. **Approval:** Get sign-off before production push

---

## 🚨 Troubleshooting Deployment

### Build Fails

```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
rm -rf .next node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Frontend Loads but Backend Unreachable

```bash
# Check backend services are running
curl https://api.suqafuran.com:8006/health
# Should return 200

# Check environment variables
# In DigitalOcean Console → App → Settings → Env Vars
# Verify NEXT_PUBLIC_API_URL is correct

# Check CORS headers
# Browser Console → Network → API call → Headers
# Look for Access-Control-Allow-Origin
```

### WebSocket Connection Fails

```bash
# Verify WSS endpoint
# Should be: wss://api.suqafuran.com:8007

# Check backend tracking service
curl wss://api.suqafuran.com:8007/health

# Browser Console → Network → WS
# Look for WebSocket connection status
```

### Mobile App Can't Connect

```bash
# Check that API endpoint is HTTPS (not HTTP)
# Capacitor enforces HTTPS for security

# Verify SSL certificate
# https://www.sslshopper.com/ssl-checker.html?hostname=api.suqafuran.com

# Update Capacitor
npx cap update
```

---

## 📈 Performance Optimization

### Frontend Optimization

- ✅ Image optimization (Next.js Image component)
- ✅ Code splitting (dynamic imports)
- ✅ Compression (gzip enabled)
- ✅ Caching headers (set by DigitalOcean)

### DigitalOcean Configuration

```
# Recommended settings
CPU: 512MB (scale to 1GB if needed)
Memory: 512MB (scale to 1GB if needed)
HTTP Port: 3000

# Auto-scaling
Min: 1 instance
Max: 5 instances
Scale at: 80% CPU or 90% memory
```

### Monitoring

```bash
# Check response times
# In DigitalOcean Console → App → Metrics

# Typical performance:
# - Page load: 1-2 seconds
# - API call: 100-300ms
# - WebSocket: <100ms latency
```

---

## 🔄 Zero-Downtime Deployments

DigitalOcean automatically handles:
- ✅ Blue-green deployments
- ✅ Graceful connection draining
- ✅ Health check verification
- ✅ Automatic rollback on failure

**Your responsibility:**
- ✅ Test changes locally first
- ✅ Commit to `staging` for pre-deployment testing
- ✅ Merge to `main` when ready for production

---

## 📅 Maintenance & Updates

### Weekly
- [ ] Monitor error rates (< 1%)
- [ ] Check performance metrics
- [ ] Review logs for issues

### Monthly
- [ ] Update npm dependencies
- [ ] Rotate API keys
- [ ] Review security headers
- [ ] Test disaster recovery

### Quarterly
- [ ] Major dependency updates
- [ ] Security audit
- [ ] Performance optimization
- [ ] Database backup verification

---

## 💬 Support

- **DigitalOcean Support:** [docs.digitalocean.com](https://docs.digitalocean.com)
- **App Platform:** [App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)
- **Frontend Team:** peter@suqafuran.com

---

**Deployment Ready:** ✅  
**Last Updated:** 2026-06-27  
**Next Review:** 2026-07-27
