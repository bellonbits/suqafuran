"""
Kafka Email Notifier - Sends event summaries to admin email
Consumes from monitoring topics and sends formatted emails
"""

import json
import logging
import threading
from typing import Optional, Dict, Any
from datetime import datetime
from confluent_kafka import Consumer, KafkaError
from app.core.config import settings
from app.services.email_service import email_service

logger = logging.getLogger("kafka_email_notifier")

ADMIN_EMAIL = "petergatitu61@gmail.com"


class KafkaEmailNotifier:
    """Sends Kafka events to admin email."""

    def __init__(self):
        self.consumer: Optional[Consumer] = None
        self.thread: Optional[threading.Thread] = None
        self.running = False
        self.monitoring_topics = [
            settings.KAFKA_TOPIC_SIGNUP,
            settings.KAFKA_TOPIC_SIGNIN,
            settings.KAFKA_TOPIC_TRACKING,
            settings.KAFKA_TOPIC_CHECKOUT,
            settings.KAFKA_TOPIC_UPLOAD_FAILURES,
        ]

    def start(self):
        """Start the email notifier in a background thread."""
        if self.running:
            logger.warning("Email notifier already running")
            return

        self.running = True
        self.thread = threading.Thread(target=self._consume_loop, daemon=True)
        self.thread.start()
        logger.info(f"✉️  Kafka Email Notifier started → {ADMIN_EMAIL}")

    def stop(self):
        """Stop the email notifier."""
        self.running = False
        if self.consumer:
            self.consumer.close()
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("✉️  Kafka Email Notifier stopped")

    def _consume_loop(self):
        """Main consumer loop - runs in background thread."""
        try:
            config = {
                'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
                'group.id': 'suqafuran-email-notifier',
                'auto.offset.reset': 'latest',
                'enable.auto.commit': True,
                'session.timeout.ms': 6000,
            }

            self.consumer = Consumer(config)
            self.consumer.subscribe(self.monitoring_topics)
            logger.info(f"📧 Subscribed to monitoring topics for email notifications")

            while self.running:
                msg = self.consumer.poll(timeout=1.0)

                if msg is None:
                    continue

                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        logger.error(f"Kafka error: {msg.error()}")
                        continue

                # Send email for this event
                self._send_event_email(msg)

        except Exception as e:
            logger.error(f"Email notifier error: {e}", exc_info=True)
        finally:
            if self.consumer:
                self.consumer.close()

    def _send_event_email(self, msg):
        """Send an email for a Kafka event."""
        try:
            topic = msg.topic()
            partition = msg.partition()
            offset = msg.offset()

            # Parse event payload
            try:
                event = json.loads(msg.value().decode('utf-8'))
            except:
                return

            event_type = event.get('event_type', 'unknown')
            user_id = event.get('user_id')
            timestamp = event.get('timestamp')
            payload = event.get('payload', {})

            # Format email based on event type
            subject, body_html = self._format_email(topic, event_type, payload, user_id, timestamp)

            # Send email
            email_service.send_email(
                subject=subject,
                email_to=ADMIN_EMAIL,
                body=body_html,
            )

            logger.info(f"📧 Email sent for {event_type} (user_id: {user_id})")

        except Exception as e:
            logger.error(f"Failed to send email for event: {e}")

    def _format_email(self, topic: str, event_type: str, payload: Dict[str, Any],
                      user_id: Optional[int], timestamp: str) -> tuple:
        """Format email subject and body for different event types."""

        ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M:%S') if timestamp else 'N/A'

        if 'signup' in event_type:
            subject = f"🆕 New User Signup - {payload.get('email', 'Unknown')}"
            body_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #4CAF50;">🆕 New User Signup</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>User ID</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{user_id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Email</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('email', 'N/A')}</td>
                    </tr>
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Phone</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('phone', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Promo Code</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('promo_code', 'None')}</td>
                    </tr>
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Timestamp</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{ts}</td>
                    </tr>
                </table>
            </body>
            </html>
            """

        elif 'signin' in event_type:
            subject = f"🔐 User Login - {payload.get('email', 'Unknown')}"
            body_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #2196F3;">🔐 User Login</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>User ID</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{user_id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Email</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('email', 'N/A')}</td>
                    </tr>
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Auth Method</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('auth_method', 'N/A').upper()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Timestamp</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{ts}</td>
                    </tr>
                </table>
            </body>
            </html>
            """

        elif 'listing_created' in event_type:
            subject = f"📝 New Listing Created - {payload.get('title', 'Unknown')}"
            body_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #FF9800;">📝 New Listing Created</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Listing ID</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('listing_id', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Title</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('title', 'N/A')}</td>
                    </tr>
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Price</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">KES {payload.get('price', 0):,.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Category</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('category', 'N/A')}</td>
                    </tr>
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Seller ID</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{user_id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Timestamp</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{ts}</td>
                    </tr>
                </table>
            </body>
            </html>
            """

        elif 'checkout' in event_type:
            subject = f"🛒 Checkout Event - KES {payload.get('amount', 0):,.2f}"
            body_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #4CAF50;">🛒 Checkout Event</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Order ID</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('order_id', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Amount</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">KES {payload.get('amount', 0):,.2f}</td>
                    </tr>
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Status</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('status', 'N/A').upper()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Customer ID</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{user_id}</td>
                    </tr>
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Timestamp</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{ts}</td>
                    </tr>
                </table>
            </body>
            </html>
            """

        elif 'upload' in event_type and 'failed' in event_type:
            subject = f"⚠️ Upload Failed - {payload.get('filename', 'Unknown')}"
            body_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #F44336;">⚠️ Upload Failed</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>User ID</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{user_id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Filename</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('filename', 'N/A')}</td>
                    </tr>
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>File Type</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{payload.get('file_type', 'N/A').upper()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Endpoint</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;"><code>{payload.get('endpoint', 'N/A')}</code></td>
                    </tr>
                    <tr style="background-color: #f2f2f2;">
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Error</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;"><code style="color: red;">{payload.get('error', 'N/A')}</code></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><b>Timestamp</b></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">{ts}</td>
                    </tr>
                </table>
            </body>
            </html>
            """

        else:
            subject = f"📊 Marketplace Event - {event_type}"
            body_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2>📊 Marketplace Event</h2>
                <p><b>Event Type:</b> {event_type}</p>
                <p><b>User ID:</b> {user_id}</p>
                <p><b>Timestamp:</b> {ts}</p>
                <h3>Payload:</h3>
                <pre style="background-color: #f2f2f2; padding: 10px; border-radius: 4px;">
{json.dumps(payload, indent=2)}
                </pre>
            </body>
            </html>
            """

        return subject, body_html


# Global email notifier instance
email_notifier = KafkaEmailNotifier()
