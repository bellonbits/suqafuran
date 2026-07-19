from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, listings, admin, favorites, notifications, dashboard, verifications, wallet, boosts, interactions, meetings, deals, trust_ops, promotions, login, mobile_money, audit, kh, messages, translate, feedback, follows, content, ai, marketing, support, verification_check, seo, businesses, addresses, payments, sellers, diagnostics, analytics, analytics_tracking, bulk_products, delivery_zones, reviews, campaigns
from app.api.api_v1.admin import monitoring_router

# Import Phase 4 routers from root routers directory
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))
try:
    from routers import payments as phase4_payments, sellers as phase4_sellers, riders as phase4_riders, orders as phase4_orders, websocket_routes, seller_endpoints as phase2_seller_endpoints
except ImportError:
    phase4_payments = None
    phase4_sellers = None
    phase4_riders = None
    phase4_orders = None
    websocket_routes = None
    phase2_seller_endpoints = None

api_router = APIRouter()

# Phase 4 Core Endpoints
if phase4_payments:
    api_router.include_router(phase4_payments.router, tags=["payments"])
if phase4_orders:
    api_router.include_router(phase4_orders.router, tags=["orders"])
# Skip phase4_sellers - uses incompatible database schema
# if phase4_sellers:
#     api_router.include_router(phase4_sellers.router, tags=["sellers"])
if phase4_riders:
    api_router.include_router(phase4_riders.router, tags=["riders"])
if websocket_routes:
    api_router.include_router(websocket_routes.router, tags=["websocket"])

# Phase 2 Seller Endpoints (mock data for seller dashboard)
if phase2_seller_endpoints:
    api_router.include_router(phase2_seller_endpoints.router, tags=["sellers"])

# Comprehensive API Endpoints
api_router.include_router(login.router, tags=["login"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(payments.router, tags=["payments"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(monitoring_router.router, tags=["admin-monitoring"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["favorites"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(verifications.router, prefix="/verifications", tags=["verifications"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["wallet"])
api_router.include_router(boosts.router, prefix="/boosts", tags=["boosts"])
api_router.include_router(interactions.router, prefix="/interactions", tags=["interactions"])
api_router.include_router(meetings.router, prefix="/meetings", tags=["meetings"])
api_router.include_router(deals.router, prefix="/deals", tags=["deals"])
api_router.include_router(trust_ops.router, prefix="/trust_ops", tags=["trust"])
api_router.include_router(promotions.router, prefix="/promotions", tags=["promotions"])
api_router.include_router(mobile_money.router, prefix="/mobile-money", tags=["mobile-money"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
api_router.include_router(kh.router, prefix="/kh", tags=["kaalay-heedhe"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(follows.router, prefix="/follows", tags=["follows"])
api_router.include_router(translate.router, tags=["translate"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(marketing.router, prefix="/marketing", tags=["marketing"])
api_router.include_router(support.router, prefix="/support", tags=["support"])
api_router.include_router(verification_check.router, prefix="/ai/verifications", tags=["ai-verifications"])
api_router.include_router(seo.router, prefix="/seo", tags=["seo"])
api_router.include_router(businesses.router, prefix="/businesses", tags=["businesses"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["addresses"])
api_router.include_router(sellers.router, prefix="/sellers", tags=["sellers"])
api_router.include_router(diagnostics.router, tags=["diagnostics"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(analytics_tracking.router, prefix="/analytics", tags=["analytics-tracking"])
api_router.include_router(bulk_products.router, prefix="/listings", tags=["bulk-products"])
api_router.include_router(delivery_zones.router, prefix="/delivery-zones", tags=["delivery-zones"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])

