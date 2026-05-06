from datetime import datetime
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from app.api import deps
from app.models.marketing_code import MarketingCode
from app.models.user import User

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────────────

class MarketingCodeCreate(BaseModel):
    code: str
    description: str = ""
    created_by: str = ""
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None


class MarketingCodeUpdate(BaseModel):
    description: Optional[str] = None
    max_uses: Optional[int] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class MarketingCodeOut(BaseModel):
    id: int
    code: str
    description: str
    created_by: str
    max_uses: Optional[int]
    uses_count: int
    ads_posted_count: int
    conversion_rate: float        # ads_posted_count / uses_count (0 if uses_count == 0)
    is_active: bool
    expires_at: Optional[datetime]
    created_at: datetime
    is_expired: bool


def _to_out(mc: MarketingCode) -> MarketingCodeOut:
    now = datetime.utcnow()
    is_expired = bool(mc.expires_at and mc.expires_at < now)
    conversion = round(mc.ads_posted_count / mc.uses_count, 2) if mc.uses_count else 0.0
    return MarketingCodeOut(
        id=mc.id,
        code=mc.code,
        description=mc.description,
        created_by=mc.created_by,
        max_uses=mc.max_uses,
        uses_count=mc.uses_count,
        ads_posted_count=mc.ads_posted_count,
        conversion_rate=conversion,
        is_active=mc.is_active,
        expires_at=mc.expires_at,
        created_at=mc.created_at,
        is_expired=is_expired,
    )


# ── Admin endpoints (require is_admin) ─────────────────────────────────────────

@router.post("/codes", response_model=MarketingCodeOut)
def create_code(
    payload: MarketingCodeCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    code_val = payload.code.strip().upper()
    if not code_val:
        raise HTTPException(status_code=400, detail="Code cannot be empty")
    existing = db.exec(select(MarketingCode).where(MarketingCode.code == code_val)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Code already exists")
    mc = MarketingCode(
        code=code_val,
        description=payload.description,
        created_by=payload.created_by or current_user.full_name or current_user.email,
        max_uses=payload.max_uses,
        expires_at=payload.expires_at,
    )
    db.add(mc)
    db.commit()
    db.refresh(mc)
    return _to_out(mc)


@router.get("/codes", response_model=List[MarketingCodeOut])
def list_codes(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    codes = db.exec(select(MarketingCode).order_by(MarketingCode.created_at.desc())).all()
    return [_to_out(c) for c in codes]


@router.patch("/codes/{code_id}", response_model=MarketingCodeOut)
def update_code(
    code_id: int,
    payload: MarketingCodeUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    mc = db.get(MarketingCode, code_id)
    if not mc:
        raise HTTPException(status_code=404, detail="Code not found")
    if payload.description is not None:
        mc.description = payload.description
    if payload.max_uses is not None:
        mc.max_uses = payload.max_uses
    if payload.is_active is not None:
        mc.is_active = payload.is_active
    if payload.expires_at is not None:
        mc.expires_at = payload.expires_at
    db.add(mc)
    db.commit()
    db.refresh(mc)
    return _to_out(mc)


@router.delete("/codes/{code_id}", response_model=dict)
def deactivate_code(
    code_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    mc = db.get(MarketingCode, code_id)
    if not mc:
        raise HTTPException(status_code=404, detail="Code not found")
    mc.is_active = False
    db.add(mc)
    db.commit()
    return {"success": True}


# ── Public validate endpoint (used by signup form) ─────────────────────────────

@router.get("/validate/{code}")
def validate_code(code: str, db: Session = Depends(deps.get_db)) -> Any:
    mc = db.exec(select(MarketingCode).where(MarketingCode.code == code.strip().upper())).first()
    if not mc or not mc.is_active:
        return {"valid": False, "reason": "Invalid or inactive code"}
    if mc.expires_at and mc.expires_at < datetime.utcnow():
        return {"valid": False, "reason": "This code has expired"}
    if mc.max_uses is not None and mc.uses_count >= mc.max_uses:
        return {"valid": False, "reason": "This code has reached its usage limit"}
    return {"valid": True, "code": mc.code, "description": mc.description}
