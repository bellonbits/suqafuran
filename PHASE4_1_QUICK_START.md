# Phase 4.1: Quick Start Guide

Get notifications running locally in 5 minutes.

## 1. Prerequisites

```bash
# Check Python
python --version  # 3.9+

# Check PostgreSQL
psql --version    # 12+

# Check Redis
redis-cli --version  # 6+
```

## 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## 3. Setup Environment

```bash
cp .env.phase4 .env
```

Edit `.env`:
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/suqafuran

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Africastalking (SMS)
AFRICASTALKING_USERNAME=username
AFRICASTALKING_API_KEY=api_key

# Firebase (optional)
FIREBASE_PROJECT_ID=project-id

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## 4. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7

# Or locally
redis-server
```

## 5. Create Database Tables

```bash
# Option 1: Using Python
python -c "from database import Base, engine; from models import *; Base.metadata.create_all(bind=engine)"

# Option 2: Using psql
psql -U postgres -d suqafuran < schema.sql
```

## 6. Start Services (3 terminals)

**Terminal 1: Backend API**
```bash
cd backend
python main.py
# or
uvicorn main:app --reload --port 8000
```

**Terminal 2: Celery Worker**
```bash
cd backend
celery -A celery_app worker --loglevel=info --queues=notifications
```

**Terminal 3: Test Endpoint**
```bash
# Wait for API to start, then:
curl -X POST http://localhost:8000/api/v1/notifications/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order",
    "title": "Test Notification",
    "message": "This is a test",
    "channels": ["in-app"],
    "action_url": "/orders/123",
    "action_label": "View Order"
  }'
```

## 7. Verify It Works

Check API responses:
```bash
# Get notifications
curl http://localhost:8000/api/v1/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get preferences
curl http://localhost:8000/api/v1/notifications/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Check Celery:
```bash
# In another terminal
celery -A celery_app inspect active
```

## 8. Get JWT Token

```bash
# Sign up
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "+254712345678",
    "full_name": "Test User",
    "password": "password123"
  }'

# Copy the access_token from response
# Use it in Authorization header: Bearer <token>
```

## 9. Send Real Notifications (With Credentials)

If you have Resend, Africastalking, or Firebase credentials:

```bash
# Send via all channels
curl -X POST http://localhost:8000/api/v1/notifications/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order",
    "title": "Order Confirmed",
    "message": "Your order is being prepared",
    "channels": ["email", "sms", "push", "in-app"],
    "action_url": "/orders/123",
    "action_label": "View Order"
  }'
```

Watch Celery worker process the task!

## Troubleshooting

### API not starting?
```bash
# Check port not in use
lsof -i :8000

# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +

# Try different port
python main.py --port 8001
```

### Redis not found?
```bash
# Check Redis running
redis-cli ping  # Should return PONG

# Start Redis
redis-server

# Or Docker
docker run -d -p 6379:6379 redis:7
```

### Database error?
```bash
# Check PostgreSQL running
psql postgres

# Create database
createdb suqafuran

# Create tables
python -c "from database import Base, engine; from models import *; Base.metadata.create_all(bind=engine)"
```

### Celery not processing tasks?
```bash
# Check broker connection
celery -A celery_app inspect ping

# Check active tasks
celery -A celery_app inspect active

# Restart worker with verbose logging
celery -A celery_app worker --loglevel=debug
```

## Next Steps

- ✅ Test locally with in-app notifications
- ✅ Get Resend, Africastalking, Firebase credentials
- ✅ Configure them in .env
- ✅ Test email, SMS, push
- ✅ Deploy to staging
- ✅ Run comprehensive tests
- ✅ Deploy to production

## Documentation

Full documentation: [PHASE4_1_BACKEND_NOTIFICATIONS.md](PHASE4_1_BACKEND_NOTIFICATIONS.md)

## Need Help?

Check the troubleshooting section in the full documentation or review the test examples.
