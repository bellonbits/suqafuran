from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import Rider, User, Order, DeliveryAssignment
from schemas import RiderRegister, RiderResponse, RiderLocationUpdate, DeliveryAssignmentResponse, DeliveryStatusUpdate
from utils.security import get_current_user

router = APIRouter(prefix="/riders", tags=["riders"])

@router.post("/register", response_model=RiderResponse)
def register_rider(
    rider_data: RiderRegister,
    db: Session = Depends(get_db)
):
    # Create user first if needed
    existing_user = db.query(User).filter(User.phone == rider_data.phone).first()

    if not existing_user:
        user = User(
            email=f"rider_{rider_data.phone}@suqafuran.com",
            phone=rider_data.phone,
            full_name=rider_data.full_name or "Rider",
            is_verified=False
        )
        db.add(user)
        db.flush()
        user_id = user.id
    else:
        user_id = existing_user.id

    # Create rider profile
    rider = Rider(
        user_id=user_id,
        phone=rider_data.phone,
        vehicle_type=rider_data.vehicle_type,
        vehicle_plate=rider_data.vehicle_plate,
        is_verified=False,
        is_active=True,
        current_lat=rider_data.current_location.get("latitude", 0),
        current_lng=rider_data.current_location.get("longitude", 0)
    )
    db.add(rider)
    db.commit()
    db.refresh(rider)

    return {
        "id": rider.id,
        "phone": rider.phone,
        "vehicle_type": rider.vehicle_type,
        "vehicle_plate": rider.vehicle_plate,
        "is_verified": rider.is_verified,
        "is_active": rider.is_active
    }

@router.get("/{rider_id}", response_model=RiderResponse)
def get_rider_profile(
    rider_id: str,
    db: Session = Depends(get_db)
):
    rider = db.query(Rider).filter(Rider.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")

    return {
        "id": rider.id,
        "phone": rider.phone,
        "vehicle_type": rider.vehicle_type,
        "vehicle_plate": rider.vehicle_plate,
        "is_verified": rider.is_verified,
        "is_active": rider.is_active
    }

@router.post("/{rider_id}/location")
def update_rider_location(
    rider_id: str,
    location_data: RiderLocationUpdate,
    db: Session = Depends(get_db)
):
    rider = db.query(Rider).filter(Rider.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")

    rider.current_lat = location_data.latitude
    rider.current_lng = location_data.longitude
    rider.updated_at = datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "message": "Location updated successfully"
    }

@router.post("/assignments/assign")
def assign_delivery(
    assignment_data: dict,
    db: Session = Depends(get_db)
):
    order_id = assignment_data.get("order_id")
    rider_id = assignment_data.get("rider_id")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    rider = db.query(Rider).filter(Rider.id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")

    # Create delivery assignment
    assignment = DeliveryAssignment(
        order_id=order_id,
        rider_id=rider_id,
        status="assigned"
    )
    db.add(assignment)
    order.status = "in_delivery"
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assignment)

    return {
        "id": assignment.id,
        "order_id": assignment.order_id,
        "rider_id": assignment.rider_id,
        "status": assignment.status,
        "created_at": assignment.created_at
    }

@router.get("/assignments/{assignment_id}", response_model=DeliveryAssignmentResponse)
def get_assignment(
    assignment_id: str,
    db: Session = Depends(get_db)
):
    assignment = db.query(DeliveryAssignment).filter(
        DeliveryAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    return {
        "id": assignment.id,
        "order_id": assignment.order_id,
        "rider_id": assignment.rider_id,
        "status": assignment.status,
        "created_at": assignment.created_at,
        "updated_at": assignment.updated_at
    }

@router.patch("/assignments/{assignment_id}")
def update_assignment_status(
    assignment_id: str,
    status_update: DeliveryStatusUpdate,
    db: Session = Depends(get_db)
):
    assignment = db.query(DeliveryAssignment).filter(
        DeliveryAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.status = status_update.status
    assignment.updated_at = datetime.utcnow()

    # Update order status
    order = db.query(Order).filter(Order.id == assignment.order_id).first()
    if order:
        if status_update.status == "delivered":
            order.status = "delivered"
        elif status_update.status == "picked_up":
            order.status = "in_delivery"

        order.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(assignment)

    return {
        "id": assignment.id,
        "order_id": assignment.order_id,
        "rider_id": assignment.rider_id,
        "status": assignment.status,
        "created_at": assignment.created_at,
        "updated_at": assignment.updated_at
    }

@router.get("/{rider_id}/assignments")
def get_rider_assignments(
    rider_id: str,
    status: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(DeliveryAssignment).filter(DeliveryAssignment.rider_id == rider_id)
    if status:
        query = query.filter(DeliveryAssignment.status == status)

    assignments = query.all()
    return assignments
