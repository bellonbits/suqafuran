# SUQAFURAN TARGET ARCHITECTURE

**Document Version:** 1.0  
**Date:** 2026-11-03  
**Status:** Architecture Blueprint — Phase 0 Deliverable  

---

## 1. Architectural Philosophy & Principles

The target architecture evolves Suqafuran into an enterprise-grade African marketplace without breaking or rebuilding working components:
1. **Preserve What Works:** Maintain the high-performance FastAPI core for listing ingestion, category taxonomy, search, and buyer/seller interaction.
2. **Selective Modernization with Spring Boot:** Deploy a **Spring Boot Modular Monolith** for mission-critical business transactions: payments, subscription state machines, strict idempotency, entitlements, real-time messaging, and marketing orchestration.
3. **Specialized Python AI/ML Engine:** Maintain Python's native strengths for content moderation, perceptual image hashing, personalized recommendations, and fraud risk classification.
4. **Strict Database Ownership:** No two services write to the same database tables. Cross-service data needs are fulfilled through clean internal REST APIs and event streaming.
5. **Pragmatic Distributed Systems:** Avoid sprawling microservices. Use private Docker networking, Redis Pub/Sub for live state, and transactional outbox patterns for reliable event propagation.

---

## 2. Target System Topology

```
                                  +-----------------------+
                                  |   CLIENT PLATFORMS    |
                                  |  Web, Android, iOS    |
                                  +-----------+-----------+
                                              | HTTPS / WSS
                                              v
                      +-----------------------------------------------+
                      |        NGINX REVERSE PROXY & GATEWAY          |
                      |  - SSL Termination                            |
                      |  - Route Dispatcher                           |
                      |  - Rate Limiting                              |
                      +-------+-------------------------------+-------+
                              |                               |
          /api/v1/listings    |           /api/v1/payments    |
          /api/v1/categories  |           /api/v1/subscript.  |   /api/v1/chat/ws
          /api/v1/search      |           /api/v1/entitlements|   (STOMP / WSS)
          /api/v1/auth        |           /api/v1/promotions  |
          /api/v1/sellers     |           /api/v1/marketing   |
                              v                               v
                +---------------------------+   +---------------------------+
                |    FASTAPI CORE ENGINE    |   |     SPRING BOOT MODULAR   |
                |  (Marketplace & Users)    |   |      BUSINESS MONOLITH    |
                |                           |   |                           |
                | - Listings & Categories   |   | - Billing & M-Pesa Engine |
                | - User & Seller Profiles  |   | - Subscription Lifecycle  |
                | - Full-Text Search        |   | - Entitlement Enforcer    |
                | - Review & Trust Ratings  |   | - Promotions & Ads Engine |
                | - Media Upload Pipeline   |   | - Real-time STOMP Chat    |
                | - Entitlement Check Call  |   | - Campaign Orchestrator   |
                +-------------+-------------+   +-------------+-------------+
                              |                               |
                              | REST Verification             | Events &
                              | Internal Call                 | Tasks
                              +---------------+---------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
       +---------------------------+                     +---------------------------+
       |   PYTHON AI / ML ENGINE   |                     |     REDIS 7 BACKPLANE     |
       | - Hybrid Recommendations  |                     | - Distributed Lock Engine |
       | - Moderation 3-Tier Risk  |                     | - WebSocket Pub/Sub Multi-|
       | - Perceptual Hash Index   |                     |   Instance Message Bus    |
       | - Fraud Scoring Pipeline  |                     | - Presence & Rate Limits  |
       | - Demand Forecasting      |                     | - API Cache Layer         |
       +-------------+-------------+                     +---------------------------+
                     |
                     v
       +-------------------------------------------------------+
       |             MANAGED POSTGRESQL DATABASE               |
       |  +---------------------+     +---------------------+  |
       |  | FastAPI Schema:     |     | Spring Boot Schema: |  |
       |  | - user, listing     |     | - billing_payment   |  |
       |  | - category, subcat  |     | - subscription_plan |  |
       |  | - seller_profile    |     | - subscription      |  |
       |  | - review, favorite  |     | - entitlement       |  |
       |  | - audit_log         |     | - conversation, msg |  |
       |  +---------------------+     +---------------------+  |
       +-------------------------------------------------------+
```

---

## 3. Database Ownership Boundaries

To guarantee transactional consistency and zero write contention:

### 3.1 FastAPI Owned Tables
- `user` (Core identity, contact, password hash, verification status)
- `category`, `subcategory`, `subsubcategory` (Marketplace taxonomy)
- `listing`, `listing_attribute`, `attribute`, `attribute_option`
- `seller_profile`, `seller_settings`
- `review`, `report`, `favorite`, `saved_search`
- `audit_log`, `verification_request`

### 3.2 Spring Boot Owned Tables
- `billing_payment`, `payment_transaction`, `payment_webhook_log`
- `subscription_plan`, `seller_subscription`, `subscription_history`
- `entitlement_grant`, `entitlement_usage`
- `promoted_listing`, `featured_shop`, `ad_campaign`
- `conversation`, `conversation_participant`, `chat_message`, `message_receipt`
- `marketing_campaign`, `campaign_consent`, `campaign_send_history`

### 3.3 AI & Analytics Derived Tables (Read-Only to FastAPI / Spring Boot)
- `marketplace_interaction_event` (Clicks, views, search queries, leads)
- `recommendation_feature_store` (User preference vectors, category affinities)
- `recommendation_cache` (Precomputed recommendations per user/category)
- `moderation_prediction_log` (AI risk score, rule triggers, decision audit)

---

## 4. Subsystems Design

### 4.1 Spring Boot Modular Monolith Architecture
- **Framework:** Spring Boot 3.3+ (Java 21 LTS)
- **Security:** Spring Security with JWT validation (matching existing `SECRET_KEY` and HS256 algorithm).
- **Persistence:** Spring Data JPA with Flyway database migrations under `db/migration/`.
- **Package Structure:**
  ```
  com.suqafuran
  ├── billing          # Payment initiation, M-Pesa Daraja STK Push, reconciliation
  ├── subscriptions    # Subscription lifecycle state machine, plan tiers
  ├── entitlements     # Quotas and permissions enforcement (GET /api/v1/entitlements/{seller_id})
  ├── messaging        # Real-time STOMP WebSocket, Redis connection cluster, cursor history
  ├── promotions       # Promoted listings, advertising campaigns, banner placements
  ├── marketing        # Campaign scheduling, audience segmentation, consent tracking
  ├── audit            # Immutable financial and administrative audit trail
  └── config           # Redis, Security, WebMvc, Actuator configs
  ```

### 4.2 Payment State Machine & Idempotency Guarantees
All financial transactions follow an explicit, deterministic state machine:
```
           +--------------------+
           |      PENDING       |
           +---------+----------+
                     |
                     v
           +--------------------+
           |     PROCESSING     |
           +----+----------+----+
                |          |
      Callback  |          | Callback
      Success   |          | Failed / Timeout
                v          v
  +------------------+   +------------------+
  |    SUCCESSFUL    |   |      FAILED      |
  +--------+---------+   +------------------+
           |
           v (Refund initiated)
  +------------------+
  |     REFUNDED     |
  +------------------+
```
- **Idempotency Key:** Every payment initiation requires a client-generated or server-assigned UUID `idempotency_key`. A unique database constraint on `(idempotency_key, seller_id)` prevents double-charges.
- **Provider Reference Lock:** M-Pesa `CheckoutRequestID` and `MpesaReceiptNumber` are stored with unique constraints. A repeated callback from Safaricom returns HTTP 200 immediately without double-activating benefits.
- **No Frontend Trust:** Subscription benefits are activated **only** upon cryptographically validated backend webhook confirmation or server-to-server query verification.

### 4.3 Subscription & Entitlements Engine
- When a seller attempts to publish a listing, FastAPI queries Spring Boot's internal endpoint:
  ```http
  GET /internal/v1/entitlements/sellers/{seller_id}
  Authorization: Bearer <internal_service_token>
  ```
- **Response Format:**
  ```json
  {
    "seller_id": 104,
    "plan": "pro",
    "status": "ACTIVE",
    "expires_at": "2026-12-01T00:00:00Z",
    "quotas": {
      "max_active_listings": 100,
      "current_active_listings": 42,
      "can_create_listing": true
    },
    "features": [
      "VERIFIED_BADGE",
      "ANALYTICS_DASHBOARD",
      "TOP_SEARCH_BOOST"
    ]
  }
  ```
- If `can_create_listing` is false, FastAPI rejects creation with HTTP 403 and payload advising plan upgrade.

### 4.4 Real-Time Messaging with Redis Pub/Sub
- The WebSocket layer moves to Spring Boot utilizing STOMP over WebSocket:
  - Client connects to `wss://app.suqafuran.com/api/v1/chat/ws`.
  - Spring Boot registers the user connection in a distributed Redis presence set: `presence:users:{user_id}`.
  - When User A sends a message to User B:
    1. Message is validated and written to PostgreSQL with status `SENT`.
    2. Spring Boot publishes message event to Redis topic `chat:user:{recipient_id}`.
    3. The specific Spring Boot node holding User B's active WebSocket connection receives the Redis pub/sub frame and pushes it to User B over STOMP topic `/topic/messages/{user_id}`.
    4. Client acknowledges receipt -> status updates to `DELIVERED` -> sender notified.

### 4.5 Python AI Recommendation & Moderation Engine
- **Moderation Pipeline:**
  - Fast-path deterministic rule filtering (phone/link regex, spam dictionaries).
  - Image perceptual hash distance check against known banned image catalog.
  - Asynchronous background classification using Groq Llama for nuanced fraud and prohibited item detection.
- **Hybrid Recommendation Engine:**
  - Content-based filtering: TF-IDF & attribute embeddings across title/category/location.
  - Collaborative ranking: Implicit feedback signals (product views, searches, favourites, chats started).
  - High-performance cached endpoints:
    - `GET /api/v1/recommendations/home` (Personalized or trending fallback)
    - `GET /api/v1/recommendations/similar/{listing_id}` (Nearest neighbors by category & attributes)

---

## 5. Security & Network Boundary

- **Private Docker Network:** All inter-service traffic (FastAPI <-> Spring Boot <-> Redis <-> Postgres <-> Celery) operates on `suqafuran-network`.
- **Public Surface:** Only Nginx ports 80 and 443 are exposed to the internet.
- **Service-to-Service Authentication:** Mutual pre-shared HMAC authentication (`X-Internal-Service-Key`) for internal API calls between FastAPI and Spring Boot.
- **Credential Storage:** Centralized in Docker environment variables with `.env` injection; zero secrets committed in source code.

