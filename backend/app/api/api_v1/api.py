from fastapi import APIRouter
from app.api.api_v1.endpoints import login, users, listings, admin, messages, favorites, notifications, dashboard, verifications, social_auth, wallet, boosts

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["favorites"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(verifications.router, prefix="/verifications", tags=["verifications"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(social_auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["wallet"])
api_router.include_router(boosts.router, prefix="/boosts", tags=["boosts"])
