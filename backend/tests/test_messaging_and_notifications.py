import unittest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from sqlmodel import Session, create_engine, SQLModel
from datetime import datetime

import base64
from services.websocket_service import ConnectionManager
from app.models.message import Message
from app.models.notification import Notification
from app.models.user import User
from app.models.email_log import EmailLog
from app.api.api_v1.endpoints.content import track_email_click
from app.crud.crud_message import crud_message
from app.crud.crud_notification import crud_notification


class TestWebSocketManagerThreadSafety(unittest.TestCase):
    """Test WebSocket thread-safe dispatches from synchronous endpoints."""

    def setUp(self):
        self.manager = ConnectionManager()

    def test_broadcast_when_no_loop_or_disconnected_does_not_crash(self):
        # Even if no event loop or no active sockets, calling thread-safe dispatch should not raise
        try:
            self.manager.broadcast_to_user_from_thread(user_id=999, message={"event": "test"})
            self.manager.broadcast_to_channel_from_thread(channel="chat:1:2", message={"event": "test"})
        except Exception as e:
            self.fail(f"broadcast_from_thread raised unexpected exception: {e}")

    def test_broadcast_with_event_loop_dispatches_task(self):
        mock_loop = MagicMock()
        mock_loop.is_running.return_value = True
        self.manager.set_event_loop(mock_loop)

        def mock_side_effect(coro, loop):
            coro.close()
            return MagicMock()
        
        with patch.object(asyncio, "run_coroutine_threadsafe", side_effect=mock_side_effect) as mock_threadsafe:
            self.manager.broadcast_to_user_from_thread(user_id=42, message={"type": "new_message", "text": "hello"})
            mock_threadsafe.assert_called_once()

    def test_channel_broadcast_with_event_loop(self):
        mock_loop = MagicMock()
        mock_loop.is_running.return_value = True
        self.manager.set_event_loop(mock_loop)

        def mock_side_effect(coro, loop):
            coro.close()
            return MagicMock()

        with patch.object(asyncio, "run_coroutine_threadsafe", side_effect=mock_side_effect) as mock_threadsafe:
            self.manager.broadcast_to_channel_from_thread(channel="chat:user:10", message={"type": "chat"})
            mock_threadsafe.assert_called_once()


class TestMessageAndNotificationCRUD(unittest.TestCase):
    """Test CRUD operations ensuring conversation payloads and notifications are properly formatted."""

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        User.__table__.create(cls.engine)
        Message.__table__.create(cls.engine)
        Notification.__table__.create(cls.engine)

        EmailLog.__table__.create(cls.engine)

    def setUp(self):
        self.session = Session(self.engine)
        # Create test users
        self.user1 = User(
            id=101,
            email="buyer@example.com",
            phone="254700000001",
            full_name="Alice Buyer",
            hashed_password="pw",
            is_active=True
        )
        self.user2 = User(
            id=102,
            email="seller@example.com",
            phone="254700000002",
            full_name="Bob Seller",
            hashed_password="pw",
            is_active=True
        )
        self.session.add(self.user1)
        self.session.add(self.user2)
        self.session.commit()

    def tearDown(self):
        self.session.rollback()
        for tbl in (Message, Notification, EmailLog, User):
            self.session.execute(tbl.__table__.delete())
        self.session.commit()
        self.session.close()

    def test_message_creation_and_conversations_format(self):
        now = datetime.utcnow()
        msg = Message(
            sender_id=101,
            receiver_id=102,
            content="Is this item available?",
            created_at=now,
            is_read=False
        )
        self.session.add(msg)
        self.session.commit()
        self.session.refresh(msg)

        self.assertEqual(msg.id is not None, True)
        self.assertEqual(msg.content, "Is this item available?")

        # Test conversation retrieval for receiver (Bob Seller)
        conversations = crud_message.get_user_conversations(self.session, user_id=102)
        self.assertEqual(len(conversations), 1)
        conv = conversations[0]

        # Verify both last_message_at and last_message_time exist for frontend compatibility
        self.assertEqual(conv["other_user_id"], 101)
        self.assertEqual(conv["other_user_name"], "Alice Buyer")
        self.assertEqual(conv["last_message"], "Is this item available?")
        self.assertIn("last_message_at", conv)
        self.assertIn("last_message_time", conv)
        self.assertEqual(conv["last_message_at"], conv["last_message_time"])
        self.assertEqual(conv["unread_count"], 1)

    def test_notification_creation_for_in_app_delivery(self):
        notif = crud_notification.create(
            self.session,
            obj_in={
                "type": "message",
                "data": {
                    "message": "New message from Alice Buyer: Is this item available?...",
                    "sender_id": 101,
                    "action_url": "/messages?userId=101"
                }
            },
            user_id=102
        )
        self.assertEqual(notif.user_id, 102)
        self.assertEqual(notif.type, "message")
        self.assertFalse(notif.is_read)
        self.assertEqual(notif.data["action_url"], "/messages?userId=101")

    def test_track_email_click_with_base64_url_safe_param(self):
        log = EmailLog(
            user_id=101,
            email="buyer@example.com",
            email_type="marketing",
            subject="Test",
            status="sent",
            tracking_token="safe_token_123"
        )
        self.session.add(log)
        self.session.commit()

        target = "https://suqafuran.com/settings/notifications"
        encoded = base64.urlsafe_b64encode(target.encode()).decode().rstrip("=")

        resp = track_email_click(token="safe_token_123", r=encoded, db=self.session)
        self.assertEqual(resp.headers["location"], target)

        self.session.refresh(log)
        self.assertEqual(log.status, "clicked")
        self.assertIsNotNone(log.clicked_at)

    def test_track_email_click_prevents_untrusted_open_redirect(self):
        log = EmailLog(
            user_id=101,
            email="buyer@example.com",
            email_type="marketing",
            subject="Test",
            status="sent",
            tracking_token="phish_token_123"
        )
        self.session.add(log)
        self.session.commit()

        target = "https://evil-phishing-site.com/steal-login"
        encoded = base64.urlsafe_b64encode(target.encode()).decode().rstrip("=")

        resp = track_email_click(token="phish_token_123", r=encoded, db=self.session)
        self.assertIn("suqafuran.com", resp.headers["location"])
        self.assertNotIn("evil-phishing-site.com", resp.headers["location"])


if __name__ == "__main__":
    unittest.main()
