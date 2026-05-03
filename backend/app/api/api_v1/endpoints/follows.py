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


@router.delete("/unfollow/{user_id}")
def unfollow_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Unfollow a user.
    """
    follow = db.exec(select(Follow).where(
        (Follow.follower_id == current_user.id) & (Follow.followed_id == user_id)
    )).first()
    if follow:
        db.delete(follow)
        db.commit()
    return {"message": "Success"}


@router.get("/my/following", response_model=List[User])
def get_my_following(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a list of users the current user is following.
    """
    followed_ids = db.exec(select(Follow.followed_id).where(Follow.follower_id == current_user.id)).all()
    following = db.exec(select(User).where(User.id.in_(followed_ids))).all()
    return following


@router.get("/stats/{user_id}")
def get_follow_stats(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get follow stats (follower count, following count, is_following) for a user.
    """
    followers_count = len(db.exec(select(Follow.follower_id).where(Follow.followed_id == user_id)).all())
    following_count = len(db.exec(select(Follow.followed_id).where(Follow.follower_id == user_id)).all())
    is_following = db.exec(select(Follow).where(
        (Follow.follower_id == current_user.id) & (Follow.followed_id == user_id)
    )).first() is not None
    return {
        "followers_count": followers_count,
        "following_count": following_count,
        "is_following": is_following,
    }
