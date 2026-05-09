from datetime import datetime
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from sqlalchemy import text
from app.api import deps
from app.models.trust import Rating, Report
from app.models.meeting_deal import Meeting, Deal
from app.models.interaction import Interaction
from app.models.listing import Listing
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class PendingActions(BaseModel):
    meetings: List[dict]
    deals: List[dict]

@router.get("/pending", response_model=PendingActions)
def get_pending_trust_actions(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    # 1. Fetch Interactions that might lead to a meeting
    # Only look at interactions from the last 3 days, and at least 4 hours old
    from datetime import timedelta
    now = datetime.utcnow()
    three_days_ago = now - timedelta(days=3)
    four_hours_ago = now - timedelta(hours=4)

    interactions = db.exec(
        select(Interaction, Listing)
        .join(Listing, Interaction.listing_id == Listing.id)
        .where(
            (Interaction.buyer_id == current_user.id) | (Listing.owner_id == current_user.id),
            Interaction.created_at >= three_days_ago,
            Interaction.created_at <= four_hours_ago
        )
        .order_by(Interaction.created_at.desc())
    ).all()

    pending_meetings = []
    seen_pairs = set()

    for interaction, listing in interactions:
        seller_id = listing.owner_id
        buyer_id = interaction.buyer_id
        pair_key = (listing.id, buyer_id, seller_id)
        
        if pair_key in seen_pairs:
            continue
        seen_pairs.add(pair_key)

        # Check if meeting already exists and if user already responded
        meeting = db.exec(
            select(Meeting).where(
                Meeting.listing_id == listing.id,
                Meeting.buyer_id == buyer_id,
                Meeting.seller_id == seller_id
            )
        ).first()

        is_pending = False
        if not meeting:
            is_pending = True
            meeting_id = interaction.id # Virtual ID
        else:
            meeting_id = meeting.id
            # Strict check: only pending if response is None or empty string
            if current_user.id == buyer_id and not meeting.buyer_response:
                is_pending = True
            elif current_user.id == seller_id and not meeting.seller_response:
                is_pending = True

        if is_pending:
            from app.models.user import User
            other_user_id = seller_id if current_user.id == buyer_id else buyer_id
            other_user = db.get(User, other_user_id)
            role = "seller" if current_user.id == seller_id else "buyer"
            
            pending_meetings.append({
                "id": meeting_id,
                "listing_id": listing.id,
                "listing_title": listing.title,
                "other_user_id": other_user_id,
                "other_user_name": other_user.full_name if other_user else "User",
                "role": role,
                "type": "meeting"
            })

    # 2. Fetch Deals where meeting was confirmed YES but no Deal record exists
    meetings_confirmed = db.exec(
        select(Meeting, Listing)
        .join(Listing, Meeting.listing_id == Listing.id)
        .where(
            Meeting.buyer_response == 'yes',
            Meeting.seller_response == 'yes',
            (Meeting.buyer_id == current_user.id) | (Meeting.seller_id == current_user.id)
        )
    ).all()

    pending_deals = []
    for meeting, listing in meetings_confirmed:
        # Check if Deal already exists
        deal = db.exec(
            select(Deal).where(
                Deal.listing_id == listing.id,
                Deal.buyer_id == meeting.buyer_id,
                Deal.seller_id == meeting.seller_id
            )
        ).first()

        if not deal:
            from app.models.user import User
            other_user_id = meeting.seller_id if current_user.id == meeting.buyer_id else meeting.buyer_id
            other_user = db.get(User, other_user_id)
            role = "seller" if current_user.id == meeting.seller_id else "buyer"
            
            pending_deals.append({
                "id": meeting.id,
                "listing_id": listing.id,
                "listing_title": listing.title,
                "other_user_name": other_user.full_name if other_user else "User",
                "role": role,
                "type": "deal"
            })

    return {
        "meetings": pending_meetings,
        "deals": pending_deals
    }

class RatingCreateIn(BaseModel):
    deal_id: int
    rated_user_id: int
    score: int
    comment: Optional[str] = None

class ReportCreateIn(BaseModel):
    listing_id: Optional[int] = None
    reason: str
    description: Optional[str] = None

@router.post("/ratings", response_model=Rating)
def create_rating(
    payload: RatingCreateIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    rating = Rating(
        deal_id=payload.deal_id,
        rater_id=current_user.id,
        rated_user_id=payload.rated_user_id,
        score=payload.score,
        comment=payload.comment
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating

@router.post("/reports", response_model=Report)
def create_report(
    payload: ReportCreateIn,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    # Get reporter signals
    reporter_ip = request.client.host if request.client else None
    reporter_fingerprint = request.headers.get("X-Device-Fingerprint")

    # Get offender signals
    offender = None
    offender_id = None
    if payload.listing_id:
        listing = db.get(Listing, payload.listing_id)
        if listing:
            offender_id = listing.owner_id
            offender = db.get(User, offender_id)
    
    risk_score = 0
    offender_ip = offender.last_ip if offender else None
    offender_fingerprint = offender.device_fingerprint if offender else None

    # Unusual Account Detection
    if offender_fingerprint:
        # Check how many other accounts share this fingerprint
        shared_accounts = db.exec(
            select(User).where(User.device_fingerprint == offender_fingerprint, User.id != offender_id)
        ).all()
        if len(shared_accounts) > 1:
            risk_score += 300 # High risk: Fingerprint shared across multiple accounts
        
    if reporter_fingerprint == offender_fingerprint:
        risk_score += 50 # Suspect report: self-reporting or same device

    if offender_ip and reporter_ip == offender_ip:
        risk_score += 50 # Suspect report: same network

    report = Report(
        listing_id=payload.listing_id,
        reported_user_id=offender_id,
        reporter_id=current_user.id,
        reason=payload.reason,
        description=payload.description,
        reporter_ip=reporter_ip,
        reporter_fingerprint=reporter_fingerprint,
        offender_ip=offender_ip,
        offender_fingerprint=offender_fingerprint,
        risk_score=risk_score
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


# ── Admin report endpoints ─────────────────────────────────────────────────

@router.get("/admin/reports")
def list_reports(
    status: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")

    query = select(Report)
    if status:
        query = query.where(Report.status == status)
    query = query.order_by(Report.created_at.desc())
    reports = db.exec(query).all()

    result = []
    for r in reports:
        reporter = db.get(User, r.reporter_id)
        reported_user = db.get(User, r.reported_user_id) if r.reported_user_id else None
        listing = db.get(Listing, r.listing_id) if r.listing_id else None

        result.append({
            "id": r.id,
            "reason": r.reason,
            "description": r.description,
            "status": r.status,
            "risk_score": r.risk_score,
            "admin_note": r.admin_note,
            "admin_action": r.admin_action,
            "reporter_ip": r.reporter_ip,
            "offender_ip": r.offender_ip,
            "offender_fingerprint": r.offender_fingerprint,
            "created_at": r.created_at.isoformat(),
            "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
            "reporter": {
                "id": reporter.id,
                "name": reporter.full_name,
                "email": reporter.email,
            } if reporter else None,
            "reported_user": {
                "id": reported_user.id,
                "name": reported_user.full_name,
                "email": reported_user.email,
                "is_active": reported_user.is_active,
                "trust_score": reported_user.trust_score,
                "verified_level": reported_user.verified_level,
            } if reported_user else None,
            "listing": {
                "id": listing.id,
                "title": listing.title_en or listing.title_so,
                "status": listing.status,
            } if listing else None,
        })
    return result


class ReportActionIn(BaseModel):
    action: str  # warn | suspend | remove_listing | dismiss
    admin_note: Optional[str] = None


@router.post("/admin/reports/{report_id}/action")
def take_report_action(
    report_id: int,
    payload: ReportActionIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")

    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    action = payload.action

    if action == "warn":
        report.status = "warned"
    elif action == "suspend":
        report.status = "suspended"
        if report.reported_user_id:
            user = db.get(User, report.reported_user_id)
            if user:
                user.is_active = False
                db.add(user)
        elif report.listing_id:
            listing = db.get(Listing, report.listing_id)
            if listing:
                owner = db.get(User, listing.owner_id)
                if owner:
                    owner.is_active = False
                    db.add(owner)
    elif action == "remove_listing":
        report.status = "removed"
        if report.listing_id:
            listing = db.get(Listing, report.listing_id)
            if listing:
                listing.status = "closed"
                db.add(listing)
    elif action == "dismiss":
        report.status = "dismissed"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    report.admin_action = action
    report.admin_note = payload.admin_note
    report.resolved_at = datetime.utcnow()
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"ok": True, "status": report.status}


@router.get("/admin/unusual-accounts")
def list_unusual_accounts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")

    # Find fingerprints that are shared by more than 1 account
    shared_fingerprints_query = text("""
        SELECT device_fingerprint, COUNT(id) as count 
        FROM "user" 
        WHERE device_fingerprint IS NOT NULL 
        GROUP BY device_fingerprint 
        HAVING COUNT(id) > 1
        ORDER BY count DESC
    """)
    clusters = db.execute(shared_fingerprints_query).all()
    
    result = []
    for fingerprint, count in clusters:
        # Get users in this cluster
        users = db.exec(select(User).where(User.device_fingerprint == fingerprint)).all()
        for u in users:
            result.append({
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "device_fingerprint": u.device_fingerprint,
                "last_ip": u.last_ip,
                "trust_score": u.trust_score,
                "verified_level": u.verified_level,
                "created_at": u.created_at.isoformat(),
                "linked_accounts_count": count
            })
            
    return result
