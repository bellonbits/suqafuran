from typing import List, Optional
from sqlmodel import Session, select
from app.models.notification import Notification

class CRUDNotification:
    def create(self, db: Session, *, obj_in: dict, user_id: int) -> Notification:
        db_obj = Notification(
            user_id=user_id,
            type=obj_in["type"],
            data=obj_in.get("data", {})
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        # Trigger background push notification if user has registered device
        try:
            from app.utils.push import send_push_to_user
            import threading
            title = obj_in.get("title") or obj_in.get("data", {}).get("title") or "New Notification"
            body = obj_in.get("message") or obj_in.get("data", {}).get("message") or obj_in.get("data", {}).get("body") or "You have a new update on Suqafuran"
            image_url = obj_in.get("data", {}).get("sender_avatar") or obj_in.get("data", {}).get("avatar") or obj_in.get("image_url") or None

            def _push_worker():
                try:
                    from app.db import SessionLocal
                    with SessionLocal() as s:
                        send_push_to_user(
                            s,
                            user_id=user_id,
                            title=str(title),
                            body=str(body),
                            data={
                                "type": str(obj_in.get("type", "notification")),
                                "id": str(db_obj.id or ""),
                                "path": str(obj_in.get("data", {}).get("action_url") or obj_in.get("data", {}).get("url") or "")
                            },
                            image_url=image_url
                        )
                except Exception:
                    pass

            threading.Thread(target=_push_worker, daemon=True).start()
        except Exception:
            pass

        return db_obj

    def get_user_notifications(
        self, db: Session, *, user_id: int, limit: int = 50, unread_only: bool = False
    ) -> List[Notification]:
        statement = select(Notification).where(
            Notification.user_id == user_id
        )
        if unread_only:
            statement = statement.where(Notification.is_read == False)
        statement = statement.order_by(Notification.created_at.desc()).limit(limit)
        return db.exec(statement).all()

    def mark_as_read(self, db: Session, *, notification_id: int, user_id: int) -> Optional[Notification]:
        db_obj = db.get(Notification, notification_id)
        if db_obj and db_obj.user_id == user_id:
            db_obj.is_read = True
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        return None

    def mark_all_as_read(self, db: Session, *, user_id: int) -> int:
        statement = select(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
        notifications = db.exec(statement).all()
        for notif in notifications:
            notif.is_read = True
            db.add(notif)
        db.commit()
        return len(notifications)

    def clear_all(self, db: Session, *, user_id: int) -> int:
        """
        Permanently delete all notifications for a given user.
        """
        statement = select(Notification).where(
            Notification.user_id == user_id
        )
        notifications = db.exec(statement).all()
        count = len(notifications)
        for notif in notifications:
            db.delete(notif)
        db.commit()
        return count

    def remove(self, db: Session, *, notification_id: int, user_id: int) -> bool:
        db_obj = db.get(Notification, notification_id)
        if db_obj and db_obj.user_id == user_id:
            db.delete(db_obj)
            db.commit()
            return True
        return False

crud_notification = CRUDNotification()
