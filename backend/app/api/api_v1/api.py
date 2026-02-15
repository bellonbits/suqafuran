from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, listings, admin, favorites, notifications, dashboard, verifications, wallet, boosts, interactions, meetings, deals, trust_ops, promotions, login

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
# api_router.include_router(messages.router, prefix="/messages", tags=["messages"]) # Disabled for MVP
api_router.include_router(favorites.router, prefix="/favorites", tags=["favorites"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(verifications.router, prefix="/verifications", tags=["verifications"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
# api_router.include_router(social_auth.router, prefix="/auth", tags=["auth"]) # Replaced by auth.router
api_router.include_router(wallet.router, prefix="/wallet", tags=["wallet"])
api_router.include_router(boosts.router, prefix="/boosts", tags=["boosts"])
api_router.include_router(interactions.router, prefix="/interactions", tags=["interactions"])
api_router.include_router(meetings.router, prefix="/meetings", tags=["meetings"])
api_router.include_router(deals.router, prefix="/deals", tags=["deals"])
api_router.include_router(trust_ops.router, prefix="/trust_ops", tags=["trust"])
api_router.include_router(promotions.router, prefix="/promotions", tags=["promotions"])
