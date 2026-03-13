import secrets
import json
import redis
from typing import Optional
from app.core.config import settings


class EmailService:
    def __init__(self):
        # Redis for OTP storage
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as e:
            print(f"[Email] Redis connection error: {e}")
            self.redis = None

    def generate_otp(self) -> str:
        return str(secrets.randbelow(900000) + 100000)

    def check_rate_limit(self, email: str) -> bool:
        if not self.redis:
            return True
        key = f"otp_attempts:{email}"
        attempts = self.redis.get(key)
        if attempts and int(attempts) >= 3:
            return False
        return True

    def increment_rate_limit(self, email: str):
        if not self.redis:
            return
        key = f"otp_attempts:{email}"
        self.redis.incr(key)
        self.redis.expire(key, 300)

    def send_verification_code(self, email: str) -> bool:
        if not self.check_rate_limit(email):
            print(f"[Email] Rate limit exceeded for {email}")
            return False

        code = self.generate_otp()

        if self.redis:
            self.redis.set(f"otp:{email}", code, ex=300)
        else:
            if settings.ENVIRONMENT == "production":
                return False
            code = "000000"

        self.increment_rate_limit(email)

        if not settings.RESEND_API_KEY:
            print(f"[Email] No RESEND_API_KEY — dev OTP for {email}: {code}")
            return True

        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send({
                "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
                "to": [email],
                "subject": "Your Suqafuran verification code",
                "html": f"""
                <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
                  <h2 style="color:#1a1a1a;">Your verification code</h2>
                  <p style="color:#555;">Use the code below to verify your account. It expires in 5 minutes.</p>
                  <div style="background:#f4f4f4;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                    <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a1a1a;">{code}</span>
                  </div>
                  <p style="color:#999;font-size:13px;">If you didn't request this, ignore this email.</p>
                  <p style="color:#999;font-size:13px;">&mdash; The Suqafuran Team</p>
                </div>
                """
            })
            print(f"[Email] OTP sent to {email}")
            return True
        except Exception as e:
            print(f"[Email] Failed to send email: {e}")
            if settings.ENVIRONMENT == "production":
                return False
            print(f"[Email] Dev fallback OTP for {email}: {code}")
            return True

    def check_verification_code(self, email: str, code: str) -> bool:
        if not self.redis:
            if settings.ENVIRONMENT == "development":
                return code == "000000"
            return False

        stored = self.redis.get(f"otp:{email}")
        if stored and stored == code:
            self.redis.delete(f"otp:{email}")
            return True
        return False

    def store_pending_signup(self, email: str, signup_data: dict) -> bool:
        if not self.redis:
            return False
        try:
            self.redis.set(f"signup:{email}", json.dumps(signup_data), ex=600)
            return True
        except Exception as e:
            print(f"[Email] Error storing signup: {e}")
            return False

    def get_pending_signup(self, email: str) -> Optional[dict]:
        if not self.redis:
            return None
        try:
            data = self.redis.get(f"signup:{email}")
            return json.loads(data) if data else None
        except Exception:
            return None

    def delete_pending_signup(self, email: str):
        if self.redis:
            self.redis.delete(f"signup:{email}")


email_service = EmailService()
