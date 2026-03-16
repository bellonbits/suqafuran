import secrets
import json
import redis
from typing import Optional
from app.core.config import settings


class EmailService:
    def __init__(self):
        # redis.from_url() is lazy — ping to confirm the connection works
        self.redis = None
        try:
            client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            client.ping()
            self.redis = client
            print("[Email] Redis connected OK")
        except Exception as e:
            print(f"[Email] Redis unavailable: {e}")
            self.redis = None

    def _redis_get(self, key: str) -> Optional[str]:
        if not self.redis:
            return None
        try:
            return self.redis.get(key)
        except Exception as e:
            print(f"[Email] Redis GET error: {e}")
            return None

    def _redis_set(self, key: str, value: str, ex: int) -> bool:
        if not self.redis:
            return False
        try:
            self.redis.set(key, value, ex=ex)
            return True
        except Exception as e:
            print(f"[Email] Redis SET error: {e}")
            return False

    def _redis_delete(self, key: str):
        if not self.redis:
            return
        try:
            self.redis.delete(key)
        except Exception as e:
            print(f"[Email] Redis DELETE error: {e}")

    def _redis_incr(self, key: str, ex: int):
        if not self.redis:
            return
        try:
            self.redis.incr(key)
            self.redis.expire(key, ex)
        except Exception as e:
            print(f"[Email] Redis INCR error: {e}")

    def generate_otp(self) -> str:
        return str(secrets.randbelow(900000) + 100000)

    def check_rate_limit(self, email: str) -> bool:
        if not self.redis:
            return True  # allow if Redis is down
        attempts = self._redis_get(f"otp_attempts:{email}")
        if attempts and int(attempts) >= 3:
            return False
        return True

    def increment_rate_limit(self, email: str):
        self._redis_incr(f"otp_attempts:{email}", ex=300)

    def send_verification_code(self, email: str) -> bool:
        if not self.check_rate_limit(email):
            print(f"[Email] Rate limit exceeded for {email}")
            return False

        code = self.generate_otp()

        if self.redis:
            ok = self._redis_set(f"otp:{email}", code, ex=300)
            if not ok and settings.ENVIRONMENT == "production":
                return False
        else:
            if settings.ENVIRONMENT == "production":
                print(f"[Email] Redis unavailable in production — cannot store OTP for {email}")
                return False
            code = "000000"

        self.increment_rate_limit(email)

        html_body = f"""
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

        # Try Resend first
        if settings.RESEND_API_KEY:
            try:
                import resend
                resend.api_key = settings.RESEND_API_KEY
                resend.Emails.send({
                    "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
                    "to": [email],
                    "subject": "Your Suqafuran verification code",
                    "html": html_body,
                })
                print(f"[Email] OTP sent via Resend to {email}")
                return True
            except Exception as e:
                print(f"[Email] Resend failed ({e}), trying SMTP fallback...")

        # SMTP fallback
        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                import smtplib
                from email.mime.multipart import MIMEMultipart
                from email.mime.text import MIMEText
                msg = MIMEMultipart("alternative")
                msg["Subject"] = "Your Suqafuran verification code"
                msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
                msg["To"] = email
                msg.attach(MIMEText(html_body, "html"))
                if settings.SMTP_SSL:
                    with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.sendmail(settings.SMTP_USER, email, msg.as_string())
                else:
                    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                        if settings.SMTP_TLS:
                            server.starttls()
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.sendmail(settings.SMTP_USER, email, msg.as_string())
                print(f"[Email] OTP sent via SMTP to {email}")
                return True
            except Exception as e:
                print(f"[Email] SMTP failed: {e}")

        if settings.ENVIRONMENT != "production":
            print(f"[Email] Dev fallback OTP for {email}: {code}")
            return True

        return False

    def check_verification_code(self, email: str, code: str) -> bool:
        if not self.redis:
            if settings.ENVIRONMENT != "production":
                return code == "000000"
            return False

        stored = self._redis_get(f"otp:{email}")
        if stored and stored == code:
            self._redis_delete(f"otp:{email}")
            return True
        return False

    def store_pending_signup(self, email: str, signup_data: dict) -> bool:
        if not self.redis:
            if settings.ENVIRONMENT != "production":
                # In dev without Redis, skip storage (OTP is 000000 anyway)
                return True
            return False
        return self._redis_set(f"signup:{email}", json.dumps(signup_data), ex=600)

    def get_pending_signup(self, email: str) -> Optional[dict]:
        data = self._redis_get(f"signup:{email}")
        return json.loads(data) if data else None

    def delete_pending_signup(self, email: str):
        self._redis_delete(f"signup:{email}")


email_service = EmailService()
