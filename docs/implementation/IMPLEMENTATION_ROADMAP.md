# SUQAFURAN IMPLEMENTATION ROADMAP

**Document Version:** 1.0  
**Date:** 2026-11-03  
**Status:** Approved Roadmap — Phase 0 Deliverable  

---

## 1. Roadmap Overview & Phasing

This roadmap organizes the evolution of Suqafuran into 10 structured phases (Phase 0 through Phase 9). Each phase produces concrete, tested deliverables before the next phase begins.

```
[Phase 0: Audit & Architecture] (Current)
           |
           v
[Phase 1: Stability & Foundation Fixes]
  - Resolve WebSocket routing & multi-worker state
  - Fix domain/origin mismatch (api.suqafuran.com vs app.suqafuran.com)
  - Full-text search optimization & zero-result query capture
           |
           v
[Phase 2: Seller Trust, Reputation & Moderation Pipeline]
  - Verified seller badge & evidence audit trail
  - Dynamic seller response rate calculation
  - Gated review system (qualified interaction check)
  - 3-tier listing moderation (Low / Medium / High risk)
           |
           v
[Phase 3: Spring Boot Modular Monolith Foundation]
  - Spring Boot 3.3 (Java 21 LTS) scaffolding with Flyway
  - Spring Security JWT shared auth integration
  - Actuator health, Prometheus metrics, and Docker service
           |
           v
[Phase 4: Real-Time Messaging Engine]
  - STOMP over WebSocket with Redis Pub/Sub backplane
  - Typing indicators, read receipts, cursor pagination
  - Bi-directional reconnect & duplicate delivery protection
           |
           v
[Phase 5: Billing, Payments & Subscriptions]
  - M-Pesa STK Push orchestration & webhook verification
  - Strict distributed idempotency & payment state machine
  - Subscription lifecycle management & FastAPI Entitlements API
           |
           v
[Phase 6: Promotions & Featured Advertising]
  - Paid listing boosts & featured shop placements
  - Promotion expiration background scheduler
  - Clear organic vs sponsored visual differentiation
           |
           v
[Phase 7: AI & Personalized Recommendations Engine]
  - Marketplace event tracking pipeline (clicks, searches, chats)
  - Python hybrid recommendation engine (/recommendations/home, /similar)
  - Perceptual image hashing duplicate detection at scale
           |
           v
[Phase 8: Marketing Automation & Consent Management]
  - Campaign orchestration & audience segmentation in Spring Boot
  - Consent tracking (opt-in/opt-out with timestamps, KDPA compliant)
  - Scheduled SMS/Email/Push marketing dispatches
           |
           v
[Phase 9: Marketplace Analytics & Scaling]
  - Business intelligence dashboards (conversion, revenue, zero-result searches)
  - Regional market localization & cache layer optimizations
```

---

## 2. Phase-by-Phase Execution Plan

### Phase 0 — Audit & Architecture (Completed)
- **Objective:** Exhaustively audit current repository, models, APIs, frontend routes, and deployment topology.
- **Deliverables:**
  - `docs/architecture/INITIAL_AUDIT.md`
  - `docs/architecture/CURRENT_ARCHITECTURE.md`
  - `docs/architecture/TARGET_ARCHITECTURE.md`
  - `docs/implementation/IMPLEMENTATION_ROADMAP.md`
  - `docs/implementation/FEATURE_GAP_ANALYSIS.md`

---

### Phase 1 — Stability & Foundation Fixes
- **Target Timeline:** Immediate Next Step
- **Work Packages:**
  1. **WebSocket Fix:** Unify WebSocket routing in FastAPI, eliminating conflicting endpoints in `notifications.py` and `notifications_ws.py`. Add Redis-backed connection broadcast for multi-worker support.
  2. **API Endpoint Normalization:** Align frontend environment configs (`.env.production`, `src/services/api.ts`) to consistently target `https://app.suqafuran.com/api/v1`.
  3. **Search Performance:** Implement trigram / TSVector indexing on `listing.title_en`, `title_so`, `description_en`, and `description_so`. Add zero-result search logging.
  4. **Connection Pool Safety:** Enforce strict DB pool quotas across Docker services (FastAPI: 5+2, Celery: 3+2, Celery Beat: 1+1).
- **Verification:** Unit tests passing, live WebSocket connection verified without HTTP 1006 drops, search latency under 50ms.

---

### Phase 2 — Seller Trust, Reputation & Safety
- **Target Timeline:** Following Phase 1
- **Work Packages:**
  1. **Seller Performance Metrics:** Compute actual response rate and median response time from conversation message history rather than hardcoded text.
  2. **Review Gating:** Restrict review submission to buyers with genuine chat interactions (at least 2 messages exchanged) with the seller.
  3. **Verification Levels:** Evidence-based verification flow with distinct tiers (`phone_verified`, `id_verified`, `business_verified`).
  4. **AI Moderation Pipeline:** Implement 3-tier risk classification (Auto-Approve, Hold for Review, Quarantine).
- **Verification:** Security and review tests passing; zero false suspensions.

---

### Phase 3 — Spring Boot Modular Monolith Scaffolding
- **Target Timeline:** Following Phase 2
- **Work Packages:**
  1. **Project Setup:** Initialize Spring Boot 3.3+ project with Java 21 LTS, Gradle/Maven wrapper, Spring Data JPA, Spring Security, and Flyway.
  2. **Security & JWT:** Implement JWT token filter validating existing FastAPI JWT tokens (`HS256`, shared `SECRET_KEY`).
  3. **Docker Integration:** Add `suqafuran-spring` container to `docker-compose.yml` with memory bounds (e.g. max heap `-Xmx512m`) on private network.
  4. **Health & Observability:** Configure Spring Boot Actuator with `/actuator/health` and Prometheus metrics.
- **Verification:** Spring Boot container boots cleanly, passes test suites, and runs under 400MB resident memory.

---

### Phase 4 — Spring Boot Real-Time Messaging Engine
- **Target Timeline:** Following Phase 3
- **Work Packages:**
  1. **WebSocket & STOMP:** Configure Spring WebSocket with STOMP protocol at `/api/v1/chat/ws`.
  2. **Redis Message Bus:** Connect Spring WebSocket to Redis Pub/Sub for multi-instance cluster support.
  3. **Messaging Features:** Implement typing indicators, sent/delivered/read statuses, cursor-based message pagination, image attachments, and block/report actions.
  4. **Frontend Integration:** Update React and Shops-app chat components to connect to STOMP endpoint with automatic exponential backoff reconnect.
- **Verification:** Real-time messaging test across two active client sessions with message receipt acknowledgment and zero lost messages.

---

### Phase 5 — Billing, Payments & Subscriptions
- **Target Timeline:** Following Phase 4
- **Work Packages:**
  1. **Payment Engine:** Implement Safaricom M-Pesa Daraja STK Push initiation and callback verification.
  2. **Idempotency Guarantees:** Enforce unique `idempotency_key` and database locking to prevent duplicate billing.
  3. **Subscription Lifecycle:** Implement subscription state machine (`PENDING`, `ACTIVE`, `PAST_DUE`, `GRACE_PERIOD`, `CANCELED`, `EXPIRED`).
  4. **FastAPI Entitlement Enforcement:** Expose internal endpoint `GET /internal/v1/entitlements/sellers/{id}`. Update FastAPI listing creation to check entitlement limits.
- **Verification:** Webhook replay attack tests pass; subscription activates only upon verified payment.

---

### Phase 6 — Promotions & Featured Advertising
- **Target Timeline:** Following Phase 5
- **Work Packages:**
  1. **Promoted Listings:** Support featured product boosts, homepage banner slots, and top-of-category placements.
  2. **Billing Integration:** Link promotion activations directly to verified payments.
  3. **Ad Expiration Scheduler:** Background task automatically deactivates expired promotions and notifies sellers.
  4. **UI Transparency:** Visually badge promoted items to maintain organic search integrity.
- **Verification:** Promoted listings rank properly; expired listings revert to standard rank automatically.

---

### Phase 7 — AI & Personalized Recommendations Engine
- **Target Timeline:** Following Phase 6
- **Work Packages:**
  1. **Event Tracking Bus:** Track marketplace events (`ProductViewed`, `ProductSearched`, `ChatStarted`, `ProductFavorited`).
  2. **Hybrid Recommendation Service:** Build Python recommendation service exposing `GET /api/v1/recommendations/home` and `/similar/{id}` with cold-start fallbacks.
  3. **Perceptual Image Hashing:** High-throughput duplicate image detection using `imagehash`.
- **Verification:** Recommendation endpoint returns relevant items under 100ms; zero dependencies on external LLM for core page loads.

---

### Phase 8 — Marketing Automation & Consent Management
- **Target Timeline:** Following Phase 7
- **Work Packages:**
  1. **Consent Registry:** Track explicit opt-in, opt-out, and channel preferences with ISO timestamps.
  2. **Campaign Orchestrator:** Spring Boot campaign scheduler supporting SMS, Email, and Push notifications.
  3. **Frequency Capping:** Enforce limits (e.g. maximum 2-3 marketing communications per week).
- **Verification:** Unsubscribed users receive zero marketing dispatches; transactional OTPs remain deliverable.

---

### Phase 9 — Marketplace Analytics & Scaling
- **Target Timeline:** Following Phase 8
- **Work Packages:**
  1. **Business Intelligence:** Aggregate marketplace metrics (conversion rates, search-to-chat ratios, revenue rollups, zero-result search analytics).
  2. **Admin Dashboards:** Build admin overview widgets displaying real-time platform health and demand indicators.
  3. **Database Performance Tuning:** Verify all composite query indexes and analyze execution plans.
- **Verification:** Reporting queries execute efficiently without table scans; zero-result demand reports visible in admin panel.

---

## 3. Resource & Memory Budget (VPS Sizing)

Current target environment is a DigitalOcean Droplet (e.g., 8GB RAM, 4 vCPUs):
- **FastAPI Backend:** 400 MB RAM
- **Spring Boot Modular Monolith:** 512 MB RAM (`-Xms256m -Xmx512m`)
- **Celery Worker & Beat:** 300 MB RAM
- **Redis 7:** 150 MB RAM
- **Nginx:** 50 MB RAM
- **Kafka & Zookeeper:** 1.2 GB RAM
- **Jaeger Telemetry:** 300 MB RAM
- **System OS & Buffers:** 1.5 GB RAM
- **Total Projected Footprint:** ~4.4 GB / 8.0 GB RAM (healthy 45% headroom).

