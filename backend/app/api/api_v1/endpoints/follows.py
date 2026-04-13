from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.follow import Follow
from app.models.user import User

router = APIRouter()

@router.get("/my/followers", response_model=List[User])
def get_my_followers(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a list of users following the current user.
    """
    follower_ids = db.exec(select(Follow.follower_id).where(Follow.followed_id == current_user.id)).all()
    followers = db.exec(select(User).where(User.id.in_(follower_ids))).all()
    return followers

@router.post("/follow/{user_id}")
def follow_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Follow a user.
    """
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")
    
    existing = db.exec(select(Follow).where(
        (Follow.follower_id == current_user.id) & (Follow.followed_id == user_id)
    )).first()
    
    if existing:
        return {"message": "Already following"}
    
    follow = Follow(follower_id=current_user.id, followed_id=user_id)
    db.add(follow)
    db.commit()
    return {"message": "Success"}
