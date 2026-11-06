from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.fraud import FraudEvent, RiskHistory
from app.models.trust import Report
from app.models.listing import Listing
from app.models.device import Device, UserDeviceLink

router = APIRouter()

class CreateReportRequest(BaseModel):
    reported_user_id: Optional[int] = None
    listing_id: Optional[int] = None
    reason: str
    description: Optional[str] = None
    risk_score: Optional[int] = 0

@router.get("/fraud-events", response_model=List[FraudEvent])
def read_fraud_events(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Retrieve all automated fraud detection events.
    """
    return db.query(FraudEvent).order_by(FraudEvent.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/reports")
def create_report(
    report_in: CreateReportRequest,
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Submit a fraud or safety report against a shop owner, user, or product listing.
    """
    client_ip = request.client.host if request.client else None
    
    reported_user_id = report_in.reported_user_id
    if not reported_user_id and report_in.listing_id:
        listing = db.query(Listing).filter(Listing.id == report_in.listing_id).first()
        if listing:
            reported_user_id = getattr(listing, 'owner_id', None) or getattr(listing, 'user_id', None)
    
    report = Report(
        reporter_id=current_user.id,
        reported_user_id=reported_user_id,
        listing_id=report_in.listing_id,
        reason=report_in.reason,
        description=report_in.description,
        risk_score=report_in.risk_score or 0,
        reporter_ip=client_ip,
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"status": "success", "report_id": report.id, "message": "Report submitted successfully"}

@router.get("/reports")
def read_reports(
    db: Session = Depends(deps.get_db),
    status: Optional[str] = None,
    limit: int = 200,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Retrieve community reports for moderation with rich user and listing details.
    """
    query = db.query(Report)
    if status and status.lower() not in ("all", ""):
        query = query.filter(Report.status == status)
    reports = query.order_by(Report.created_at.desc()).limit(limit).all()
    
    result = []
    for r in reports:
        reported_user = db.query(User).filter(User.id == r.reported_user_id).first() if r.reported_user_id else None
        reporter = db.query(User).filter(User.id == r.reporter_id).first() if r.reporter_id else None
        listing = db.query(Listing).filter(Listing.id == r.listing_id).first() if r.listing_id else None
        
        result.append({
            "id": r.id,
            "listing_id": r.listing_id,
            "listing_title": listing.title if listing else None,
            "reported_user_id": r.reported_user_id,
            "reported_user_name": reported_user.full_name or reported_user.username if reported_user else (f"User #{r.reported_user_id}" if r.reported_user_id else "Unknown"),
            "reported_user_email": reported_user.email if reported_user else None,
            "reported_user_phone": reported_user.phone_number if reported_user else None,
            "reported_user_is_suspended": getattr(reported_user, "is_suspended", False) if reported_user else False,
            "reporter_id": r.reporter_id,
            "reporter_name": reporter.full_name or reporter.username if reporter else (f"User #{r.reporter_id}" if r.reporter_id else "Anonymous"),
            "reporter_email": reporter.email if reporter else None,
            "reason": r.reason,
            "description": r.description,
            "status": r.status,
            "admin_note": r.admin_note,
            "admin_action": r.admin_action,
            "risk_score": r.risk_score or 0,
            "reporter_ip": r.reporter_ip,
            "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return result

@router.get("/user-risk/{user_id}")
def get_user_risk_profile(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Get a comprehensive risk profile for a user, including linked devices and history.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    devices = db.query(Device).join(UserDeviceLink).filter(UserDeviceLink.user_id == user_id).all()
    history = db.query(RiskHistory).filter(RiskHistory.user_id == user_id).order_by(RiskHistory.created_at.desc()).all()
    
    # Find other users on these same devices
    device_ids = [d.id for d in devices]
    linked_users = db.query(User).join(UserDeviceLink).filter(
        UserDeviceLink.device_id.in_(device_ids),
        UserDeviceLink.user_id != user_id
    ).all()

    return {
        "user_trust_score": user.trust_score,
        "trust_level": user.trust_level,
        "is_flagged": user.is_flagged,
        "devices": devices,
        "linked_users": linked_users,
        "risk_history": history
    }

@router.post("/moderate-report/{report_id}")
def moderate_report(
    report_id: int,
    action: str, # dismiss, warn, ban, remove_listing
    note: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = action
    report.admin_note = note
    report.admin_action = action
    report.resolved_at = datetime.utcnow()
    
    if action == "ban":
        user = db.query(User).filter(User.id == report.reported_user_id).first()
        if user:
            user.is_suspended = True
            user.is_flagged = True
            db.add(user)
    elif action == "warn":
        user = db.query(User).filter(User.id == report.reported_user_id).first()
        if user:
            user.is_flagged = True
            db.add(user)
    elif action == "remove_listing":
        if report.listing_id:
            listing = db.query(Listing).filter(Listing.id == report.listing_id).first()
            if listing:
                listing.is_active = False
                db.add(listing)
    elif action == "dismiss":
        report.status = "dismissed"
            
    db.add(report)
    db.commit()
    return {"status": "success", "action": action, "report_id": report_id}

@router.post("/fraud-events/{event_id}/action")
def action_fraud_event(
    event_id: int,
    action: str = Query(..., regex="^(dismiss|investigate|actioned|suspend_target)$"),
    note: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Action or dismiss an automated fraud detection event.
    """
    event = db.query(FraudEvent).filter(FraudEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Fraud event not found")
    
    if action == "dismiss":
        event.status = "dismissed"
    elif action == "investigate":
        event.status = "investigated"
    elif action == "actioned":
        event.status = "actioned"
    elif action == "suspend_target":
        event.status = "actioned"
        if event.target_type == "user" and str(event.target_id).isdigit():
            user = db.query(User).filter(User.id == int(event.target_id)).first()
            if user:
                user.is_suspended = True
                user.is_flagged = True
                db.add(user)
        elif event.target_type == "listing" and str(event.target_id).isdigit():
            listing = db.query(Listing).filter(Listing.id == int(event.target_id)).first()
            if listing:
                listing.is_active = False
                db.add(listing)
                
    db.add(event)
    db.commit()
    return {"status": "success", "event_id": event_id, "new_status": event.status}
