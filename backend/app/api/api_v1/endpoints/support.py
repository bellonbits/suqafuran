from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from app.api import deps
from app.models.support import SupportTicket, SupportTicketUpdate, SupportTicketCreate
from app.models.user import User

router = APIRouter()

@router.get("/tickets", response_model=List[SupportTicket])
def read_tickets(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """Retrieve support tickets (Admin only)."""
    query = select(SupportTicket)
    if status:
        query = query.where(SupportTicket.status == status)
    
    tickets = db.exec(query.offset(skip).limit(limit)).all()
    return tickets

@router.get("/tickets/{ticket_id}", response_model=SupportTicket)
def read_ticket(
    ticket_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """Get ticket details (Admin only)."""
    ticket = db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.patch("/tickets/{ticket_id}", response_model=SupportTicket)
def update_ticket(
    ticket_id: int,
    ticket_in: SupportTicketUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """Update ticket status or notes (Admin only)."""
    db_ticket = db.get(SupportTicket, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_data = ticket_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_ticket, key, value)
    
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.delete("/tickets/{ticket_id}")
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """Delete a ticket (Admin only)."""
    ticket = db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    db.delete(ticket)
    db.commit()
    return {"status": "success"}

@router.get("/stats")
def support_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """Get support stats (Admin only)."""
    total = db.exec(select(func.count(SupportTicket.id))).one()
    open_tickets = db.exec(select(func.count(SupportTicket.id)).where(SupportTicket.status == "open")).one()
    return {
        "total": total,
        "open": open_tickets,
        "resolved": total - open_tickets
    }
