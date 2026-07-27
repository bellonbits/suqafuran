# Week 1: Deployment Setup Guide

**Goal**: Get notification system running locally with all services configured  
**Estimated Time**: 4-6 hours  
**By End of Week**: Backend fully tested, ready for staging deployment

---

## Step 1: PostgreSQL Setup

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker run -d \
  --name suqafuran-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=suqafuran \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15

# Verify it's running
docker ps | grep postgres

# Connect to verify
psql -U postgres -h localhost -d suqafuran
```

### Option B: Local Installation (macOS)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb suqafuran

# Create user
psql -U postgres -c "CREATE USER suqafuran WITH PASSWORD 'password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE suqafuran TO suqafuran;"

# Verify
psql -U suqafuran -h localhost -d suqafuran -c "SELECT version();"
```

### Option C: Cloud Database (AWS RDS)

```
1. Go to AWS RDS Console
2. Create new PostgreSQL instance
   - Version: 15
   - Instance type: db.t3.micro (free tier)
   - Storage: 20 GB
   - Multi-AZ: No (for dev)
   - Public accessibility: Yes (for testing)
3. Note the endpoint: your-db.xxxxx.amazonaws.com
4. Update DATABASE_URL in .env:
   postgresql://username:password@endpoint:5432/suqafuran
```

### Create Tables

```bash
cd /Users/mac/suqafuran/backend

# Option 1: Using Python (automatic)
python -c "from database import Base, engine; from models import *; Base.metadata.create_all(bind=engine)"

# Option 2: Using Alembic (recommended for production)
alembic upgrade head

# Verify tables created
psql -U postgres -h localhost -d suqafuran -c "\dt"
```

Expected output:
```
               List of relations
 Schema |           Name           | Type  | Owner
--------+--------------------------+-------+----------
 public | delivery_assignments     | table | postgres
 public | device_tokens            | table | postgres
 public | issue_logs               | table | postgres
 public | notification_logs        | table | postgres
 public | notification_preferences | table | postgres
 public | notifications            | table | postgres
 public | order_items              | table | postgres
 public | orders                   | table | postgres
 public | payments                 | table | postgres
 public | realtime_events          | table | postgres
 ...
```

---

## Step 2: Redis Setup

### Option A: Using Docker (Recommended)

```bash
# Start Redis container
docker run -d \
  --name suqafuran-redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7 redis-server --appendonly yes

# Verify it's running
redis-cli ping
# Expected: PONG

# Check info
redis-cli info server
```

### Option B: Local Installation (macOS)

```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Verify
redis-cli ping
# Expected: PONG
```

### Option C: Cloud (Redis Cloud)

```
1. Go to redis.com
2. Create free account
3. Create new database
4. Copy connection string
5. Update REDIS_URL in .env:
   redis://default:password@host:port
```

### Verify Redis Connection

```bash
# Test Redis
redis-cli

# In Redis CLI:
> PING
PONG
> SET test "Hello"
OK
> GET test
"Hello"
> QUIT
```

---

## Step 3: Update Environment Configuration

### Create .env file

```bash
cd /Users/mac/suqafuran/backend

# Copy template
cp .env.phase4 .env

# Edit .env with your values
nano .env  # or your editor
```

### Complete .env Configuration

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/suqafuran

# JWT
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# M-Pesa
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/v1/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox

# Redis & Celery
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=notifications@suqafuran.com

# SMS (Africastalking)
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key

# Push (Firebase)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_JSON={"type": "service_account", ...}

# App Settings
DEBUG=True
APP_NAME=Suqafuran API
APP_VERSION=1.0.0
```

---

## Step 4: Get Third-Party Credentials

### 4.1: Resend (Email Service)

**Sign up for free:**
```
1. Go to https://resend.com
2. Sign up with email
3. Verify email
4. Go to Dashboard → API Keys
5. Copy your API key (starts with re_)
6. Add to .env:
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

**Create sender email:**
```
1. In Resend dashboard, go to Domains
2. Add domain or use: resend.com subdomain
3. For testing, use: notifications@suqafuran.resend.dev
4. Update .env:
   RESEND_FROM_EMAIL=notifications@suqafuran.resend.dev
```

**Test email sending:**
```python
# In Python shell
import resend

resend.api_key = "re_xxxxxxxxxxxxxxxxxxxx"

response = resend.Emails.send({
    "from": "notifications@suqafuran.resend.dev",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email</p>"
})

print(response)  # Should return email_id
```

### 4.2: Africastalking (SMS Service)

**Sign up for free:**
```
1. Go to https://africastalking.com
2. Sign up (African phone number required)
3. Go to Dashboard
4. Copy your API Key
5. Copy your Username
6. Add to .env:
   AFRICASTALKING_USERNAME=your_username
   AFRICASTALKING_API_KEY=your_api_key
```

**Add test numbers:**
```
1. Go to Settings → Sandbox (for testing)
2. Add test phone numbers in format: +254712345678
3. Use these numbers to test SMS
```

**Test SMS sending:**
```python
# In Python shell
import africastalking

at = africastalking.initialize(username="your_username", api_key="your_api_key")
sms = africastalking.SMS()

response = sms.send("Test message", ["+254712345678"])
print(response)  # Should return success
```

### 4.3: Firebase (Push Notifications)

**Create Firebase project:**
```
1. Go to https://firebase.google.com
2. Click "Get started"
3. Create new project (free)
4. Skip Google Analytics
5. Wait for project creation
```

**Download service account key:**
```
1. In Firebase console, click gear icon → Project Settings
2. Go to "Service Accounts" tab
3. Click "Generate New Private Key"
4. Save JSON file safely
5. Copy entire JSON content
6. Add to .env:
   FIREBASE_CREDENTIALS_JSON={"type": "service_account", ...}
```

**Initialize Firebase Admin SDK:**
```python
# In Python (will be automatic)
import firebase_admin
from firebase_admin import credentials, messaging

# SDK will use FIREBASE_CREDENTIALS_JSON from .env
# Already configured in notification_service.py
```

**Register device for testing:**
```
1. Install Firebase SDK in frontend: npm install firebase
2. Get device token from frontend
3. Call API: POST /api/v1/device-tokens/register
4. Use in testing
```

---

## Step 5: Start All Services

### Terminal 1: PostgreSQL & Redis

```bash
# Check services running
docker ps

# If not running:
docker start suqafuran-postgres suqafuran-redis

# Verify connections
psql -U postgres -h localhost -d suqafuran -c "SELECT 1"
redis-cli ping
```

### Terminal 2: Celery Worker

```bash
cd /Users/mac/suqafuran/backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Start Celery worker
celery -A celery_app worker --loglevel=info --queues=notifications

# You should see:
# - Connected to redis://localhost:6379/0
# - celery@hostname ready
```

### Terminal 3: FastAPI Backend

```bash
cd /Users/mac/suqafuran/backend

# Start backend server
python main.py

# You should see:
# Uvicorn running on http://127.0.0.1:8000
# Press CTRL+C to quit

# Or use uvicorn directly:
uvicorn main:app --reload --port 8000
```

### Terminal 4: Test API

```bash
# Check API health
curl http://localhost:8000/health

# Expected response:
# {"status":"ok"}
```

---

## Step 6: Test Backend Endpoints Locally

### 6.1: Authentication

**Sign up:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "phone": "+254712345678",
    "full_name": "Test User",
    "password": "testpass123"
  }'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "testuser@example.com",
    "full_name": "Test User"
  }
}
```

**Save token for testing:**
```bash
TOKEN="your_access_token_here"
```

### 6.2: Notification Endpoints

**Send notification:**
```bash
curl -X POST http://localhost:8000/api/v1/notifications/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order",
    "title": "Test Notification",
    "message": "This is a test notification",
    "channels": ["in-app"],
    "action_url": "/orders/123",
    "action_label": "View Order"
  }'

# Response:
{
  "success": true,
  "message": "Notification sent successfully",
  "notification_id": "notif_1234567890"
}
```

**List notifications:**
```bash
curl http://localhost:8000/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN"

# Response: [notification objects]
```

**Get preferences:**
```bash
curl http://localhost:8000/api/v1/notifications/preferences \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "id": "uuid",
  "user_id": "user_uuid",
  "email_notifications": true,
  "sms_notifications": true,
  "push_notifications": true,
  "in_app_notifications": true,
  "order_updates": true,
  "payment_updates": true,
  "delivery_updates": true,
  "promotions": true,
  "system_alerts": true
}
```

**Update preferences:**
```bash
curl -X PATCH http://localhost:8000/api/v1/notifications/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email_notifications": false,
    "sms_notifications": true,
    "promotions": false
  }'

# Response: updated preferences
```

### 6.3: Device Token Endpoints

**Register device token:**
```bash
curl -X POST http://localhost:8000/api/v1/device-tokens/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_device_token_12345",
    "device_type": "web",
    "device_name": "Chrome on MacBook"
  }'

# Response:
{
  "id": "uuid",
  "user_id": "user_uuid",
  "token": "test_device_token_12345",
  "device_type": "web",
  "device_name": "Chrome on MacBook",
  "is_active": true,
  "created_at": "2026-07-01T12:00:00"
}
```

**List device tokens:**
```bash
curl http://localhost:8000/api/v1/device-tokens \
  -H "Authorization: Bearer $TOKEN"
```

### 6.4: WebSocket Endpoints

**Check WebSocket status:**
```bash
curl http://localhost:8000/api/v1/websocket/status \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "user_id": "user_uuid",
  "is_online": false,
  "connection_count": 0,
  "connections": []
}
```

**Check server statistics:**
```bash
curl http://localhost:8000/api/v1/websocket/stats

# Response:
{
  "online_users": 0,
  "active_connections": 0,
  "active_subscriptions": 0,
  "timestamp": "2026-07-01T12:00:00"
}
```

---

## Step 7: Test Email/SMS/Push Delivery

### 7.1: Test Email (Resend)

**Send test email via API:**
```bash
curl -X POST http://localhost:8000/api/v1/notifications/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order",
    "title": "Order Confirmation",
    "message": "Your order has been confirmed",
    "channels": ["email"],
    "action_url": "/orders/123",
    "action_label": "View Order"
  }'
```

**Check Celery worker output:**
```
# In Celery terminal, you should see:
[2026-07-01 12:00:00,000: INFO/MainProcess] 
Received task: services.notification_service.send_notification_async
[2026-07-01 12:00:00,500: INFO/MainProcess]
Task succeeded
```

**Verify email received:**
```
1. Check your email inbox (may take 30 seconds)
2. Should have email from notifications@suqafuran.resend.dev
3. Subject: "Order Confirmation"
4. Contains action button: "View Order"
```

### 7.2: Test SMS (Africastalking)

**Send test SMS via API:**
```bash
curl -X POST http://localhost:8000/api/v1/notifications/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order",
    "title": "Order Confirmed",
    "message": "Your order has been confirmed by the seller",
    "channels": ["sms"]
  }'
```

**Verify SMS received:**
```
1. Check your phone (SMS test number from Africastalking)
2. Should receive SMS within 1-2 minutes
3. Message: "Order Confirmed: Your order has been confirmed..."
```

**Test with real number (if credentials set up):**
```bash
# Update the User's phone number first, then send SMS
```

### 7.3: Test Push Notifications (Firebase)

**Setup Firebase in frontend:**

```bash
cd /Users/mac/suqafuran/new-frontend

# Install Firebase
npm install firebase

# Create src/lib/firebase.ts
```

```typescript
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  projectId: "YOUR_PROJECT_ID",
  // ... other config from Firebase console
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export async function registerForPushNotifications() {
  try {
    const token = await getToken(messaging, {
      vapidKey: "YOUR_VAPID_KEY"
    });
    
    // Send to backend
    await fetch("/api/v1/device-tokens/register", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        device_type: "web",
        device_name: "Browser"
      })
    });
    
    return token;
  } catch (error) {
    console.error("Failed to get push token:", error);
  }
}
```

**Send push notification:**
```bash
curl -X POST http://localhost:8000/api/v1/notifications/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order",
    "title": "Order Ready",
    "message": "Your order is ready for pickup",
    "channels": ["push"],
    "action_url": "/orders/123"
  }'
```

**Verify push received:**
```
1. Browser should show notification
2. Message: "Order Ready - Your order is ready for pickup"
3. Click to navigate to /orders/123
```

---

## Step 8: Load Testing

### Test API Performance

```bash
# Install Apache Bench (macOS)
brew install httpd

# Simple load test (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:8000/health

# Expected output shows response times
```

### Test Celery Task Queue

```bash
# Monitor active tasks
celery -A celery_app inspect active

# Get stats
celery -A celery_app inspect stats

# View registered tasks
celery -A celery_app inspect registered
```

### Test WebSocket Connections

```javascript
// In browser console

// Create multiple connections
for (let i = 0; i < 10; i++) {
  const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/${token}`);
  ws.onopen = () => console.log(`Connection ${i} opened`);
  ws.onmessage = (e) => console.log(`Message ${i}:`, e.data);
}

// Check server stats
fetch('http://localhost:8000/api/v1/websocket/stats')
  .then(r => r.json())
  .then(d => console.log('Stats:', d))
```

---

## Troubleshooting

### PostgreSQL Connection Failed
```
Error: psycopg2.OperationalError: could not connect to server

Solution:
1. Check PostgreSQL running: docker ps
2. Check DATABASE_URL in .env
3. Verify credentials: psql -U postgres -h localhost
4. Restart: docker restart suqafuran-postgres
```

### Redis Connection Failed
```
Error: ConnectionError: Error 111 connecting to localhost:6379

Solution:
1. Check Redis running: redis-cli ping
2. Check REDIS_URL in .env
3. Verify port: redis-cli -p 6379
4. Restart: docker restart suqafuran-redis
```

### Celery Worker Not Running
```
Error: No worker named suqafuran@hostname

Solution:
1. Check Redis is running: redis-cli ping
2. Start Celery: celery -A celery_app worker
3. Check logs for errors
4. Verify CELERY_BROKER_URL in .env
```

### Email Not Sending
```
Error: Failed to send email

Solution:
1. Check RESEND_API_KEY in .env
2. Verify API key is valid (test in Resend dashboard)
3. Check RESEND_FROM_EMAIL is verified
4. Check Celery task logs for errors
```

### SMS Not Sending
```
Error: Failed to send SMS

Solution:
1. Check AFRICASTALKING_USERNAME in .env
2. Check AFRICASTALKING_API_KEY in .env
3. Verify phone number format: +254712345678
4. Check if number is in Africastalking sandbox
5. Check Celery task logs
```

---

## Checklist: Week 1 Complete

- [ ] PostgreSQL installed and running
- [ ] Redis installed and running
- [ ] Database tables created
- [ ] .env file configured
- [ ] Resend API key obtained and tested
- [ ] Africastalking credentials obtained and tested
- [ ] Firebase project created (optional for this week)
- [ ] Backend API running on localhost:8000
- [ ] Celery worker running and processing tasks
- [ ] All notification endpoints tested
- [ ] Email delivery tested and working
- [ ] SMS delivery tested and working
- [ ] Device token endpoints working
- [ ] WebSocket endpoints verified
- [ ] Load tested (basic)
- [ ] Ready for staging deployment

---

## Next: Week 2 - Staging Deployment

Once all Week 1 items are checked:
1. Deploy backend to staging server
2. Configure production secrets in staging
3. Run integration tests
4. Frontend WebSocket integration
5. End-to-end testing

---

## Commands Quick Reference

```bash
# Start all services (run in separate terminals)
docker start suqafuran-postgres suqafuran-redis
cd backend && celery -A celery_app worker --loglevel=info
cd backend && python main.py

# Test API
TOKEN="your_token"
curl -X POST http://localhost:8000/api/v1/notifications/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"order","title":"Test","message":"Test","channels":["in-app"]}'

# Check services
psql -U postgres -h localhost -d suqafuran -c "SELECT 1"
redis-cli ping
curl http://localhost:8000/health

# Monitor
celery -A celery_app inspect active
docker logs suqafuran-postgres
docker logs suqafuran-redis
```

---

**Estimated completion**: 4-6 hours  
**Success criteria**: All services running, all tests passing, emails/SMS delivering

Good luck! 🚀
