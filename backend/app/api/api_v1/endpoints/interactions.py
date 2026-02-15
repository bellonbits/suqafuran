from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api import deps
from app.models.interaction import Interaction, InteractionType
from pydantic import BaseModel

router = APIRouter()

class InteractionCreateIn(BaseModel):
    listing_id: int
    type: InteractionType

@router.post("/", response_model=Interaction)
def create_interaction(
    payload: InteractionCreateIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    db_obj = Interaction(
        listing_id=payload.listing_id,
        buyer_id=current_user.id,
        type=payload.type
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
