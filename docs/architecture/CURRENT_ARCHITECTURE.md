# SUQAFURAN CURRENT ARCHITECTURE

**Document Version:** 1.0  
**Date:** 2026-11-03  
**Status:** Baseline Document — Phase 0 Deliverable  

---

## 1. System Overview

Suqafuran is an African online classifieds and buy-and-sell platform tailored for mobile-first users across diverse regional markets (Kenya, Somalia, East Africa). The architecture is currently a unified FastAPI application serving a single-page React frontend packaged as a PWA, responsive web application, and mobile apps via Capacitor for Android and iOS.

```
+---------------------------------------------------------------------------------+
|                                 CLIENT PLATFORMS                                |
|  +-------------------------+  +--------------------+  +----------------------+  |
|  | Web Browser (React PWA) |  | Android (Capacitor)|  | iOS (Capacitor)      |  |
|  +-------------------------+  +--------------------+  +----------------------+  |
|  +---------------------------------------------------------------------------+  |
|  | Shops & Agent Portal (Dedicated React/Capacitor App in shops-app/)        |  |
|  +---------------------------------------------------------------------------+  |
+----------------------------------------+----------------------------------------+
                                         | HTTPS / WSS
                                         v
+---------------------------------------------------------------------------------+
|                               EDGE & NETWORKING                                 |
|  Cloudflare Edge (SSL, CDN, DDoS Protection, Flexible SSL Mode)                  |
|                                        |
|  Nginx Reverse Proxy Container (suqafuran-nginx)                                |
|  - SSL termination (app.suqafuran.com)                                          |
|  - Rate limiting (limit_req zone=api)                                           |
|  - Static asset cache (Cache-Control headers for categories/counts)             |
|  - WebSocket proxying (/api/v1/ws/, /api/v1/notifications/ws, /ws)              |
|  - Dynamic DNS upstream re-resolution (127.0.0.11 Docker DNS)                   |
+----------------------------------------+----------------------------------------+
                                         | Docker Bridge (suqafuran-network)
                                         v
+---------------------------------------------------------------------------------+
|                                APPLICATION CORE                                 |
|  +---------------------------------------------------------------------------+  |
|  | FastAPI Application (suqafuran-backend:8000)                              |  |
|  | - Starlette ASGI Framework                                                |  |
|  | - SQLModel / SQLAlchemy ORM (Connection Pool: 5 active + 2 overflow)      |  |
|  | - JWT Bearer Token Security & SlowApi Rate Limiter                         |  |
|  | - Routers: Listings, Categories, Search, Auth, Users, Sellers,             |  |
|  |   Verifications, Subscriptions, Promotions, Messaging, AI, etc.           |  |
|  +---------------------------------------------------------------------------+  |
+-------------------+--------------------+-------------------+--------------------+
                    |                    |                   |
                    v                    v                   v
+-----------------------+ +--------------------+ +-------------------------------+
|  PERSISTENCE & STATE  | | BACKGROUND WORKERS | | TELEMETRY & EVENT STREAMING   |
|  - DigitalOcean       | | - Celery Worker    | | - Kafka (kafka:9092)          |
|    Managed PostgreSQL | |   (4 concurrent)   | | - Zookeeper (zookeeper:2181)  |
|    (Max 25 conn.)     | | - Celery Beat      | | - Jaeger v2 OpenTelemetry     |
|  - Redis 7            | |   (Scheduler)      | |   Traces (jaeger:4317/16686)  |
|    (Cache & Queues)   | | - Tasks: Retention,| | - Prometheus Metrics          |
|  - Cloudinary Media   | |   SMS, Email, Promo| |   (/metrics)                  |
+-----------------------+ +--------------------+ +-------------------------------+
```

---

## 2. Component Details

### 2.1 Frontend Applications
1. **Main Marketplace Application (`src/`)**:
   - **Framework:** React 18 with TypeScript, Vite bundler.
   - **Styling:** Tailwind CSS with Lucide icons.
   - **State Management:** Zustand (`useAuthStore`, `useCurrencyStore`, `useLocationStore`).
   - **Server State / Caching:** `@tanstack/react-query` (5 min stale time, 30 min gcTime).
   - **Mobile Packaging:** Capacitor 8 (`@capacitor/android`, `@capacitor/ios`, `@capacitor/push-notifications`).
   - **Routing:** React Router v7 (`BrowserRouter` on web, `HashRouter` on native platforms).
   - **Bilingual i18n:** `i18next` supporting English and Somali.
2. **Shops & Merchant Application (`shops-app/`)**:
   - Standalone Vite React application for merchants, sellers, and field agents.
   - Features real-time order/lead tracking, inventory management, and agent dashboard.

### 2.2 Backend Application (`backend/`)
- **FastAPI / Python 3.14**: Modular architecture with routes under `backend/app/api/api_v1/`.
- **Database Access:** SQLModel / SQLAlchemy connecting to a remote Managed PostgreSQL cluster on DigitalOcean.
- **Connection Budget:** DigitalOcean max connection limit is **25**. Current pool settings allocate:
  - Backend API: 5 base + 2 overflow = 7
  - Celery Worker: 3 base + 2 overflow = 5
  - Celery Beat: 2 base + 1 overflow = 3
  - Total allocated: 15 / 25 connections, leaving 10 connection headroom.
- **Background Tasks:** Celery using Redis as broker and results backend. Beat scheduler runs recurring marketing SMS and subscription maintenance tasks.

---

## 3. Data Flow Patterns

### 3.1 Authentication & Token Flow
1. User submits phone number or email credentials.
2. For phone login, an OTP is generated and dispatched via Africa's Talking SMS or email.
3. Upon OTP verification or password validation, an HMAC-SHA256 JWT is signed using `SECRET_KEY`.
4. The client stores the token in localStorage and includes `Authorization: Bearer <token>` on subsequent requests.

### 3.2 Listing Creation & Moderation Flow
1. Seller uploads 1 to 10 photos via `POST /api/v1/listings/upload` or `/upload-multiple`.
2. Storage service uploads bytes to Cloudinary and computes perceptual hash (`phash`) asynchronously via `imagehash`.
3. Seller submits listing details to `POST /api/v1/listings/`.
4. `calculate_listing_risk` evaluates listing text for price anomalies, urgency words, and contact leakage.
5. If low risk, listing moves to `pending` or `active`; if high risk, flagged for admin review.

### 3.3 Messaging & Real-Time Notification Flow
1. REST messages are written to `backend/app/models/message.py` via `POST /api/v1/messages/`.
2. If recipient has an active WebSocket or SSE connection, the in-process `ws_manager` delivers the message frame directly.
3. If recipient is offline, a background task queues push notification / SMS alert.

---

## 4. Current Architecture Limitations

| Domain | Issue Description | Consequence |
|---|---|---|
| **Real-time Messaging** | Local in-memory connection manager (`ws_manager`) across multi-process container deployment | Messages cannot cross process boundaries without Redis pub/sub backplane. |
| **Payment Idempotency** | No distributed lock or strict transaction state machine on M-Pesa callbacks | Webhook retry storms or network duplicate requests can trigger double actions. |
| **Entitlements** | Plan limits enforced ad-hoc in router handlers rather than a centralized engine | Feature creep and inconsistent quota enforcement across endpoints. |
| **Search Engine** | SQL ILIKE query scanning text columns without full-text indexes | Degrades as listings grow beyond 10k records; no zero-result logging. |
| **Cold-Start AI** | AI models called synchronously in HTTP request path | Intermittent latency spikes when Groq API encounters network or rate limits. |

