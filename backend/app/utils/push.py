"""
FCM push notification sender using firebase-admin SDK.

Requires:
  - pip install firebase-admin
  - FIREBASE_CREDENTIALS_PATH env var pointing to your serviceAccountKey.json
    OR FIREBASE_CREDENTIALS_JSON env var with the JSON string directly.

Until google-services.json / credentials are added, all sends are no-ops
(logged as warnings, never crash the request).
"""

import os
import json
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)

_firebase_app = None


def _get_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        import firebase_admin
        from firebase_admin import credentials

        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        elif cred_json:
            cred = credentials.Certificate(json.loads(cred_json))
        else:
            default_paths = [
                "/Users/mac/suqafuran/serviceAccountKey.json",
                "/Users/mac/suqafuran/backend/serviceAccountKey.json",
            ]
            found_path = next((p for p in default_paths if os.path.exists(p)), None)
            if found_path:
                cred = credentials.Certificate(found_path)
            else:
                logger.warning("Push: Firebase credentials not configured — push disabled.")
                return None

        if not firebase_admin._apps:
            _firebase_app = firebase_admin.initialize_app(cred)
        else:
            _firebase_app = firebase_admin.get_app()

        return _firebase_app

    except ImportError:
        logger.warning("Push: firebase-admin not installed — push disabled.")
        return None
    except Exception as e:
        logger.error(f"Push: Firebase init failed — {e}")
        return None


def send_push(
    fcm_token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    image_url: Optional[str] = None,
) -> bool:
    """
    Send a push notification to a single device.
    Returns True on success, False on any failure (never raises).
    """
    if not fcm_token:
        return False

    app = _get_app()
    if app is None:
        return False

    try:
        from firebase_admin import messaging

        data_payload = {str(k): str(v) for k, v in (data or {}).items()}

        msg = messaging.Message(
            token=fcm_token,
            notification=messaging.Notification(
                title=title,
                body=body,
                image=image_url,
            ),
            data=data_payload,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    sound="default",
                    channel_id="suqafuran_alerts",
                    priority="high",
                    default_sound=True,
                    default_vibrate_timings=True,
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound="default",
                        badge=1,
                        alert=messaging.ApsAlert(
                            title=title,
                            body=body,
                        ),
                    )
                )
            ),
        )
        messaging.send(msg, app=app)
        logger.info(f"Push sent → {fcm_token[:20]}… | {title}")
        return True

    except Exception as e:
        logger.error(f"Push send failed: {e}")
        return False


def send_multicast_push(
    fcm_tokens: List[str],
    title: str,
    body: str,
    data: Optional[dict] = None,
    image_url: Optional[str] = None,
) -> dict:
    """Send push notifications in batches of up to 500 to multiple device tokens."""
    tokens = [t for t in fcm_tokens if t and isinstance(t, str)]
    if not tokens:
        return {"success": 0, "failure": 0}

    app = _get_app()
    if app is None:
        return {"success": 0, "failure": len(tokens)}

    try:
        from firebase_admin import messaging

        data_payload = {str(k): str(v) for k, v in (data or {}).items()}
        total_success = 0
        total_failure = 0

        # Max 500 per MulticastMessage
        batch_size = 500
        for i in range(0, len(tokens), batch_size):
            chunk = tokens[i:i + batch_size]
            multicast_msg = messaging.MulticastMessage(
                tokens=chunk,
                notification=messaging.Notification(
                    title=title,
                    body=body,
                    image=image_url,
                ),
                data=data_payload,
                android=messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        sound="default",
                        channel_id="suqafuran_alerts",
                        priority="high",
                        default_sound=True,
                        default_vibrate_timings=True,
                    ),
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound="default",
                            badge=1,
                            alert=messaging.ApsAlert(
                                title=title,
                                body=body,
                            ),
                        )
                    )
                ),
            )
            res = messaging.send_multicast(multicast_msg, app=app)
            total_success += res.success_count
            total_failure += res.failure_count

        logger.info(f"Multicast push completed: {total_success} success, {total_failure} failed")
        return {"success": total_success, "failure": total_failure}
    except Exception as e:
        logger.error(f"Multicast push error: {e}")
        # Individual fallback
        success = 0
        failure = 0
        for tok in tokens:
            if send_push(tok, title, body, data, image_url):
                success += 1
            else:
                failure += 1
        return {"success": success, "failure": failure}


def broadcast_push_to_all(
    db,
    title: str,
    body: str,
    data: Optional[dict] = None,
    image_url: Optional[str] = None,
    audience: str = "all",
) -> dict:
    """Broadcast push notification and in-app notifications to all registered devices."""
    from app.models.user import User
    from app.models.notification import Notification
    from sqlmodel import select

    query = select(User).where(User.fcm_token.is_not(None))
    if audience == "sellers":
        query = query.where(User.is_seller == True)
    elif audience == "buyers":
        query = query.where(User.is_seller == False)

    users = db.exec(query).all()
    tokens = [u.fcm_token for u in users if u.fcm_token]

    # Create in-app notifications so user sees message in app inbox as well
    try:
        for u in users:
            notif = Notification(
                user_id=u.id,
                type="announcement",
                data={
                    "title": title,
                    "message": body,
                    "body": body,
                    "action_url": data.get("path", "") if data else "",
                }
            )
            db.add(notif)
        db.commit()
    except Exception as e:
        logger.warning(f"Error creating broadcast in-app notifications: {e}")

    # Send push notifications
    push_res = send_multicast_push(tokens, title, body, data, image_url)
    return {
        "audience": audience,
        "users_targeted": len(users),
        "tokens_dispatched": len(tokens),
        "delivered": push_res["success"],
        "failed": push_res["failure"],
    }


def send_push_to_user(db, user_id: int, title: str, body: str, data: Optional[dict] = None) -> bool:
    """Convenience: look up user's FCM token from DB and send."""
    try:
        from sqlmodel import select
        from app.models.user import User

        user = db.exec(select(User).where(User.id == user_id)).first()
        if not user or not user.fcm_token:
            return False
        return send_push(user.fcm_token, title, body, data)
    except Exception as e:
        logger.error(f"send_push_to_user error: {e}")
        return False
