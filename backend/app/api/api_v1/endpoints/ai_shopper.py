import logging
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session
from app.api import deps
from app.services.ai_shopper.schemas import (
    ShopperChatRequest,
    ShopperChatResponse,
    ShopperSearchRequest,
    ShopperSearchResponse,
    ShopperCompareRequest,
    ShopperCompareResponse,
)
from app.services.ai_shopper.service import ai_shopper_service

logger = logging.getLogger("ai_shopper")

router = APIRouter()


@router.post("/chat", response_model=ShopperChatResponse)
def shopper_chat(
    request: ShopperChatRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Conversational AI Shopping Assistant endpoint.
    Maintains session history, classifies intent, extracts budget/locations/specs,
    queries active marketplace listings, and returns grounded recommendations.
    """
    try:
        return ai_shopper_service.chat(db=db, request=request)
    except Exception as e:
        logger.error(f"Error in shopper_chat: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process shopping assistant request.",
        )


@router.post("/search", response_model=ShopperSearchResponse)
def shopper_search(
    request: ShopperSearchRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Structured natural-language search across listings, categories, and verified shops.
    """
    try:
        return ai_shopper_service.search(db=db, request=request)
    except Exception as e:
        logger.error(f"Error in shopper_search: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute marketplace AI search.",
        )


@router.post("/compare", response_model=ShopperCompareResponse)
def shopper_compare(
    request: ShopperCompareRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Multi-product side-by-side comparison across price, specifications, condition, and seller trust.
    """
    try:
        return ai_shopper_service.compare(db=db, request=request)
    except Exception as e:
        logger.error(f"Error in shopper_compare: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compare products.",
        )


@router.get("/suggestions", response_model=List[str])
def shopper_suggestions() -> Any:
    """
    Returns initial suggested prompts for the welcome screen.
    """
    return ai_shopper_service.get_suggestions()


@router.get("/conversations/{conversation_id}")
def get_shopper_conversation(conversation_id: str) -> Any:
    """
    Retrieves previous conversation history and context parameters.
    """
    return ai_shopper_service.get_conversation(conversation_id)


@router.delete("/conversations/{conversation_id}")
def delete_shopper_conversation(conversation_id: str) -> Any:
    """
    Clears conversation session history.
    """
    ai_shopper_service.delete_conversation(conversation_id)
    return {"message": "Conversation session cleared", "conversation_id": conversation_id}
