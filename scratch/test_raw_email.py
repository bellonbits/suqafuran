import sys
sys.path.append('/Users/mac/suqafuran/backend')
import os
os.chdir('/Users/mac/suqafuran/backend')

from app.core.config import settings

print("=== Testing Resend direct ===")
if settings.RESEND_API_KEY:
    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        print(f"Using Resend key: {settings.RESEND_API_KEY[:10]}...")
        res = resend.Emails.send({
            "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
            "to": ["petergatitu61@gmail.com"],
            "subject": "Suqafuran Resend Test",
            "html": "<h3>Resend is working!</h3>",
        })
        print(f"Resend success: {res}")
    except Exception as e:
        print(f"Resend failed: {e}")
else:
    print("No Resend API Key configured.")

print("\n=== Testing SMTP direct ===")
if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
    try:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        print(f"Connecting to SMTP {settings.SMTP_HOST}:{settings.SMTP_PORT} as {settings.SMTP_USER}...")
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Suqafuran SMTP Test"
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = "petergatitu61@gmail.com"
        msg.attach(MIMEText("<h3>SMTP is working!</h3>", "html"))
        
        if settings.SMTP_SSL:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, "petergatitu61@gmail.com", msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, "petergatitu61@gmail.com", msg.as_string())
        print("SMTP success!")
    except Exception as e:
        print(f"SMTP failed: {e}")
else:
    print("SMTP not fully configured.")
