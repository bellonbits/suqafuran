from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ShopReview, ShopFeedback, ShopFollow
from sqlalchemy import func
import uuid
from datetime import datetime

router = APIRouter(tags=["shop-reviews"])

@router.get("/listings/shops/{shop_id}/reviews")
def get_reviews(shop_id: str, db: Session = Depends(get_db)):
    try:
        reviews = db.query(ShopReview).filter(ShopReview.seller_id == shop_id).all()
        total = db.query(func.count(ShopReview.id)).filter(ShopReview.seller_id == shop_id).scalar()
        avg = db.query(func.avg(ShopReview.rating)).filter(ShopReview.seller_id == shop_id).scalar()
        verified = db.query(func.count(ShopReview.id)).filter(ShopReview.seller_id == shop_id, ShopReview.is_verified_purchase == True).scalar()
        return {"reviews": [{"id": r.id, "display_name": r.display_name or "Anonymous", "rating": r.rating, "review": r.review, "is_verified_purchase": r.is_verified_purchase, "created_at": r.created_at.isoformat() if r.created_at else None} for r in reviews], "average_rating": float(avg) if avg else 0, "total_reviews": total or 0, "verified_reviews_count": verified or 0}
    except:
        return {"reviews": [], "average_rating": 0, "total_reviews": 0, "verified_reviews_count": 0}

@router.post("/listings/shops/{shop_id}/reviews")
def post_review(shop_id: str, data: dict, db: Session = Depends(get_db)):
    try:
        rating = data.get("rating")
        if not (1 <= rating <= 5):
            raise HTTPException(status_code=400, detail="Rating must be 1-5")
        new = ShopReview(id=str(uuid.uuid4()), seller_id=shop_id, user_id=data.get("user_id"), rating=rating, review=data.get("review"), display_name=data.get("display_name", "Anonymous"), reviewer_email=data.get("reviewer_email"), is_verified_purchase=data.get("is_verified_purchase", False))
        db.add(new)
        db.commit()
        return {"id": new.id, "message": "Review submitted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/listings/shops/{shop_id}/feedback")
def get_feedback(shop_id: str, db: Session = Depends(get_db)):
    try:
        feedback = db.query(ShopFeedback).filter(ShopFeedback.seller_id == shop_id).all()
        return {"feedback": [{"id": f.id, "display_name": f.display_name or "Anonymous", "feedback_text": f.feedback_text, "created_at": f.created_at.isoformat() if f.created_at else None} for f in feedback]}
    except:
        return {"feedback": []}

@router.post("/listings/shops/{shop_id}/feedback")
def post_feedback(shop_id: str, data: dict, db: Session = Depends(get_db)):
    try:
        new = ShopFeedback(id=str(uuid.uuid4()), seller_id=shop_id, user_id=data.get("user_id"), feedback_text=data.get("feedback_text"), display_name=data.get("display_name", "Anonymous"), is_public=True)
        db.add(new)
        db.commit()
        return {"id": new.id, "message": "Feedback submitted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/listings/shops/{shop_id}/follow")
def follow(shop_id: str, data: dict, db: Session = Depends(get_db)):
    try:
        user_id = data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID required")
        new = ShopFollow(id=str(uuid.uuid4()), user_id=user_id, seller_id=shop_id)
        db.add(new)
        db.commit()
        return {"message": "Shop followed successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/listings/shops/{shop_id}/follow")
def unfollow(shop_id: str, user_id: str, db: Session = Depends(get_db)):
    try:
        follow = db.query(ShopFollow).filter(ShopFollow.user_id == user_id, ShopFollow.seller_id == shop_id).first()
        if follow:
            db.delete(follow)
            db.commit()
        return {"message": "Shop unfollowed successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
