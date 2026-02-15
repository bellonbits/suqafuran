import logging
from pathlib import Path
from typing import Any, Dict
import emails
from emails.template import JinjaTemplate
from app.core.config import settings


def send_email(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    data: Dict[str, Any] = None,
) -> None:
    assert settings.EMAILS_ENABLED, "no provided configuration for email variables"
    message = emails.Message(
        subject=JinjaTemplate(subject_template),
        html=JinjaTemplate(html_template),
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    if settings.SMTP_SSL:
        smtp_options["ssl"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    try:
        response = message.send(to=email_to, render=data, smtp=smtp_options)
        logging.info(f"send email result: {response}")
        if response.status_code not in [250, 200]: # emails lib status codes can vary
            logging.error(f"Failed to send email: {response.status_code} - {response.error}")
    except Exception as e:
        logging.error(f"Exception during email sending: {str(e)}")


def send_test_email(email_to: str) -> None:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    with open(Path(settings.EMAIL_TEMPLATES_DIR) / "test_email.html") as f:
        template_str = f.read()
    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        data={"project_name": settings.PROJECT_NAME, "email": email_to},
    )


def send_verification_email(email_to: str, token: str) -> None:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Email Verification"
    html_content = f"""
    <p>Hello,</p>
    <p>Your verification code for {project_name} is: <strong>{token}</strong></p>
    <p>Please enter this code in the app to verify your account.</p>
    <p>This code will expire in {settings.EMAIL_VERIFICATION_EXPIRE_HOURS} hours.</p>
    """
    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_content,
    )


def send_reset_password_email(email_to: str, token: str) -> None:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password Reset"
    html_content = f"""
    <p>Hello,</p>
    <p>We received a request to reset your password for {project_name}.</p>
    <p>Your password reset code is: <strong>{token}</strong></p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>This code will expire in 1 hour.</p>
    """
    send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=html_content,
    )
