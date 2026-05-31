import sys
sys.path.append('/Users/mac/suqafuran/backend')
import os
os.chdir('/Users/mac/suqafuran/backend')

from app.core.config import settings
print(f"ENVIRONMENT: {settings.ENVIRONMENT}")
print(f"RESEND_API_KEY: {settings.RESEND_API_KEY}")
print(f"SMTP_HOST: {settings.SMTP_HOST}")
print(f"SMTP_USER: {settings.SMTP_USER}")

from app.services.email_service import email_service

print("Testing send_verification_code to petergatitu61@gmail.com...")
success = email_service.send_verification_code("petergatitu61@gmail.com")
print(f"Result: {success}")
