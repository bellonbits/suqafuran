# SUQAFURAN INITIAL CODEBASE & INFRASTRUCTURE AUDIT

**Version:** 1.0  
**Audit Date:** 2026-11-03  
**Status:** Complete — Phase 0 Deliverable  
**Auditor:** Principal Software Architect & Engineering Team  

---

## 1. Executive Summary

Suqafuran is an African buy-and-sell classifieds marketplace inspired by Jiji, connecting buyers and sellers across mobile (Android/iOS via Capacitor) and web (React/Vite). The backend is currently built with Python (FastAPI, SQLModel/SQLAlchemy) with Celery, Redis, PostgreSQL (DigitalOcean Managed Database), Nginx reverse proxy, and Kafka/Jaeger monitoring telemetry.

This audit evaluates the codebase to prepare for evolution into an enterprise-grade platform incorporating a **Spring Boot Business & Messaging Modular Monolith**, an **Intelligent Python AI/ML Recommendation & Moderation Engine**, and a hardened **FastAPI Marketplace Core**.

---

## 2. Audit Classification Matrix

Every feature is classified into one of five statuses:
1. **IMPLEMENTED** — Fully implemented in backend, frontend, and database; verified with passing tests or code review.
2. **PARTIALLY IMPLEMENTED** — Some backend or frontend functionality exists, but integration is incomplete or missing edge case handling.
3. **BROKEN** — Exists in code or schema, but fails at runtime due to architectural, configuration, or routing faults.
4. **MISSING** — Desired feature not yet implemented.
5. **NEEDS VERIFICATION** — Insufficient evidence or depends on live external third-party services (e.g. Safaricom Daraja M-Pesa in production).

---

## 3. Comprehensive Domain Audit

### 3.1 Listings Management
- **Status:** **IMPLEMENTED** (with optimization opportunities)
- **Existing Implementation:**
  - Full CRUD operations for listings with bilingual support (English `title_en`/`description_en` and Somali `title_so`/`description_so`).
  - Image upload with perceptual hashing (`phash`) using `imagehash` for duplicate image detection.
  - Draft, active, closed, reported, and deleted listing statuses.
  - Price negotiation indicator (`is_negotiable`) and discount pricing (`compare_at_price`).
  - Condition tracking (`New`, `Used`, `Refurbished`).
  - Category, subcategory, and sub-subcategory hierarchical assignments.
  - Admin approval and rejection workflows with moderation notes.
- **Relevant File Paths:**
  - Backend: `backend/app/models/listing.py`, `backend/app/api/api_v1/endpoints/listings.py`, `backend/app/crud/crud_listing.py`, `backend/app/services/storage_service.py`
  - Frontend: `src/pages/ListingFormPage.tsx`, `src/pages/ProductDetailPage.tsx`, `src/pages/ListingDetailPage.tsx`, `src/pages/MyAdsPage.tsx`, `src/services/listingService.ts`
- **Existing API Endpoints:**
  - `POST /api/v1/listings/upload`
  - `POST /api/v1/listings/upload-multiple`
  - `GET /api/v1/listings/`
  - `POST /api/v1/listings/`
  - `GET /api/v1/listings/{id}`
  - `PUT /api/v1/listings/{id}`, `PATCH /api/v1/listings/{id}`, `DELETE /api/v1/listings/{id}`
  - `POST /api/v1/listings/{listing_id}/approve`
  - `POST /api/v1/listings/{listing_id}/reject`
- **Existing Database Models:** `Listing`, `ListingRead`, `Category`, `Subcategory`, `SubSubCategory`
- **Identified Problems:**
  - `backend/main.py` still mounts legacy delivery and order routes (`/orders`, `/rate-delivery`, etc.) that reference an old delivery model not aligned with the pure classifieds model.
  - Listing images rely on direct upload; signed client upload URLs should be added for multi-part large image payloads.
- **Recommended Improvements:**
  - Enforce seller subscription entitlements on listing creation (e.g., maximum active listings limit per tier).
  - Add soft-expiry background jobs with automatic renewal notifications.
- **Implementation Priority:** High (Phase 1 Stability / Phase 5 Entitlements)

---

### 3.2 Category & Attribute Hierarchy
- **Status:** **IMPLEMENTED**
- **Existing Implementation:**
  - 3-tier taxonomy: `Category` -> `Subcategory` -> `SubSubCategory`.
  - Dynamic attribute schema stored as JSON (`attributes_schema`).
  - Pre-seeded categories including Fashion, Electronics, Vehicles, Health & Beauty, Household, Food & Groceries.
  - Attribute filtering on search endpoints.
- **Relevant File Paths:**
  - Backend: `backend/app/models/category_attribute.py`, `backend/app/models/subcategory.py`, `backend/app/api/api_v1/endpoints/subcategories.py`, `backend/app/api/api_v1/endpoints/category_attributes.py`, `backend/seed_categories.py`
  - Frontend: `src/pages/CategoryListingPage.tsx`, `src/pages/admin/AdminCategoriesPage.tsx`
- **Identified Problems:**
  - Category attributes schema validation needs caching to prevent repeated DB joins on high-traffic category listing views.
- **Recommended Improvements:**
  - Cache category tree in Redis with TTL and invalidation on admin update.
- **Implementation Priority:** Medium (Phase 1)

---

### 3.3 Marketplace Search & Filtering
- **Status:** **PARTIALLY IMPLEMENTED**
- **Existing Implementation:**
  - SQL ILIKE search on titles and descriptions.
  - Filtering by category, subcategory, price bounds, and JSON attributes.
  - Boost priority and featured listing sorting.
  - Saved searches endpoint (`backend/app/api/api_v1/endpoints/saved_searches.py`).
- **Relevant File Paths:**
  - Backend: `backend/app/api/api_v1/endpoints/search.py`, `backend/app/models/saved_search.py`
  - Frontend: `src/pages/SearchResultsPage.tsx`
- **Identified Problems:**
  - Search relies on standard SQL `ILIKE '%query%'` queries, which cannot use standard B-Tree indexes and will degrade under high listing volumes.
  - "Zero-results" searches are not logged to identify unmet marketplace demand.
  - Autocomplete / search suggestions rely on frontend debounce without dedicated backend index.
- **Recommended Improvements:**
  - Introduce PostgreSQL trigram (`pg_trgm`) or tsvector full-text search indexes.
  - Log every zero-result search event to Kafka / analytics table for demand forecasting.
  - Provide auto-suggest API with popular cached queries.
- **Implementation Priority:** High (Phase 1 Stability / Phase 7 Search Intelligence)

---

### 3.4 Seller Verification, Reputation & Trust
- **Status:** **PARTIALLY IMPLEMENTED**
- **Existing Implementation:**
  - Multi-tier verification levels defined in enum `UserVerifiedLevel` (`guest`, `phone`, `id`, `tier1`, `tier2`, `tier3`, `premium`, `trusted`).
  - Trust level enum `TrustLevel` (`NEW`, `ESTABLISHED`, `VERIFIED`, `TRUSTED`).
  - Verification request submission with document URL (`VerificationRequest`).
  - Reviews and ratings endpoints (`backend/app/api/api_v1/endpoints/reviews.py`).
- **Relevant File Paths:**
  - Backend: `backend/app/models/user.py`, `backend/app/models/verification.py`, `backend/app/models/review.py`, `backend/app/api/api_v1/endpoints/verifications.py`, `backend/app/api/api_v1/endpoints/reviews.py`
  - Frontend: `src/pages/VerificationPage.tsx`, `src/pages/PhoneVerificationPage.tsx`, `src/pages/SellerProfilePage.tsx`, `src/pages/admin/AdminVerificationsPage.tsx`
- **Identified Problems:**
  - Response rate and median response time are largely static placeholders on seller profiles (`response_time: "Typically responds in a few hours"`).
  - Review submission lacks strict gating to prevent fake reviews (needs qualified interaction check between buyer and seller).
- **Recommended Improvements:**
  - Real-time calculation of seller response rate and median response time derived from conversation messages.
  - Evidence-based verification audit trail with anti-forgery checks.
  - Review gating: require at least 2 exchanges in a conversation before review eligibility.
- **Implementation Priority:** High (Phase 2 Trust & Safety)

---

### 3.5 Real-Time Messaging & WebSocket System
- **Status:** **BROKEN / INCONSISTENT**
- **Existing Implementation:**
  - Multiple overlapping messaging and websocket implementations exist:
    1. Legacy websocket router in `backend/routers/websocket_routes.py` (which only exposes REST endpoints, no actual websocket).
    2. Endpoint `/ws/chat` in `backend/app/api/api_v1/endpoints/chat_ws.py`.
    3. Endpoint `/notifications/ws` in `backend/app/api/api_v1/endpoints/notifications_ws.py` (imported in `api.py` but NOT included in `api_router`).
    4. Endpoint `/ws` in `backend/app/api/api_v1/endpoints/notifications.py` mounted at `/api/v1/notifications/ws`.
    5. SSE fallback endpoint `/api/v1/notifications/sse` in `notifications.py`.
    6. REST conversation endpoints in `backend/app/api/api_v1/endpoints/conversations.py` and `messages.py`.
- **Root Cause Analysis of Production WebSocket Failure (`wss://app.suqafuran.com/api/v1/notifications/ws`):**
  1. **Router Shadowing:** `notifications_ws.py` and `notifications.py` both attempt to bind websocket endpoints under `/notifications/ws` with conflicting auth handlers.
  2. **Token Passing & Auth Handshake:** Starlette/FastAPI websocket queries extract `token` from query params. In `notifications.py`, if token decoding fails or token expired, it accepts and then immediately sends error and closes with WS_1008; in multiple frontends (`shops-app` vs main `src`), token format and error handling cause instant reconnection storms.
  3. **Multi-Worker Memory Isolation:** The websocket connection manager (`ws_manager`) stores active WebSocket instances in local Python process memory (`self.user_connections = {}`). Because Uvicorn runs in Docker behind Nginx, if multiple worker processes or containers exist, WebSocket connections on Worker A cannot receive messages pushed by HTTP requests hitting Worker B without a Redis pub/sub backplane!
  4. **Nginx HTTP/2 Protocol Conflict:** Open-source Nginx does not support RFC 8441 (WebSockets over HTTP/2). When clients connect over HTTP/2, WebSocket upgrade fails with code 1006. (Nginx config disabled http2 on port 443 specifically for this, but Cloudflare proxy edge may re-enable HTTP/2 unless configured).
- **Recommended Improvements:**
  - Consolidate real-time messaging into the dedicated **Spring Boot Messaging Service** with STOMP over WebSocket and Redis Pub/Sub backplane.
  - Implement bidirectional heartbeats, message acknowledgment, and cursor-based message history.
- **Implementation Priority:** Critical (Phase 1 Stability & Phase 4 Messaging)

---

### 3.6 Billing, Payments & Idempotency
- **Status:** **PARTIALLY IMPLEMENTED / NEEDS HARDENING**
- **Existing Implementation:**
  - M-Pesa Daraja STK Push integration (`backend/app/api/api_v1/endpoints/payments.py`, `backend/services/mpesa_service.py`).
  - Mobile transaction tracking in `backend/app/models/mobile_money.py`.
  - Manual agent matching queue in `backend/app/api/api_v1/endpoints/promotions.py`.
- **Identified Problems:**
  - **No strict distributed idempotency lock:** Repeated webhook calls or duplicate frontend submissions can trigger race conditions.
  - Payment status changes are done in disparate endpoints (`payments.py`, `promotions.py`, `subscriptions.py`).
  - Frontend payment confirmation is partially trusted in some trial/boost workflows.
- **Recommended Improvements:**
  - Move payment orchestration, transaction state machine, and idempotency guarantees to **Spring Boot Billing & Payments Service**.
  - Enforce unique idempotency keys (`idempotency_key`), provider reference uniqueness (`provider_transaction_id`), and distributed Redis/DB locking.
- **Implementation Priority:** High (Phase 5 Billing & Subscriptions)

---

### 3.7 Subscriptions & Entitlements
- **Status:** **PARTIALLY IMPLEMENTED**
- **Existing Implementation:**
  - Subscription models: `Subscription`, `SubscriptionPlan`, `SubscriptionFeature` in `backend/app/models/subscription.py`.
  - Endpoints in `backend/app/api/api_v1/endpoints/subscriptions.py`.
  - Plans: Basic, Pro, Business/Enterprise with listing count limits and badges.
- **Identified Problems:**
  - Entitlement enforcement is fragmented: some endpoints check seller subscription, while others permit listing creation without validating against plan quotas.
  - No unified entitlement check endpoint (e.g. `GET /api/v1/entitlements/{seller_id}`).
  - Lifecycle state machine (trial -> active -> past_due -> canceled -> expired) lacks automated grace-period job.
- **Recommended Improvements:**
  - Migrate subscription state machine and entitlements engine to Spring Boot.
  - Expose clean REST API `/api/v1/entitlements/{seller_id}` consumed by FastAPI before allowing listing/promotion actions.
- **Implementation Priority:** High (Phase 3 & Phase 5)

---

### 3.8 Promotions & Featured Advertising
- **Status:** **IMPLEMENTED** (with billing consolidation required)
- **Existing Implementation:**
  - Promoted products, featured listings, and banner advertisements.
  - Discount codes and marketing codes.
  - Agent-assisted promotion matching and verification.
- **Relevant File Paths:**
  - Backend: `backend/app/models/promotion.py`, `backend/app/models/advertising.py`, `backend/app/api/api_v1/endpoints/promotions.py`, `backend/app/api/api_v1/endpoints/advertising.py`
  - Frontend: `src/pages/PromotionPage.tsx`, `src/pages/admin/AdminPromotionsPage.tsx`
- **Recommended Improvements:**
  - Distinguish organic from paid listings clearly with visual "Promoted" badges.
  - Connect promotion activations directly to Spring Boot payment verification.
- **Implementation Priority:** Medium (Phase 6)

---

### 3.9 AI Moderation, Fraud Detection & Risk Scoring
- **Status:** **PARTIALLY IMPLEMENTED**
- **Existing Implementation:**
  - Rule-based message screening (`PHONE_PATTERNS`, `OFF_PLATFORM_PATTERNS`, `ADVANCE_PAY_PATTERNS` in `moderation_service.py`).
  - Listing risk calculation (`calculate_listing_risk` in `screening_service.py` based on price anomaly, urgency words, contact info leaks).
  - Perceptual image hashing (`imagehash.phash`) in `storage_service.py`.
  - Groq Llama AI integration for content improvement and translation (`ai_service.py`).
- **Identified Problems:**
  - Groq API is called synchronously in some request paths, adding latency.
  - Moderation outcomes do not follow a formal 3-tier risk decision tree (LOW = auto-approve, MEDIUM = queue for review, HIGH = auto-hold).
  - No administrative AI audit review queue showing model reasoning and decision feedback.
- **Recommended Improvements:**
  - Formalize 3-tier risk decision pipeline:
    - Low Risk (< 25): Auto-approve.
    - Medium Risk (25-70): Hold for human moderator review.
    - High Risk (> 70): Quarantine and flag for fraud investigation.
  - Decouple AI calls into asynchronous Celery/Kafka worker pipelines.
- **Implementation Priority:** High (Phase 2 Trust & Safety / Phase 7 AI)

---

### 3.10 Recommendations & Personalization
- **Status:** **PARTIALLY IMPLEMENTED**
- **Existing Implementation:**
  - Marketing SMS recommendation generator in `backend/app/services/marketing_sms_service.py` (queries user category views and finds top items).
  - Retention email task with recommendations in `backend/app/tasks/retention_tasks.py`.
  - Basic Groq recommendation endpoint in `backend/app/api/api_v1/endpoints/ai.py`.
- **Identified Problems:**
  - Recommendations are primarily generated on-the-fly for outbound SMS/emails, but lack real-time home/feed APIs (`/recommendations/home`, `/recommendations/similar/{id}`).
  - User event tracking is fragmented across `interactions.py`, `analytics_tracking.py`, and `tracking.py`.
- **Recommended Improvements:**
  - Build unified Python Recommendation Engine providing:
    - `GET /api/v1/recommendations/home`
    - `GET /api/v1/recommendations/products`
    - `GET /api/v1/recommendations/similar/{listing_id}`
  - Implement fallback strategies for cold-start (unauthenticated) users based on popularity and locality.
- **Implementation Priority:** High (Phase 7 AI & Recommendations)

---

### 3.11 Marketing Automation & Consent Management
- **Status:** **PARTIALLY IMPLEMENTED**
- **Existing Implementation:**
  - Multi-channel delivery: SMS (Africa's Talking), Email (Resend / Brevo with fallback and circuit breakers), In-app push notifications.
  - Celery Beat scheduled jobs for marketing campaigns and retention emails.
  - Marketing codes and customer segmentation endpoints in `backend/app/api/api_v1/endpoints/customer_segments.py`.
- **Identified Problems:**
  - Explicit marketing consent timestamps and opt-out tracking need strict separation from transactional OTP/security notifications.
  - Regulatory compliance with Kenyan Data Protection Act (KDPA) requires documented opt-in source and frequency capping (e.g. max 2-3 marketing communications per week).
- **Recommended Improvements:**
  - Implement formal `MarketingConsent` tracking in database with opt-in/opt-out audit timestamps.
  - Orchestrate campaign business logic in Spring Boot, with AI-driven content generation from Python.
- **Implementation Priority:** Medium (Phase 8 Marketing Automation)

---

### 3.12 Notifications System
- **Status:** **IMPLEMENTED** (with real-time delivery consolidation needed)
- **Existing Implementation:**
  - Resilient email dispatch with CircuitBreaker pattern across Resend, Brevo, and SMTP.
  - SMS dispatch via Africa's Talking.
  - In-app notification polling (`NotificationPoller.tsx` on frontend).
  - Push notification integration via Capacitor Push Notifications.
- **Identified Problems:**
  - Real-time in-app delivery relies heavily on HTTP polling (every 30s) due to WebSocket reliability issues.
- **Recommended Improvements:**
  - Restore reliable WebSocket notification streaming via Spring Boot / STOMP.
  - Implement notification deduplication keys across all channels.
- **Implementation Priority:** High (Phase 4 Messaging & Notifications)

---

### 3.13 Marketplace Analytics & Business Intelligence
- **Status:** **PARTIALLY IMPLEMENTED**
- **Existing Implementation:**
  - Tracking models in `backend/app/models/analytics.py` and `backend/app/models/interaction.py`.
  - Seller analytics endpoint `backend/app/api/api_v1/endpoints/analytics_sellers.py`.
  - Admin email analytics in `backend/app/api/api_v1/endpoints/admin_email_analytics.py`.
  - Prometheus metrics exposed at `/metrics` and Jaeger OpenTelemetry tracing.
- **Identified Problems:**
  - Zero-result search queries are not tracked.
  - Search-to-chat conversion metrics are not aggregated.
  - Seller response times are not continuously calculated.
- **Recommended Improvements:**
  - Add materialized or scheduled rollup views for marketplace metrics (active listings, conversion rate, search-to-chat ratio, zero-result terms).
- **Implementation Priority:** Medium (Phase 9 Scale & Analytics)

---

### 3.14 Security & Infrastructure Architecture
- **Status:** **PARTIALLY IMPLEMENTED / HARDENED LOCALLY**
- **Existing Implementation:**
  - Docker Compose with Nginx, Redis, Kafka, Zookeeper, Jaeger, Celery Worker, Celery Beat, and Backend.
  - Rate limiting on API routes via SlowApi and Nginx zones.
  - JWT authentication with Bearer tokens.
  - Password hashing via Passlib/Bcrypt.
- **Identified Problems:**
  - `kafka-ui` and `jaeger` previously lacked local host binding in older configs (now fixed to `127.0.0.1`).
  - Production database connection pool sizing requires careful coordination across FastAPI, Celery, and Spring Boot to stay within the DigitalOcean connection limit (25 max connections).
  - Frontend `.env.production` had `VITE_API_URL=https://api.suqafuran.com/api/v1` whereas Nginx server was configured for `app.suqafuran.com`.
- **Recommended Improvements:**
  - Keep internal service communication on Docker bridge network (`suqafuran-network`).
  - Size connection pools strictly across services: FastAPI (5+2), Spring Boot (6+2), Celery (3+2), Celery Beat (1+1).
- **Implementation Priority:** High (Phase 1 & Phase 3)

---

## 4. Test Suite Audit

- **Existing Tests:** 71 automated tests in `backend/tests/`.
- **Test Execution Status:**
  - Ran via: `PYTHONPATH=backend backend/.venv/bin/python3 -m unittest discover -s backend/tests`
  - Result: **71 tests passed, 0 failures, 1 skipped**.
  - Verified test coverage: Circuit breakers, cache service, singletons, email strategies, marketing emails, SMS adapter, messaging & notifications, rider delivery system, security audit.
- **Test Gaps:**
  - Missing integration tests for M-Pesa webhook idempotency and replay attacks.
  - Missing end-to-end WebSocket connection and reconnection lifecycle tests.
  - Missing test coverage for subscription entitlement enforcement on listing creation.
- **Remediation Plan:** Add comprehensive test suites for Spring Boot services and Python API integration during Phases 3-5.

