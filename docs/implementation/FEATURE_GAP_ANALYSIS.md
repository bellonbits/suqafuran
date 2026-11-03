# SUQAFURAN FEATURE GAP ANALYSIS

**Document Version:** 1.0  
**Date:** 2026-11-03  
**Status:** Complete — Phase 0 Deliverable  

---

## 1. Domain-by-Domain Feature Comparison

| Domain | Specification Requirement | Current Implementation Status | Gap Description | Severity | Remediation Plan |
|---|---|---|---|---|---|
| **1. Listings** | Create, edit, pause, mark sold, negotiate price, discounts, multi-images, moderation status. | **IMPLEMENTED** (with minor legacy clutter). | Legacy order/delivery routes remain in `backend/main.py`; entitlements not checked at creation time. | Low | Remove legacy routes; enforce subscription quotas on listing POST. |
| **2. Categories** | 3-tier hierarchy, JSON attribute schemas, bilingual names (EN/SO), attribute filtering. | **IMPLEMENTED**. | Caching of category attribute schemas needs Redis caching to reduce query joins. | Low | Add Redis cache with automatic cache invalidation on category update. |
| **3. Search** | Keyword search, category/location/price filters, full-text ranking, zero-result search tracking. | **PARTIALLY IMPLEMENTED**. | Relies on SQL `ILIKE '%query%'`; lacks full-text / trigram indexing and does not track zero-result searches. | High | Add PostgreSQL pg_trgm / tsvector index; log zero-result searches to analytics. |
| **4. Seller Profile** | Shop name, verification status, active listings, rating, response rate, median response time. | **PARTIALLY IMPLEMENTED**. | Response rate and response time are static text placeholders rather than computed from data. | Medium | Add calculation worker deriving response rate and median response time from chat messages. |
| **5. Verification** | Multi-tier evidence verification (phone, ID, business); anti-tamper audit logs. | **PARTIALLY IMPLEMENTED**. | Phone verification exists; document verification lacks structured admin review workflows. | Medium | Build admin verification queue with document preview, audit logging, and rejection reasons. |
| **6. Reviews** | Ratings, review text, seller responses, abuse reporting, anti-manipulation gating. | **PARTIALLY IMPLEMENTED**. | Reviews endpoint exists but does not verify genuine interaction between buyer and seller. | High | Gate reviews: require at least 2 chat messages between buyer and seller before review submission. |
| **7. Messaging** | Real-time chat, sent/delivered/read status, typing indicators, online presence, cursor pagination. | **BROKEN / FRAGMENTED**. | Multiple conflicting websocket endpoints; in-memory connection state fails across multi-worker deployments. | Critical | Migrate real-time messaging to Spring Boot STOMP with Redis Pub/Sub cluster backplane. |
| **8. Payments** | M-Pesa STK push, strict idempotency keys, state machine, webhook signature verification. | **PARTIALLY IMPLEMENTED**. | Endpoints exist, but lack distributed idempotency lock; webhook retry storms can trigger race conditions. | Critical | Build Spring Boot Payment Engine with unique idempotency keys and strict state machine. |
| **9. Subscriptions** | Subscription plans, upgrades, renewals, grace periods, cancellation, explicit state machine. | **PARTIALLY IMPLEMENTED**. | Plans exist in database, but state transitions are handled ad-hoc without formal state machine. | High | Migrate subscription lifecycle to Spring Boot with automated expiration and renewal jobs. |
| **10. Entitlements** | Centralized entitlement check (`GET /entitlements/{seller_id}`), listing quota enforcement. | **MISSING**. | FastAPI endpoints check user role or subscription existence, but do not query unified quotas. | High | Implement Spring Boot Entitlements API; enforce quotas in FastAPI before listing publishing. |
| **11. Promotions** | Promoted listings, featured shops, campaign durations, ad budgets, visual distinction. | **IMPLEMENTED** (needs payment tie-in). | Promotions exist but some activation paths rely on manual agent queues or unverified callbacks. | Medium | Link promotion activation directly to verified Spring Boot payment confirmations. |
| **12. AI Moderation** | 3-tier risk decision (Auto-Approve, Human Review, Quarantine), perceptual image hash matching. | **PARTIALLY IMPLEMENTED**. | Rule patterns and `phash` exist; lacks formal 3-tier decision pipeline and admin review queue. | High | Formalize 3-tier risk scoring pipeline in Python; build admin moderation queue. |
| **13. Recommendations**| Hybrid engine (content, collaborative, popularity), cold-start fallback, high-speed cached APIs. | **PARTIALLY IMPLEMENTED**. | Recommendation logic exists in marketing SMS tasks, but no dedicated real-time home/similar APIs. | High | Build Python Recommendation Service with `/recommendations/home` and `/similar/{id}` endpoints. |
| **14. Marketing Automation**| Multi-channel (SMS, Email, Push), audience segmentation, explicit consent (KDPA compliant). | **PARTIALLY IMPLEMENTED**. | Email/SMS dispatches exist in Celery; lacks formal consent audit trail and frequency capping. | Medium | Add Spring Boot Campaign Orchestrator with `MarketingConsent` tracking and frequency caps. |
| **15. Notifications**| Omnichannel notifications, deduplication, retry policy, delivery tracking, real-time push. | **IMPLEMENTED** (needs WebSocket fix). | Email circuit breakers work well; real-time in-app delivery relies on polling due to WS issues. | High | Connect in-app notification badge to Spring Boot WebSocket STOMP stream with deduplication. |
| **16. Analytics** | Buyer/seller/admin metrics, conversion tracking, revenue reporting, unmet demand detection. | **PARTIALLY IMPLEMENTED**. | Event tracking tables exist; lacks aggregated reporting views and zero-result search analytics. | Medium | Implement analytics aggregation jobs and admin dashboard summary widgets. |
| **17. UX & Mobile** | Responsive web, Android, iOS, lazy-loading, WebP/AVIF, graceful offline/poor network handling. | **IMPLEMENTED**. | Capacitor integration complete; image delivery can be optimized with responsive srcset. | Low | Add image compression guidelines and responsive srcset attributes. |
| **18. Security** | RBAC, JWT validation, resource ownership checks, secret management, rate limiting. | **IMPLEMENTED** (needs network boundary). | Basic auth and security filters exist; need private Docker network isolation for internal services. | Medium | Restrict all internal services to `suqafuran-network`; use shared HMAC for internal API calls. |

---

## 2. Priority Remediation Summary

1. **Immediate Stability Fixes (Phase 1):**
   - Resolve WebSocket routing conflicts in FastAPI and unify token verification.
   - Align frontend configuration to `https://app.suqafuran.com/api/v1`.
   - Add full-text indexes and zero-result search logging.
2. **Safety & Reputation Hardening (Phase 2):**
   - Implement qualified buyer-seller review gating.
   - Calculate genuine response rate and response time metrics.
   - Establish 3-tier AI moderation pipeline.
3. **Spring Boot Infrastructure & Core Services (Phases 3-5):**
   - Deploy Spring Boot modular monolith for Messaging, Billing, Subscriptions, and Entitlements.
   - Enforce distributed idempotency on all financial webhooks and transactions.

