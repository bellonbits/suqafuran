import secrets
import json
import redis
from typing import Optional
from app.core.config import settings


class EmailService:
    def __init__(self):
        self.redis = None
        self._connect()

    def _connect(self):
        try:
            client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            client.ping()
            self.redis = client
            print("[Email] Redis connected OK")
        except Exception as e:
            print(f"[Email] Redis unavailable: {e}")
            self.redis = None

    def _ensure_redis(self):
        """Reconnect if the connection was lost or never established."""
        if self.redis is not None:
            try:
                self.redis.ping()
                return
            except Exception:
                self.redis = None
        self._connect()

    def _redis_get(self, key: str) -> Optional[str]:
        self._ensure_redis()
        if not self.redis:
            return None
        try:
            return self.redis.get(key)
        except Exception as e:
            print(f"[Email] Redis GET error: {e}")
            self.redis = None
            return None

    def _redis_set(self, key: str, value: str, ex: int) -> bool:
        self._ensure_redis()
        if not self.redis:
            return False
        try:
            self.redis.set(key, value, ex=ex)
            return True
        except Exception as e:
            print(f"[Email] Redis SET error: {e}")
            self.redis = None
            return False

    def _redis_delete(self, key: str):
        self._ensure_redis()
        if not self.redis:
            return
        try:
            self.redis.delete(key)
        except Exception as e:
            print(f"[Email] Redis DELETE error: {e}")
            self.redis = None

    def _redis_incr(self, key: str, ex: int):
        self._ensure_redis()
        if not self.redis:
            return
        try:
            self.redis.incr(key)
            self.redis.expire(key, ex)
        except Exception as e:
            print(f"[Email] Redis INCR error: {e}")
            self.redis = None

    def _get_base_template(self, title: str, subtitle: str, content: str) -> str:
        """Professional Suqafuran email wrapper."""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f9fc; padding: 40px 0; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%); padding: 48px 20px; text-align: center; color: white;">
              <img src="https://suqafuran.com/logo.png" alt="Suqafuran" style="height: 56px; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Suqafuran</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; font-weight: 500;">Suuqa Loogu Kalsoon Yahay ee Afrika</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 48px 40px; color: #334155; line-height: 1.6;">
              <h2 style="margin-top: 0; color: #1e293b; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">{title}</h2>
              <p style="font-size: 16px; margin-bottom: 32px;">{subtitle}</p>
              {content}
              <p style="margin-top: 32px; font-size: 14px; color: #94a3b8; font-style: italic;">
                Mahadsanid,<br>
                <strong>Kooxda Suqafuran</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 48px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 14px; font-weight: 700; color: #64748b; margin-bottom: 24px;">Nala xiriir</p>
              <div style="margin-bottom: 32px;">
                <a href="https://www.instagram.com/suqafuran/" style="margin: 0 10px; text-decoration: none; display: inline-block;">
                  <img src="https://suqafuran.com/icons/instagram.png" alt="Instagram" width="24" height="24">
                </a>
                <a href="https://x.com/suqafuran" style="margin: 0 10px; text-decoration: none; display: inline-block;">
                  <img src="https://suqafuran.com/icons/twitter.png" alt="X" width="24" height="24">
                </a>
                <a href="https://www.tiktok.com/@suqafuran_" style="margin: 0 10px; text-decoration: none; display: inline-block;">
                  <img src="https://suqafuran.com/icons/tiktok.png" alt="TikTok" width="24" height="24">
                </a>
              </div>
              
              <div style="font-size: 12px; color: #94a3b8; line-height: 1.8;">
                <p style="margin: 0; font-weight: 600; color: #64748b;">Suqafuran Limited</p>
                <p style="margin: 4px 0 0 0;">Flat 13, Krishna Pointe Riverside Lane, Westlands Nairobi</p>
                <p style="margin: 4px 0 0 0;">&copy; 2026 Suqafuran. Xuquuqda oo dhan waa la dhawray.</p>
              </div>
              
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #eef2f6;">
                <a href="mailto:support@suqafuran.com" style="color: #f97316; font-weight: 800; text-decoration: none; font-size: 13px;">support@suqafuran.com</a>
              </div>
            </div>
          </div>
        </body>
        </html>
        """

    def generate_otp(self) -> str:
        return str(secrets.randbelow(900000) + 100000)

    def check_rate_limit(self, email: str) -> bool:
        self._ensure_redis()
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

        self._ensure_redis()
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

        <div style="background: #fff7ed; border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0; border: 1px solid #ffedd5;">
          <span style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #ea580c; font-family: monospace;">{code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center;">Koodhkani wuxuu dhacayaa 5 daqiiqo gudahood. Haddii aadan codsan koodkan, waad iska indho-tiri kartaa iimaylkan.</p>
        """

        html_body = self._get_base_template(
            title="Xaqiiji koontadaada",
            subtitle="Ku soo dhawaada Suqafuran! Fadlan isticmaal koodka xaqiijinta ee hoos ku qoran si aad u dhammaystirto diiwaangelintaada.",
            content=otp_content
        )

        # Try Resend first
        if settings.RESEND_API_KEY:
            try:
                import resend
                resend.api_key = settings.RESEND_API_KEY
                resend.Emails.send({
                    "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
                    "to": [email],
                    "subject": "Koodhka xaqiijinta ee Suqafuran",
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
                msg["Subject"] = "Koodhka xaqiijinta ee Suqafuran"
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

    def send_reset_code(self, email: str, code: str) -> bool:
        reset_content = f"""
        <div style="background: #fff7ed; border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0; border: 1px solid #ffedd5;">
          <span style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #ea580c; font-family: monospace;">{code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center;">Koodhkani wuxuu dhacayaa 1 saac gudahood. Haddii aadan codsan dib-u-dejinta erayga sirta ah, fadlan xaqiiji amniga koontadaada.</p>
        """

        html_body = self._get_base_template(
            title="Dib u deji eraygaaga sirta ah",
            subtitle="Waxaan helnay codsi ah in dib loo dejiyo eraygaaga sirta ah ee Suqafuran. Isticmaal koodka hoose si aad u sii socoto.",
            content=reset_content
        )

        if settings.RESEND_API_KEY:
            try:
                import resend
                resend.api_key = settings.RESEND_API_KEY
                resend.Emails.send({
                    "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
                    "to": [email],
                    "subject": "Dib u deji erayga sirta ah ee Suqafuran",
                    "html": html_body,
                })
                print(f"[Email] Reset code sent via Resend to {email}")
                return True
            except Exception as e:
                print(f"[Email] Resend failed for reset code ({e})")

        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                import smtplib
                from email.mime.multipart import MIMEMultipart
                from email.mime.text import MIMEText
                msg = MIMEMultipart("alternative")
                msg["Subject"] = "Dib u deji erayga sirta ah ee Suqafuran"
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
                print(f"[Email] Reset code sent via SMTP to {email}")
                return True
            except Exception as e:
                print(f"[Email] SMTP failed for reset code: {e}")

        print(f"[Email] No email provider available for reset code to {email}")
        return False

    def check_verification_code(self, email: str, code: str) -> bool:
        self._ensure_redis()
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
