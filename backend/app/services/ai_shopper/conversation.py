import uuid
from typing import Optional, Dict, Any, List
from app.services.ai_shopper.cache import (
    get_cached_session,
    set_cached_session,
    delete_cached_session,
)
from app.services.ai_shopper.schemas import ExtractedQueryParams


class ConversationManager:
    @staticmethod
    def get_or_create_session(conversation_id: Optional[str] = None) -> Dict[str, Any]:
        cid = conversation_id or str(uuid.uuid4())
        session = get_cached_session(cid)
        if not session:
            session = {
                "id": cid,
                "history": [],
                "accumulated_params": {},
                "last_active": "",
            }
            set_cached_session(cid, session)
        return session

    @staticmethod
    def save_session(
        conversation_id: str,
        history: List[Dict[str, str]],
        params: ExtractedQueryParams,
    ) -> None:
        session = {
            "id": conversation_id,
            "history": history[-10:],  # keep last 10 messages
            "accumulated_params": params.dict(),
        }
        set_cached_session(conversation_id, session)

    @staticmethod
    def delete_session(conversation_id: str) -> None:
        delete_cached_session(conversation_id)
