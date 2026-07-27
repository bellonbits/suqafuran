# Security Configuration Guide

**Status**: ⚠️ ACTION REQUIRED - Secrets Management

## Overview

This guide covers securing the Suqafuran application with proper environment variable management, secrets storage, and security best practices.

## ⚠️ CRITICAL: Secrets Currently Exposed!

**Issue**: The `.env` file is ignored by git but may still be committed or exposed in:
- Docker images
- Deployment logs
- CI/CD pipelines
- Git history

**Action Required**: 
1. ✅ [DONE] Updated `.env` with placeholder values
2. ✅ [DONE] Created `.env.example` template
3. ⏳ [TODO] Rotate all production credentials
4. ⏳ [TODO] Set up secrets management system

---

## Section 1: Local Development Setup

### Prerequisites
- Copy `.env.example` to `.env`
- Fill in your local development values
- Never commit `.env` to git

### Quick Start
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your local values
vim backend/.env
```

### Environment Variables
All sensitive values must be environment variables:

```bash
# DATABASE
POSTGRES_SERVER=localhost
POSTGRES_PASSWORD=secure_password_123

# JWT (Generate with: openssl rand -hex 32)
SECRET_KEY=your_random_hex_string_here

# API Keys
GOOGLE_CLIENT_SECRET=xxxx
AFRICASTALKING_API_KEY=xxxx
MPESA_CONSUMER_SECRET=xxxx
```

---

## Section 2: Production Secrets Management

### Option 1: AWS Secrets Manager (Recommended)
```bash
# Install AWS CLI
pip install awscli

# Create secret
aws secretsmanager create-secret \
    --name suqafuran/production \
    --secret-string file://prod-secrets.json

# Retrieve in code
import boto3
client = boto3.client('secretsmanager')
secret = client.get_secret_value(SecretId='suqafuran/production')
```

### Option 2: HashiCorp Vault
```bash
# Store secret
vault kv put secret/suqafuran/production \
    database_password=xxx \
    jwt_secret_key=xxx

# Retrieve in code
from hvac import Client
client = Client(url='http://vault:8200')
secret = client.secrets.kv.read_secret_version(path='suqafuran/production')
```

### Option 3: Docker Secrets (Swarm)
```bash
# Create secret
echo "secret_value" | docker secret create db_password -

# Use in service
docker service create \
    --secret db_password \
    app_service
```

### Option 4: GitHub Secrets
```bash
# Set in GitHub repo settings
Settings → Secrets → New repository secret

# Use in workflow
env:
  API_KEY: ${{ secrets.API_KEY }}
```

### Option 5: Environment Variables
```bash
# Docker
docker run -e SECRET_KEY="xxx" -e DATABASE_URL="xxx" app

# Kubernetes
apiVersion: v1
kind: Secret
metadata:
  name: suqafuran-secrets
type: Opaque
stringData:
  SECRET_KEY: xxx
  DATABASE_URL: xxx
```

---

## Section 3: Credentials Rotation

### Database Credentials
```bash
# 1. Connect to PostgreSQL
psql -U admin -d suqafuran_db

# 2. Change password
ALTER USER doadmin WITH PASSWORD 'new_secure_password';

# 3. Update environment variable
POSTGRES_PASSWORD=new_secure_password
DATABASE_URL=postgresql://doadmin:new_secure_password@host:port/db

# 4. Restart application
docker restart suqafuran_api
```

### API Keys (Google OAuth)
```bash
1. Go to: https://console.cloud.google.com
2. Select project
3. Go to APIs & Services → Credentials
4. Delete old credentials
5. Create new OAuth 2.0 Client ID
6. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
7. Restart application
```

### M-Pesa Credentials
```bash
1. Log in to: https://developer.safaricom.co.ke
2. Navigate to My Applications
3. Regenerate Consumer Key and Consumer Secret
4. Update MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET
5. Restart application
6. Test STK push endpoint
```

### JWT Secret
```bash
# Generate new secret
openssl rand -hex 32

# Update environment
SECRET_KEY=new_generated_secret

# Impact: All existing tokens become invalid!
# Users must log in again
```

---

## Section 4: .env File Security

### What Goes in .env
✅ Database passwords  
✅ API keys and secrets  
✅ JWT secret key  
✅ Payment credentials  
✅ Email passwords  

### What Never Goes in .env
❌ Commit to git  
❌ Share in emails  
❌ Log to console  
❌ Store in code  
❌ Push to Docker Hub  

### Git Security Checklist
```bash
# 1. Check if .env was ever committed
git log --all --full-history -- "*.env"

# 2. Check current status
git status | grep .env

# 3. Verify .gitignore
cat .gitignore | grep .env

# Output should show:
# .env
# .env.local
# .env.*.local
```

### Docker Security
```bash
# ❌ BAD: Bake secrets into image
FROM python:3.11
RUN echo "SECRET_KEY=xxx" > .env

# ✅ GOOD: Pass at runtime
docker run -e SECRET_KEY="xxx" \
  -e DATABASE_URL="xxx" \
  suqafuran-api

# ✅ BEST: Use docker-compose secrets
version: '3.8'
services:
  api:
    image: suqafuran-api
    secrets:
      - db_password
secrets:
  db_password:
    external: true
```

---

## Section 5: Logging & Monitoring Security

### Never Log Secrets
```python
# ❌ WRONG
import logging
logger.info(f"Connecting with password: {os.getenv('DB_PASSWORD')}")

# ✅ CORRECT
logger.info("Database connection established")

# ✅ MASK SECRETS
def mask_secret(secret, show_chars=4):
    return secret[:show_chars] + '*' * (len(secret) - show_chars)

logger.info(f"API Key: {mask_secret(api_key)}")
```

### Audit Logging
```python
# Log who accessed secrets
import logging
audit_logger = logging.getLogger('audit')

audit_logger.info(f"User {user_id} accessed payment credentials")
audit_logger.info(f"Secret {secret_name} was rotated")
```

---

## Section 6: API Key Scoping

### Principle of Least Privilege
Each service should have minimum required permissions:

```bash
# M-Pesa Key: Only STK push and query
MPESA_CONSUMER_KEY=restricted_to_stk_push_only

# Cloudinary: Only upload, no delete
CLOUDINARY_API_KEY=upload_only

# Google OAuth: Only authentication
GOOGLE_CLIENT_ID=web_client_only
```

### API Key Rate Limiting
```python
# backend/config.py
API_KEY_RATE_LIMITS = {
    'mpesa': '100_requests_per_hour',
    'cloudinary': '1000_uploads_per_day',
    'resend': '100_emails_per_hour',
}
```

---

## Section 7: Deployment Checklist

### Before Each Deployment
- [ ] All secrets in env vars, not .env
- [ ] No secrets in Docker images
- [ ] CI/CD pipelines don't log secrets
- [ ] Credentials rotated recently
- [ ] Audit logs enabled
- [ ] Monitoring alerts configured

### Production Secrets Validation
```bash
# Verify no secrets in source code
grep -r "AVNS_\|lip_pk_\|sk_live_" . --exclude-dir=.git

# Should return: No results

# Check Docker image
docker run --rm suqafuran-api cat .env
# Should fail: File not found
```

---

## Section 8: Emergency Procedures

### If Credentials Are Compromised

**Immediate Actions** (within 5 minutes):
```bash
# 1. Disable the compromised credential
# 2. Start key rotation process
# 3. Alert team members
# 4. Check audit logs for unauthorized access

# Disable M-Pesa API
curl -X POST https://api.safaricom.co.ke/disable \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Revoke Cloudinary API
curl -X POST https://api.cloudinary.com/api/v1.1/delete/resource \
  -d "public_id=*" \
  -d "api_key=$CLOUDINARY_API_KEY_OLD"
```

**Follow-up** (within 1 hour):
```bash
# 1. Generate new credentials
# 2. Update all environments
# 3. Restart all services
# 4. Verify logs for suspicious activity
# 5. Document incident
```

---

## Section 9: Best Practices Summary

### Development
- Use `.env.local` for local development only
- Use `.env.example` as template
- Rotate credentials quarterly
- Review logs for accidental secrets

### Testing
- Use fake/sandbox API keys
- Mock payment providers
- Never test with production keys
- Clean up test data

### Production
- Use secrets management system
- Rotate credentials monthly
- Monitor API usage
- Audit all access
- Enable encryption at rest and in transit

### CI/CD
- Never log environment variables
- Use secure secret storage
- Rotate deployment tokens monthly
- Audit who accessed secrets
- Test secret injection

---

## Implementation Timeline

| Task | Timeline | Priority |
|------|----------|----------|
| Create `.env.example` | ✅ Done | Critical |
| Update `.env` with placeholders | ✅ Done | Critical |
| Set up secrets manager | Today | Critical |
| Rotate production credentials | Today | Critical |
| Enable audit logging | Tomorrow | High |
| Set up monitoring alerts | Tomorrow | High |
| Document secret procedures | This week | Medium |
| Train team on security | This week | Medium |

---

## Resources

- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [HashiCorp Vault](https://www.vaultproject.io/)
- [12 Factor App](https://12factor.net/config)
- [Python Decouple](https://github.com/henriquebastos/python-decouple)

---

**Status**: ⏳ Awaiting Implementation  
**Next Step**: Set up secrets manager (AWS/Vault/GitHub)  
**Owner**: DevOps Team  
**Review Date**: 2026-07-11
