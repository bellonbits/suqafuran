#!/usr/bin/env python3
"""
Generator script to compile the complete, comprehensive reference documentation
for Suqafuran (Front-end and Back-end) into suqafuran_front_and_back.txt.
"""
import sys
import os

OUTPUT_FILE = "/Users/mac/suqafuran/suqafuran_front_and_back.txt"

def build_documentation():
    sections = []
    
    # Header
    sections.append("""================================================================================
                    SUQAFURAN PLATFORM ARCHITECTURE & SYSTEM GUIDE
                     COMPLETE FRONT-END AND BACK-END SPECIFICATION
================================================================================
Generated for: Suqafuran Engineering & Operations
Project Workspace: /Users/mac/suqafuran
Platform Type: Multi-Sided Classifieds & E-Commerce Marketplace (Web, iOS, Android)
Primary Target Markets: Kenya, Somalia, East Africa, Pan-African Diaspora
Last Updated: October 2026
Status: Production-Grade System Reference
================================================================================
""")

    # Table of Contents
    sections.append("""
TABLE OF CONTENTS
-----------------
1.  EXECUTIVE OVERVIEW & ECOSYSTEM
    1.1 Mission & Value Proposition
    1.2 The Multi-Sided Marketplace Model
    1.3 Key Innovations & African Market Solutions

2.  HIGH-LEVEL ARCHITECTURE & TOPOLOGY
    2.1 System Architecture Diagram
    2.2 Technology Stack Matrix
    2.3 Infrastructure & Container Topology
    2.4 Microservice & Process Breakdown

3.  FRONTEND ARCHITECTURE & CLIENT APPLICATIONS
    3.1 Repository Structure: shops-app vs. Root Marketplace App
    3.2 Tech Stack & Build Tooling (Vite, React 18, Tailwind CSS, TypeScript)
    3.3 Mobile Architecture with Capacitor 8 (iOS & Android)
    3.4 Routing Architecture & Navigation Layouts
    3.5 State Management & Zustand Store Catalog
    3.6 Service Layer & API Interceptors
    3.7 Complete Frontend Page Catalog (91+ Pages)
        - Customer & Marketplace Pages
        - Support, Legal & Policy Pages
        - Authentication & Security Pages
        - User Account & Order Tracking Pages
        - Seller Dashboard & Business Suite (18 Sub-pages)
        - Driver / Courier Portal
        - Agent Portal
        - Comprehensive Admin Portal & Monitoring Suite
    3.8 UI/UX Design System, Animations & Responsive Tokens
    3.9 Internationalization (i18n): Somali, Swahili, Arabic, English, French

4.  BACKEND ARCHITECTURE & CORE SERVICES
    4.1 Framework & Runtime: FastAPI, Uvicorn, Python 3.11+
    4.2 Database Layer: PostgreSQL, SQLModel, SQLAlchemy, Alembic Migrations
    4.3 Caching & Session Management: Redis 7
    4.4 Asynchronous Worker: Celery 5+ & Celery Beat Scheduler
    4.5 Event Streaming & Message Broker: Apache Kafka & Zookeeper
    4.6 Observability, APM & Tracing: OpenTelemetry, Jaeger v2, Prometheus, Structlog
    4.7 Security Architecture: JWT, RBAC, Rate Limiting, HTTP Security Headers, CORS

5.  DATABASE DATA MODELS & SCHEMAS (ALL 62+ MODELS)
    5.1 Authentication, Users & Identity Models
    5.2 Seller, Shop & Business Enterprise Models
    5.3 Listings, Categories & Dynamic Attributes Models
    5.4 Orders, Checkout & Receipts Models
    5.5 Payments, Wallet & Mobile Money Models
    5.6 Logistics, Riders & Delivery Zones Models
    5.7 Advertising, Promotions & Marketing Models
    5.8 Messaging, Social & Trust Models
    5.9 Notifications, Email Logs & System Monitoring Models

6.  COMPLETE REST API ENDPOINT SPECIFICATION (200+ ENDPOINTS)
    6.1 Authentication & Login (/api/v1/auth, /api/v1/login)
    6.2 Users & Saved Addresses (/api/v1/users, /api/v1/addresses)
    6.3 Listings, Search & Catalog (/api/v1/listings, /api/v1/search)
    6.4 Categories, Subcategories & Attributes (/api/v1/subcategories, /api/v1/attributes)
    6.5 Bulk Products & Import (/api/v1/listings/bulk-products)
    6.6 Orders, Delivery & Checkout Receipts (/api/v1/orders, /api/v1/checkout-receipts)
    6.7 Payments, M-Pesa STK Push & Wallet (/api/v1/payments, /api/v1/mobile-money, /api/v1/wallet, /api/v1/boosts)
    6.8 Shops, Sellers & Businesses (/api/v1/businesses, /api/v1/sellers, /api/v1/seller/profile)
    6.9 Riders & Geotracking Logistics (/api/v1/riders, /api/v1/delivery, /api/v1/delivery-zones)
    6.10 Real-Time Chat & WebSockets (/api/v1/messages, /api/v1/chat_ws, /api/v1/conversations)
    6.11 Push Notifications & Preferences (/api/v1/notifications, /api/v1/notification-preferences)
    6.12 Seller Subscriptions & Feature Limits (/api/v1/subscriptions)
    6.13 Advertising, Banners & Rotation Engine (/api/v1/advertising, /api/v1/featured-advertising)
    6.14 Marketing Campaigns & Promo Codes (/api/v1/campaigns, /api/v1/promotions, /api/v1/discount-codes)
    6.15 AI Services & Verification Checks (/api/v1/ai, /api/v1/ai/verifications, /api/v1/translate)
    6.16 Trust Operations & KYC Verification (/api/v1/verifications, /api/v1/trust_ops)
    6.17 Social Features: Reviews, Favorites, Follows, Deals (/api/v1/reviews, /api/v1/favorites, etc.)
    6.18 Analytics, Tracking & User Lifecycle (/api/v1/analytics, /api/v1/admin/lifecycle)
    6.19 Admin Management & System Broadcasts (/api/v1/admin, /api/v1/admin/system-messages)
    6.20 Monitoring, Health & Diagnostics (/health, /metrics, /admin-monitoring)
    6.21 Kaalay Heedhe Community System (/api/v1/kh)

7.  REAL-TIME EVENT STREAMING, WEBSOCKETS & ASYNC TASK PIPELINES
    7.1 Kafka Event Topics & Payload Schemas
    7.2 WebSocket Real-Time Multiplexing Architecture
    7.3 Celery Task Catalog & Route Queues
    7.4 Celery Beat Cron Schedule (Retention, Promos, Alerts)

8.  THIRD-PARTY SERVICE INTEGRATIONS
    8.1 Lipana & Safaricom Daraja M-Pesa API
    8.2 Africa's Talking SMS & OTP Gateway
    8.3 Resend & Brevo Transactional / Promotional Email
    8.4 Cloudinary Media Storage CDN
    8.5 Groq AI / Meta Llama 3.3 & Llama 4 Scout LLMs
    8.6 Capacitor Native Mobile Plugins

9.  SECURITY, RBAC & FRAUD MITIGATION
    9.1 Authentication Lifecycles & Token Security
    9.2 Role-Based Access Control (RBAC) Permission Matrix
    9.3 Rate Limiting, Brute-Force & DDoS Defense
    9.4 Content Moderation, Bad-Word Filter & Fraud Screening

10. DEPLOYMENT, DEVOPS & INFRASTRUCTURE CONFIGURATION
    10.1 Docker Compose Services Matrix
    10.2 Nginx Reverse Proxy Configuration & SSL
    10.3 Database Configuration & Connection Pool Budgeting
    10.4 Mobile Build Pipelines (Android AAB & iOS IPA via Fastlane)
    10.5 Master Environment Variables (.env) Reference

11. OPERATIONAL PLAYBOOK & SYSTEM TROUBLESHOOTING
    11.1 Service Management Commands
    11.2 Database Migrations & Divergence Safeguards
    11.3 Troubleshooting Celery, Redis & Kafka Issues
    11.4 Trace Inspection with Jaeger & Structured Log Analysis
""")

    # Section 1
    sections.append("""
================================================================================
1. EXECUTIVE OVERVIEW & ECOSYSTEM
================================================================================

1.1 Mission & Value Proposition
Suqafuran ("Open Market" in Somali) is a high-performance, pan-African classifieds
and multi-sided marketplace platform built from the ground up to empower consumers,
merchants, and couriers across East Africa and the African continent.

Traditional classifieds platforms in emerging markets suffer from critical challenges:
- Pervasive fraud and impersonation due to lack of verification.
- Unreliable payments relying exclusively on cash-on-delivery.
- Fragmented informal courier logistics with no visibility or live tracking.
- Poor multilingual localization for vernacular languages like Somali and Swahili.
- Desktop-heavy, slow interfaces unsuited for low-bandwidth mobile networks.

Suqafuran addresses these friction points by providing:
- A digital identity verification pipeline (KYC with National ID, passport, and selfie liveness check).
- Direct mobile money integration with Safaricom M-Pesa (Daraja & Lipana STK push).
- An integrated logistics and courier module with real-time GPS tracking for independent riders.
- Dual fulfillment options for all transactions: Doorstep Delivery or In-Person Shop Pickup.
- Native bilingual / multilingual experiences (Somali, Swahili, Arabic, English, French).
- A mobile-first hybrid architecture (React + Vite + Capacitor 8) delivering native iOS and
  Android apps alongside a blazing-fast progressive web app.

1.2 The Multi-Sided Marketplace Model
Suqafuran integrates five core user roles into a single coherent ecosystem:

1. CUSTOMERS / BUYERS:
   - Discover products across 17 root categories and hundreds of subcategories.
   - Choose between doorstep courier delivery or in-store pickup.
   - Pay instantly using M-Pesa STK Push with automated transaction reconciliation.
   - Track rider delivery in real time on an interactive Leaflet/OpenStreetMap.
   - Chat directly with sellers via WebSockets before making purchase decisions.
   - Submit ratings, reviews, and community feedback.

2. SELLERS / SHOP OWNERS:
   - Establish branded storefronts (shop profile, banner, logo, opening hours).
   - Create listings manually or via CSV bulk import with dynamic attribute forms.
   - Use Groq-powered AI to auto-generate SEO-friendly titles and descriptions.
   - Manage real-time inventory, stock thresholds, and low-inventory alerts.
   - Fulfill orders: accept, pack, hand off to assigned riders, or mark ready for pickup.
   - Manage finances: track gross sales, platform commission deductions, and request
     direct payouts to M-Pesa or bank accounts.
   - Subscribe to tiered merchant plans (Starter, Business, Enterprise) to unlock
     higher listing limits, staff sub-accounts, priority search ranking, and advanced analytics.

3. RIDERS / COURIERS (DRIVERS):
   - Register independent delivery profile (motorcycle, car, van, bicycle).
   - Receive nearby delivery opportunities based on geo-proximity.
   - Navigate to seller location, inspect/scan package, and start transit.
   - Stream GPS coordinates every 30 seconds via WebSocket to the live tracking map.
   - Collect photo proof of delivery or recipient digital signature.
   - Earn base delivery fees, distance-based kilometer bonuses, and tip payouts.

4. FIELD AGENTS:
   - Onboard offline merchants into the digital economy.
   - Manage assigned seller portfolios and assist with listing optimization.
   - Set up targeted promotional campaigns and flash discount vouchers.
   - Handle seller and buyer disputes, earning commission on marketplace activity.

5. PLATFORM ADMINISTRATORS:
   - Supervise all platform operations through a comprehensive Admin Portal.
   - Moderate classified ads, flag suspicious listings, and ban fraudulent accounts.
   - Review identity verification queues with automated facial match scores.
   - Manage category hierarchy, subcategory trees, and dynamic attributes.
   - Control advertising slots, banner rotation engine, and sponsored placements.
   - Monitor real-time system health: Kafka message queues, OpenTelemetry traces,
     Celery task queues, database connection headroom, and email deliverability.
""")

    # Section 2
    sections.append("""
================================================================================
2. HIGH-LEVEL ARCHITECTURE & TOPOLOGY
================================================================================

2.1 System Architecture Diagram
The architecture is structured as a resilient, event-driven modular system:

+-------------------------------------------------------------------------------+
|                                CLIENT LAYER                                   |
|                                                                               |
|  [ Web Browser (Desktop/Mobile) ]     [ Android App (.aab/.apk) ]   [ iOS App (.ipa) ]
|         http://suqafuran.com                Capacitor 8 Mobile Bridge
+---------------------------------------+---------------------------------------+
                                        |
                            HTTPS / WSS (Port 443 / 80)
                                        |
+---------------------------------------v---------------------------------------+
|                             EDGE & REVERSE PROXY                              |
|                                                                               |
|                             Nginx Reverse Proxy                               |
|       - Let's Encrypt TLS / SSL Termination                                   |
|       - Static Asset Caching & GZip / Brotli Compression                      |
|       - Rate Limiting & Security Headers (HSTS, CSP, X-Frame-Options)         |
|       - Internal Proxying to Backend (:8000) & Media Uploads (:8000/images)   |
+---------------------------------------+---------------------------------------+
                                        |
                         HTTP REST / WebSocket (Internal)
                                        |
+---------------------------------------v---------------------------------------+
|                            APPLICATION SERVER                                 |
|                                                                               |
|                        FastAPI ASGI Application                               |
|       - 72+ Domain Endpoint Routers (203+ REST Endpoints)                     |
|       - WebSocket Real-Time Connection Manager (Chat & Rider Tracking)        |
|       - OpenTelemetry Instrumentation & Prometheus Metrics Exposer            |
|       - SlowAPI Request Throttler & JWT Auth Middleware                       |
|       - Structlog Structured JSON Logging & Request ID Context Propagation     |
+-------------+-------------------------+-------------------------+-------------+
              |                         |                         |
              | SQL / ORM               | Redis Protocol          | Kafka Binary
              |                         |                         |
+-------------v-----------+ +-----------v-----------+ +-----------v-------------+
|    PERSISTENCE LAYER    | |    IN-MEMORY & QUEUE  | |     EVENT STREAMING     |
|                         | |                       | |                         |
|   PostgreSQL Database   | |     Redis 7 Cache     | |   Apache Kafka 7.5      |
|  (DigitalOcean / Aiven) | |  - Session Store      | |  - Domain Event Topics  |
|  - SQLModel / SQLAlchemy| |  - Fast API Response  | |  - Zookeeper Coordination
|  - Alembic Migrations   | |  - Celery Task Broker | |  - WebSocket Bridge     |
|  - Connection Pooling   | |  - Rate Limit States  | |  - Monitoring Consumer  |
+-------------------------+ +-----------+-----------+ +-------------------------+
                                        |
                                Celery Task Message
                                        |
+---------------------------------------v---------------------------------------+
|                         ASYNCHRONOUS WORKER LAYER                             |
|                                                                               |
|   [ Celery Worker (4 Concurrency) ]            [ Celery Beat Scheduler ]     |
|   - Queues: default, notifications,           - Periodic Retention Tasks      |
|     promotions, celery                        - Stale Ad & Promo Expiration   |
|   - Email Dispatch (Resend/Brevo)             - Real-Time Alert Engine        |
|   - SMS & OTP Dispatch (Africa's Talking)     - Automated Analytics Aggregation
|   - M-Pesa STK Push Asynchronous Tasks        - System Health Heartbeats      |
+---------------------------------------+---------------------------------------+
                                        |
                         Outbound External API Integrations
                                        |
+---------------------------------------v---------------------------------------+
|                            THIRD-PARTY SERVICES                               |
|                                                                               |
|   * M-Pesa / Lipana Daraja API (Mobile Money Payments & STK Push)             |
|   * Africa's Talking Gateway (SMS Notifications & OTP Delivery)               |
|   * Resend & Brevo (Transactional & Promotional Email Engines)                |
|   * Cloudinary (Cloud Object Storage & Image Optimization CDN)                |
|   * Groq AI Cloud (Meta Llama 3.3 / Llama 4 Scout LLM Services)               |
|   * Jaeger v2 (Distributed OpenTelemetry Tracing Engine)                     |
+-------------------------------------------------------------------------------+

2.2 Technology Stack Matrix
+--------------------+----------------------------------------------------------+
| Layer              | Technology & Version                                     |
+--------------------+----------------------------------------------------------+
| Frontend Core      | React 18.3.1, TypeScript 5.9, Vite 6.1                   |
| Styling            | Tailwind CSS 3.3 / 4.0, Framer Motion 12.4               |
| Frontend State     | Zustand 5.0, TanStack React Query 5.66                   |
| Mobile Runtime     | Capacitor 8.1 (iOS & Android native runtime)             |
| Mapping & Geo      | Leaflet 1.9, React-Leaflet 4.2                           |
| Charting & Export  | Recharts 3.8, PapaParse 5.5, html2canvas 1.4             |
| Icons & Visuals    | Lucide React 0.475, Ant Design Icons 6.1                 |
| Backend Core       | FastAPI (Python 3.11+), Starlette, Uvicorn               |
| ORM & Data Models  | SQLModel 0.0.14, SQLAlchemy 2.0, Pydantic v2             |
| Migrations         | Alembic 1.13                                             |
| Database           | PostgreSQL 15 (Managed on DigitalOcean / Aiven)          |
| Cache & Broker     | Redis 7 Alpine (password protected)                      |
| Task Queue         | Celery 5.3+, Celery Beat                                 |
| Event Streaming    | Apache Kafka 7.5.0 (Confluent), Zookeeper 7.5            |
| Observability      | OpenTelemetry, Jaeger v2, Prometheus, Structlog          |
| Reverse Proxy      | Nginx 1.25+, Certbot Let's Encrypt                       |
| Containerization   | Docker, Docker Compose v2                                |
+--------------------+----------------------------------------------------------+

2.3 Infrastructure & Container Topology
The production deployment defined in docker-compose.yml coordinates 8 specialized services
on the isolated bridge network 'suqafuran-network':

1. suqafuran-nginx:
   - Reverse proxy binding ports 80 (HTTP) and 443 (HTTPS).
   - Terminates TLS, terminates Certbot challenges, applies gzip, and routes traffic.
   - Forwards API requests to suqafuran-backend:8000 and static uploads to ./uploads.

2. suqafuran-backend:
   - FastAPI server running on Uvicorn with structured JSON logging and OpenTelemetry.
   - Bound to localhost 127.0.0.1:8000 for internal security.
   - Manages database connection pool: DB_POOL_SIZE=5, DB_MAX_OVERFLOW=2, DB_POOL_RECYCLE=300s.

3. suqafuran-redis:
   - Redis 7 server with --requirepass authentication.
   - No host ports exposed; communicates strictly within Docker network.

4. suqafuran-celery:
   - Background worker executing asynchronous tasks with concurrency of 4 threads.
   - Consumes four specific queues: celery, default, notifications, promotions.

5. suqafuran-celery-beat:
   - Periodic cron scheduler managing background retention, cleanup, and alerts.

6. suqafuran-kafka & suqafuran-zookeeper:
   - Confluent Kafka broker (9092) and Zookeeper (2181) for event streaming.
   - Auto-creates default topics on startup with multi-partition replication.

7. suqafuran-jaeger:
   - Jaeger v2 collector and query engine using Badger persistent storage.
   - Receives gRPC OTLP spans on 4317 and HTTP spans on 4318; UI on 16686.

8. suqafuran-kafka-ui:
   - Kafka management dashboard bound locally to 127.0.0.1:8080.
""")

    # Section 3
    sections.append("""
================================================================================
3. FRONTEND ARCHITECTURE & CLIENT APPLICATIONS
================================================================================

3.1 Repository Structure: shops-app vs. Root Marketplace App
The codebase houses two coordinated frontend applications:

1. shops-app/ (Primary Production Frontend):
   - Located at /Users/mac/suqafuran/shops-app/
   - This is the live, active production client packaged for web and mobile.
   - Built with Vite, React 18, Tailwind CSS, TypeScript, and Capacitor 8.
   - Contains 91 comprehensive page views organized into Customer Storefront,
     Seller Management Dashboard, Agent Portal, and the Unified Admin Control Suite.
   - Employs route-level code splitting using React.lazy() and Suspense with
     background prefetching of high-traffic routes (ListingDetailPage, ShopDetailPage)
     during idle browser time.

2. root app (src/):
   - Located at /Users/mac/suqafuran/src/
   - The initial classifieds customer application with Leaflet mapping,
     i18next internationalization, Framer Motion animations, and PWA integration.
   - Both applications share design tokens, API patterns, and Capacitor configurations.

3.2 Tech Stack & Build Tooling
- Vite: Lightning-fast HMR and Rollup production bundling.
- React 18: Concurrent rendering, Suspense fallbacks, automatic batching.
- TypeScript: End-to-end type safety with strict compiler options.
- Tailwind CSS: Custom design tokens, responsive breakpoints, dark mode support.
- Lucide React & Ant Design Icons: Curated iconography across mobile and web.
- Recharts: Interactive responsive charting for merchant and admin analytics.
- PapaParse: In-browser streaming CSV parser for seller bulk product uploads.
- html2canvas: Client-side receipt and voucher rendering for offline image saving.

3.3 Mobile Architecture with Capacitor 8 (iOS & Android)
The frontend seamlessly compiles into native iOS and Android apps using Capacitor 8:
- capacitor.config.ts configuration:
  * App ID: com.suqafuran.app (and com.suqafuran.shops)
  * App Name: Suqafuran
  * Web Directory: dist
- Core Mobile Native Integrations:
  * @capacitor/push-notifications: Handles FCM (Android) and APNs (iOS) push notification
    tokens, registering device tokens with backend POST /api/v1/notifications/devices.
  * @capacitor/status-bar: Dynamically adjusts device status bar style (light/dark/transparent)
    and handles notch safe-area-insets.
  * @capacitor/splash-screen: Smooth animated native splash screen on app startup.
  * @capacitor/network: Listens to online/offline network changes and triggers offline caching.
  * @capacitor/preferences: Secure, persistent local key-value storage for JWT auth tokens.

3.4 Complete Frontend Page Catalog (91+ Pages in shops-app)
Below is the exhaustive catalog of pages in the live application:

CUSTOMER & MARKETPLACE PAGES:
- HomePage.tsx: Hero promotion banners, category carousel, trending listings, nearby verified shops.
- ShopsPage.tsx: Directory of all registered shops with search, location, and rating filters.
- ShopDetailPage.tsx: Merchant digital storefront with custom banner, logo, business hours,
  product catalog, customer reviews, verified badges, and follow mechanism.
- CategoryPage.tsx: Deep category browser with dynamic attribute filtering (year, mileage, size).
- SearchPage.tsx: Keyword search interface with price sliders, sorting, and location selectors.
- ListingDetailPage.tsx: Single product page with high-res photo gallery, seller trust badge,
  video demonstration, WhatsApp quick-contact, make-an-offer modal, and safety recommendations.
- CheckoutPage.tsx: Dual-mode checkout (Delivery vs. Pickup), address selector, courier tip,
  promo code input, order summary, and M-Pesa STK push trigger.
- OrdersPage.tsx: Customer order history with live delivery status timeline, interactive rider map,
  receipt PDF download, and post-delivery review submission.
- FavoritesPage.tsx: User's saved listings and bookmarked products.
- SavedSearchesPage.tsx: Saved search alerts notifying users of new matching listings.
- PriceAlertsPage.tsx: Real-time price drop notifications on watched items.
- FollowingPage.tsx: Feed of newly listed products from followed shops.
- MessagesPage.tsx: Real-time messaging conversation threads between buyers and sellers.

SUPPORT, LEGAL & POLICY PAGES:
- HelpCenterPage.tsx: FAQ database, customer support tickets, search knowledge base.
- SafeTradingTipsPage.tsx: Guidelines on safe payments, avoiding scams, meeting in public places.
- TermsOfUsePage.tsx: Legal terms of service and marketplace usage agreement.
- ReturnPolicyPage.tsx: Return and refund eligibility rules, pickup return policies.

AUTHENTICATION & SECURITY PAGES:
- LoginPage.tsx: Email and phone number login with OTP or password.
- SignupPage.tsx: Account registration with role selection (buyer, seller).
- ResetPasswordPage.tsx: Password reset token verification and password update.
- SecurityLogsPage.tsx: User account security audit log showing active logins and IP history.
- NotificationSettingsPage.tsx: Granular toggles for email, SMS, and push notification alerts.

SELLER DASHBOARD & BUSINESS SUITE (18 PAGES):
- SellerDashboardPage.tsx: Daily revenue overview, active order alerts, conversion rate cards.
- SellerShopPage.tsx: Shop branding editor (logo, banner, description, operating hours).
- SellerProductsPage.tsx: Product catalog table with stock status toggles and price editors.
- PostAdPage.tsx: Step-by-step listing wizard with category trees, dynamic attributes, media uploads,
  and Groq AI-powered title & description generation.
- SellerBulkImportPage.tsx: CSV template downloader, bulk upload parser, and batch validation.
- SellerOrdersPage.tsx: Order processing workflow (Pending -> Confirmed -> Packed -> Handed off).
- SellerMessagesPage.tsx: Merchant customer inquiry desk with quick-reply templates.
- SellerCustomersPage.tsx: Repeat customer list, buyer purchase history, customer notes.
- SellerFinancePage.tsx: Gross sales, commission breakdown, payout balance, and M-Pesa withdrawal.
- SellerAnalyticsPage.tsx: Visual visitor trends, product view counts, click-through rates.
- SellerInventoryPage.tsx: Low stock warnings, stock movement logs, bulk inventory updates.
- SellerMarketingPage.tsx: Promotional coupon code generator, discount campaign builder.
- SellerFeaturedAdsPage.tsx: Boost ad manager to purchase top placement and VIP badges.
- SellerReviewsPage.tsx: Merchant customer reviews management and public review replies.
- SellerVerificationPage.tsx: Merchant identity verification portal (National ID, selfie liveness).
- SellerSettingsPage.tsx: Store settings, fulfillment preferences, pickup window durations.
- SellerStaffPage.tsx: Staff sub-account invitations and role-based permissions (Manager, Sales).
- SellerSubscriptionPage.tsx: Merchant subscription tier selection (Starter, Business, Enterprise).
- SellerReportsPage.tsx: Exportable financial and inventory CSV reports.

AGENT PORTAL PAGES:
- AgentDashboardPage.tsx: Agent performance metrics, commission balance, assigned shops.
- AgentEarningsPage.tsx: Commission payouts and transaction history.
- AgentAnalyticsPage.tsx: Sales conversion metrics across onboarded merchants.
- AgentInquiriesPage.tsx: Inbound support tickets from assigned sellers.
- AgentListingsPage.tsx: Quality audit interface for merchant product listings.
- AgentShopsPage.tsx: Directory of shops onboarded and serviced by the agent.

COMPREHENSIVE ADMIN CONTROL SUITE:
- AdminDashboardMainPage.tsx: Platform gross merchandise value (GMV), active user counts,
  real-time order volume, and system health status.
- AdminListingsPage.tsx: Ad moderation desk: review, approve, reject, flag, or delete listings.
- AdminSellersPage.tsx: Seller portfolio directory with verification status and ban controls.
- AdminShopsPage.tsx & AdminShopsAltPage.tsx: Shop approvals, merchant compliance audits.
- AdminUsersPage.tsx: Global user account management, password resets, role promotions.
- AdminCategoriesPage.tsx: Taxonomy management: 17 root categories, subcategories, sub-subcategories,
  dynamic attribute fields, and bilingual label translations.
- AdminOrdersPage.tsx: System-wide order ledger with fulfillment type tracking.
- AdminDisputesPage.tsx: Dispute arbitration desk for buyer-seller conflicts and refund authorization.
- AdminConversationsPage.tsx: Chat thread oversight for fraud detection and scam prevention.
- AdminFraudPage.tsx: Flagged transactions, automated velocity violations, suspicious device patterns.
- AdminReportsPage.tsx: User reports against spam, prohibited items, or abusive conduct.
- AdminSupportPage.tsx: Internal customer support ticket assignment and management.
- AdminVerificationsPage.tsx: KYC verification review desk with ID image viewer, selfie liveness,
  and automated facial match scoring.
- AdminUnusualAccountsPage.tsx: Anomaly detection dashboard for suspicious user behavior.
- AdminBulkProductsPage.tsx: Platform-wide bulk product moderation and catalog imports.
- AdminHomepageBannersPage.tsx: Homepage promotional banner manager, slot scheduling, image uploads.
- AdminCustomerSegmentsPage.tsx: Customer cohort builder (Active, At-Risk, VIP, Churned) for campaigns.
- AdminEmailAnalyticsPage.tsx: Email deliverability, open rates, and click-through metrics via tracking pixels.
- AdminEmailTemplatesPage.tsx: Visual template editor for transactional and marketing emails.
- AdminFeaturedAdsPage.tsx: Management of paid featured listings and homepage spotlight slots.
- AdminSubscriptionsPage.tsx: Merchant subscription plans, revenue tracking, and renewal management.
- AdminSystemMessagesPage.tsx: Platform-wide broadcast announcements and SMS alerts.
- AdminUserLifecyclePage.tsx: User lifecycle stage analytics (Onboarding -> Retention -> Churn).
- AdminAnalytics Pages (Main, Users, Sellers, Devices, Geographic, Alerts, Communication):
  In-depth business intelligence dashboards powered by Recharts.
- AdminMonitoring Pages (Kafka, Live, Notifications, Traces, Alerts): Real-time observability
  into Kafka topics, Jaeger trace latency, notification queue backlogs, and system alerts.

3.5 State Management & Zustand Store Catalog
State is managed cleanly across reactive Zustand stores:
- authStore: User profile, JWT access token, user role, login status, and logout actions.
- cartStore: Shopping cart items, quantity modifiers, delivery vs. pickup mode, promo code application.
- locationStore: User GPS coordinates, selected city/neighborhood, delivery address persistence.
- currencyStore: Active currency selection (KES, USD, SOS) and automatic exchange conversion rates.
- searchStore: Filter parameters (price min/max, category slug, sorting, verified sellers only).
- notificationStore: Unread notification counts, live alert toasts.
- socketStore: WebSocket connection state, real-time message queue, rider location listeners.

3.6 Service Layer & API Interceptors
Axios clients (/src/services/api.ts and /shops-app/src/services/api.ts) manage backend communication:
- Request Interceptor: Automatically inspects localStorage for 'auth_token' and injects
  'Authorization: Bearer <token>' on all outbound requests.
- Response Interceptor: Catches HTTP 401 Unauthorized errors, flushes expired credentials,
  and redirects the user to /login.
- Offline Fallback Service: Leverages Capacitor Network status to queue failed mutations and
  serve cached responses when mobile connectivity drops.
""")

    # Section 4
    sections.append("""
================================================================================
4. BACKEND ARCHITECTURE & CORE SERVICES
================================================================================

4.1 Framework & Runtime: FastAPI, Uvicorn, Python 3.11+
The backend is powered by FastAPI, an asynchronous, high-throughput Python web framework.
Key runtime characteristics:
- Uvicorn ASGI Server: Asynchronous event loop handling hundreds of concurrent connections.
- Strict Pydantic v2 validation: Robust schema parsing and auto-generated data documentation.
- GZip Middleware: Compresses all JSON payloads exceeding 1,000 bytes.
- Session Middleware: Secure session management for OAuth callbacks.
- Structlog Structured Logging: JSON formatted logs with contextual fields (request_id, trace_id,
  client_ip, method, latency_ms).
- Request ID Header: Every response returns 'X-Request-ID' for end-to-end trace correlation.

4.2 Database Layer: PostgreSQL, SQLModel, SQLAlchemy, Alembic Migrations
- Managed PostgreSQL Cluster: High-availability database running on DigitalOcean / Aiven.
- SQLModel & SQLAlchemy 2.0 ORM: Seamless type safety combining SQLAlchemy models with Pydantic schemas.
- Connection Pool Budgeting:
  * Backend API: DB_POOL_SIZE=5, DB_MAX_OVERFLOW=2, DB_POOL_RECYCLE=300s.
  * Celery Worker: DB_POOL_SIZE=3, DB_MAX_OVERFLOW=2, DB_POOL_RECYCLE=300s.
  * Celery Beat: DB_POOL_SIZE=2, DB_MAX_OVERFLOW=1, DB_POOL_RECYCLE=300s.
  * Total combined connections strictly budgeted to 15 within the managed 25-connection ceiling.
- Alembic Migrations: Version-controlled database schema evolution in backend/alembic/.

4.3 Caching & Session Management: Redis 7
Redis 7 provides low-latency caching and message transport:
- Celery Task Queue Broker: Manages message queues for asynchronous background tasks.
- API Response Caching: Caches frequently accessed read-heavy endpoints (categories, featured ads).
- Rate Limiting Storage: Backing store for SlowAPI request counters.
- Real-Time Presence: Tracks active user WebSocket sessions and connected client counts.

4.4 Asynchronous Worker: Celery 5+ & Celery Beat Scheduler
Asynchronous operations are offloaded to Celery workers running on Redis:
- Queue Routing Architecture:
  * celery: Default unrouted administrative and maintenance tasks.
  * notifications: Transactional emails (Resend), SMS & OTP alerts (Africa's Talking).
  * promotions: Marketing campaigns, bulk email broadcasts (Brevo), discount notifications.
  * default: General background jobs, image resizing, data synchronization.
- Celery Beat Scheduler: Runs periodic cron tasks including:
  * Retention re-engagement emails.
  * Expiration of stale promotion campaigns and temporary discounts.
  * Health check probes and system performance monitoring.

4.5 Event Streaming & Message Broker: Apache Kafka & Zookeeper
For enterprise-grade event-driven decoupling, Suqafuran integrates Apache Kafka 7.5:
- Kafka Admin Service: Automatically creates and validates required topics on backend startup:
  * suqafuran-business-events: High-level business milestones (shop created, verified).
  * suqafuran-orders: Order state changes (created, paid, packed, dispatched, delivered).
  * suqafuran-payments: M-Pesa STK push confirmations, wallet top-ups, refunds.
  * suqafuran-notifications: System notifications destined for multi-channel dispatch.
  * suqafuran-tracking: User analytics, ad impressions, and search queries.
  * suqafuran-checkout: Checkout abandonment and conversion funnel telemetry.
- Kafka Producer: Non-blocking asynchronous publisher used throughout endpoint handlers.
- Kafka Monitoring Consumer & Email Notifier: Consumes operational events and alerts administrators
  of critical anomalies via automated email alerts.
- Kafka-to-WebSocket Integration: Bridges domain events directly into real-time client WebSocket rooms.

4.6 Observability, APM & Tracing: OpenTelemetry, Jaeger v2, Prometheus, Structlog
- OpenTelemetry Python SDK: Auto-instruments FastAPI HTTP requests, database queries, and Celery tasks.
- Jaeger v2 Collector: Ingests OTLP spans via gRPC (port 4317) with Badger persistent storage.
- Prometheus Instrumentation: Exposes real-time latency, request count, and error rate metrics at /metrics.
- Health Check Probe (/health): Evaluates PostgreSQL connectivity (SELECT 1) and Redis ping,
  returning HTTP 200 or 503 for load balancer routing.

4.7 Security Architecture
- JWT Authentication: Tokens signed with HMAC-SHA256 (HS256). Configurable lifetime (capped at 7 days).
- Password Hashing: Bcrypt with cryptographic salt.
- SlowAPI Rate Limiting: Configurable per-minute and per-hour limits (default 60 req/min, 1000 req/hour).
- Strict HTTP Security Headers:
  * Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  * X-Content-Type-Options: nosniff
  * X-Frame-Options: SAMEORIGIN
  * X-XSS-Protection: 1; mode=block
  * Referrer-Policy: strict-origin-when-cross-origin
  * Content-Security-Policy (CSP): Restricts script and connection origins.
- CORS Policies: Strict production origins covering production domains (suqafuran.com, app.suqafuran.com)
  and native mobile app origins (capacitor://localhost).
""")

    # Section 5
    sections.append("""
================================================================================
5. DATABASE DATA MODELS & SCHEMAS (ALL 62+ MODELS)
================================================================================

Below is the exhaustive catalog of SQLModel / SQLAlchemy database models located
in backend/app/models/:

5.1 Authentication, Users & Identity Models
- User (user.py):
  Primary user entity. Fields: id (UUID), email (unique), phone (unique), full_name,
  hashed_password, role (customer, seller, rider, agent, admin), is_active, is_verified,
  avatar_url, created_at, updated_at.
- OTPLog (otp_log.py):
  Audit log of all one-time passwords generated and verified via Africa's Talking SMS.
  Fields: id, phone, otp_code, purpose (login, signup, verification), is_used, expires_at.
- Device (device.py):
  Mobile and browser device tokens for push notifications. Fields: id, user_id, device_token,
  platform (ios, android, web), last_seen.
- SavedAddress (saved_address.py):
  User shipping and delivery addresses. Fields: id, user_id, label (Home, Work),
  street_address, city, state, postal_code, latitude, longitude, is_default.

5.2 Seller, Shop & Business Enterprise Models
- Business (business.py):
  Registered merchant entity. Fields: id, user_id, business_name, slug, description,
  category_id, phone, email, logo_url, banner_url, city, address, latitude, longitude,
  opening_hours (JSON), is_verified, trust_score, created_at.
- SellerProfile (seller_profile.py):
  Extended seller profile data, M-Pesa disbursement number, verification badges.
- SellerSettings (seller_settings.py):
  Merchant operational settings, pickup window limits, auto-reply text, vacation mode.
- ShopCategory (common.py):
  Links businesses to product categories for directory indexing.
- StaffAccount (subscription_features.py):
  Merchant sub-accounts. Fields: id, business_id, user_id, role (Manager, Sales, Inventory),
  permissions (JSON), created_at.

5.3 Listings, Categories & Dynamic Attributes Models
- Listing (listing.py):
  Core classified ad entity. Fields: id, title, slug, description, price, currency (KES/USD),
  condition (new, used), category_id, subcategory_id, seller_id, business_id, location,
  latitude, longitude, status (active, pending, sold, expired, rejected), views_count,
  favorites_count, images (JSON list of URLs), video_url, attributes (JSON key-value pairs),
  is_featured, created_at, updated_at.
- Category (common.py):
  Root categories (17 total). Fields: id, name_en, name_so, slug, icon, image_url, sort_order.
- Subcategory (subcategory.py):
  Secondary level categories. Fields: id, category_id, name_en, name_so, slug, image_url.
- Attribute (attribute.py) & AttributeGroup (attribute_group.py):
  Dynamic attribute definitions (e.g., Year, Mileage, Transmission, Fuel Type, RAM, Storage).
- AttributeOption (attribute_option.py):
  Selectable options for dropdown/radio attributes.
- CategoryAttribute (category_attribute.py) & SubcategoryAttribute (subcategory_attribute.py):
  Mapping between category trees and required/optional dynamic attributes.
- ListingAttribute (listing_attribute.py):
  Specific attribute values associated with an individual ad listing.
- FeaturedListing (featured_listing.py):
  Tracks paid sponsored listings, feature tier, start_date, and expiry_date.

5.4 Orders, Checkout & Receipts Models
- Order (order.py):
  Marketplace purchase transaction. Fields: id (UUID), order_number, user_id (buyer),
  seller_id, business_id, status (pending, paid, confirmed, packed, in_delivery,
  ready_for_pickup, delivered, completed, cancelled, refunded), total_amount, subtotal,
  delivery_fee, service_fee, discount_amount, courier_tip, payment_status (pending, paid, failed),
  payment_method (mpesa, card, wallet), fulfillment_type (delivery, pickup),
  delivery_address (JSON), pickup_instructions, rider_id, created_at, updated_at.
- OrderItem (order.py):
  Individual line items in an order. Fields: id, order_id, listing_id, title, unit_price, quantity, total_price.
- Cart (cart.py) & CartItem (cart.py):
  Persistent shopping cart and cart items across buyer browser sessions.
- CheckoutReceipt (checkout_receipt.py):
  Formal digital transaction receipt for downloadable invoices. Fields: id, order_id,
  receipt_number, buyer_name, seller_name, total_paid, payment_reference, issued_at.

5.5 Payments, Wallet & Mobile Money Models
- Wallet (wallet.py):
  Digital in-app balance for buyers and sellers. Fields: id, user_id, balance, currency, updated_at.
- WalletTransaction (wallet.py):
  Ledger of deposits, withdrawals, order payments, and fee deductions.
- MobileMoneyTransaction (mobile_money.py):
  Audit log of M-Pesa Daraja & Lipana STK pushes. Fields: id, order_id, user_id, phone,
  amount, checkout_request_id, merchant_request_id, mpesa_receipt_number, result_code,
  result_desc, status (initiated, success, failed).
- Refund (order.py):
  Refund records detailing reason, amount, approved_by, and M-Pesa reversal ID.

5.6 Logistics, Riders & Delivery Zones Models
- RiderProfile (delivery.py / common.py):
  Driver registration details. Fields: id, user_id, vehicle_type, license_plate,
  driver_license_url, insurance_url, is_active, is_online, current_latitude,
  current_longitude, total_deliveries, average_rating.
- DeliveryAssignment (delivery.py):
  Task assignment linking order to driver. Fields: id, order_id, rider_id, status
  (assigned, accepted, picked_up, in_transit, delivered), assigned_at, delivered_at.
- DeliveryZone (delivery_zone.py):
  Geographic delivery boundaries, base delivery fees, and estimated transit times.

5.7 Advertising, Promotions & Marketing Models
- AdvertisingCampaign (advertising.py) & BannerAd (advertising.py):
  Site-wide banner ad placements, CPM/CPC metrics, impressions count, click counts, target slots.
- Promotion (promotion.py):
  Discount promotions and seasonal flash sales applied to listings or categories.
- DiscountCode (marketing_code.py):
  Voucher codes (e.g., SAVE10) with percentage/fixed discount, usage limits, and expiry dates.
- CustomerSegment (customer_segment.py):
  User cohorts based on RFM (Recency, Frequency, Monetary) analytics for targeted marketing.
- Campaign (campaign.py) & CampaignSendLog (campaign_send_log.py):
  Automated marketing campaigns and email dispatch logs.

5.8 Messaging, Social & Trust Models
- Conversation (conversation.py) & MarketplaceConversation (marketplace_conversation.py):
  Chat thread between buyer and seller regarding a specific listing.
- Message (message.py):
  Individual message with text, sender_id, recipient_id, attachments, read_at.
- Review (review.py):
  Customer 1-5 star ratings and reviews for sellers, listings, and delivery riders.
- Favorite (favorite.py):
  User wishlist entries bookmarking listings.
- Follow (follow.py):
  Follower relationship between customers and verified merchant shops.
- Interaction (interaction.py):
  User behavioral tracking (clicks, phone views, WhatsApp button clicks, shares).
- Verification (verification.py):
  KYC verification dossiers. Fields: id, user_id, document_type, document_front_url,
  document_back_url, selfie_url, facial_match_score, status (pending, approved, rejected),
  admin_notes, verified_at.
- FraudLog (fraud.py) & Report (report.py):
  User reports and automated fraud flags against suspicious listings or accounts.
- TrustScore (trust.py):
  Calculated merchant reputation score based on verification, reviews, and fulfillment velocity.

5.9 Notifications, Email Logs & System Monitoring Models
- Notification (notification.py):
  Multi-channel user notifications (order update, price drop, message alert).
- NotificationPreferences (notification_preferences.py):
  User opt-in/opt-out preferences across email, SMS, and push.
- EmailTemplate (email_template.py) & EmailLog (email_log.py):
  HTML email templates and delivery logs tracking open pixels and click redirects.
- MonitoringAlert (monitoring.py):
  System alerts triggered by latency spikes, error rates, or queue backlog thresholds.
- AuditLog (audit.py):
  Administrative action audit trail recording all admin interventions.
""")

    # Section 6
    sections.append("""
================================================================================
6. COMPLETE REST API ENDPOINT SPECIFICATION (200+ ENDPOINTS)
================================================================================

Below is the definitive catalog of backend endpoints mounted in app/api/api_v1/api.py:

6.1 Authentication & Login
- POST /api/v1/auth/signup: Register new user with email, password, full name.
- POST /api/v1/auth/signup-phone: Register new user using phone number + SMS OTP.
- POST /api/v1/auth/request-otp: Request an Africa's Talking SMS OTP for login/verification.
- POST /api/v1/auth/verify-otp: Verify 6-digit SMS OTP code; returns JWT tokens.
- POST /api/v1/auth/refresh-token: Exchange long-lived refresh token for new access token.
- POST /api/v1/auth/logout: Invalidate session and clear auth state.
- POST /api/v1/login/access-token: Standard OAuth2 password flow login (email/phone + password).
- POST /api/v1/auth/social/google: Authenticate or sign up via Google OAuth2.
- POST /api/v1/auth/social/github: Authenticate or sign up via GitHub OAuth2.

6.2 Users & Saved Addresses
- GET /api/v1/users/me: Retrieve current authenticated user profile.
- PATCH /api/v1/users/me: Update user profile (name, phone, avatar, language preference).
- DELETE /api/v1/users/me: Soft-delete/deactivate current user account.
- GET /api/v1/users/public/{user_id}: Public seller profile and public ratings.
- POST /api/v1/users/forgot-password: Send password reset link to user's registered email.
- POST /api/v1/users/reset-password: Reset password using verification token.
- GET /api/v1/addresses/: List current user's saved shipping addresses.
- POST /api/v1/addresses/: Create new delivery address with GPS coordinates.
- PATCH /api/v1/addresses/{id}: Update saved address details.
- DELETE /api/v1/addresses/{id}: Remove saved address.

6.3 Listings, Search & Catalog
- GET /api/v1/listings/: Browse/search classified ads with filtering (search, category,
  subcategory, min_price, max_price, location, condition, sort, page, limit).
- POST /api/v1/listings/: Create new classified ad (title, price, category, photos, attributes).
- GET /api/v1/listings/{id}: Single listing details with seller trust score and dynamic fields.
- PATCH /api/v1/listings/{id}: Partial edit of listing (owner or admin only).
- DELETE /api/v1/listings/{id}: Delete or mark listing as sold/archived.
- GET /api/v1/listings/me: List current authenticated user's active/pending/sold ads.
- POST /api/v1/listings/{id}/images: Upload multiple photos for listing (Cloudinary / local).
- GET /api/v1/search/autocomplete: Instant search suggestion queries.
- GET /api/v1/search/popular: List trending search queries in the marketplace.

6.4 Categories, Subcategories & Attributes
- GET /api/v1/subcategories/: List all subcategories mapped to root categories.
- GET /api/v1/subcategories/{slug}: Get subcategory details and child item types.
- GET /api/v1/attributes/: List all dynamic attributes (Year, RAM, Fuel, Transmission).
- GET /api/v1/category-attributes/{category_id}: Dynamic attributes required for a given category.

6.5 Bulk Products & Import
- POST /api/v1/listings/bulk-products/upload-csv: Parse and batch-import listings via CSV.
- GET /api/v1/listings/bulk-products/template: Download standardized CSV bulk import template.
- GET /api/v1/listings/bulk-products/history: View bulk import batches and error reports.

6.6 Orders, Delivery & Checkout Receipts
- POST /api/v1/orders/: Create new order with items, fulfillment type (delivery/pickup),
  delivery address, courier tip, and promo code.
- GET /api/v1/orders/: List buyer's order history.
- GET /api/v1/orders/{id}: Comprehensive order details with item breakdown and tracking timeline.
- PATCH /api/v1/orders/{id}/cancel: Cancel order (permitted only prior to transit).
- POST /api/v1/orders/{id}/rate-delivery: Submit driver rating and feedback.
- POST /api/v1/orders/{id}/report-issue: Report damaged, incorrect, or missing items.
- GET /api/v1/checkout-receipts/{order_id}: Retrieve official receipt for an order.
- GET /api/v1/checkout-receipts/{order_id}/pdf: Download transaction invoice as PDF.

6.7 Payments, M-Pesa STK Push & Wallet
- POST /api/v1/payments/mpesa/initiate: Initiate Safaricom Daraja / Lipana STK push to buyer phone.
- POST /api/v1/payments/mpesa/callback: Safaricom webhook callback endpoint for payment confirmation.
- GET /api/v1/payments/{payment_id}/status: Check status of pending M-Pesa transaction.
- POST /api/v1/payments/{id}/refund: Process M-Pesa refund for cancelled or disputed order.
- GET /api/v1/wallet/balance: Get authenticated user's digital wallet balance.
- POST /api/v1/wallet/deposit: Initiate wallet top-up via M-Pesa STK push.
- POST /api/v1/wallet/withdraw: Request wallet balance withdrawal to registered phone/bank.
- GET /api/v1/boosts/prices: List listing boost packages (VIP badge, Top of Category, Urgent).
- POST /api/v1/boosts/apply: Purchase and apply boost package to a listing using wallet/M-Pesa.

6.8 Shops, Sellers & Businesses
- GET /api/v1/businesses/: Browse directory of registered shops and businesses.
- GET /api/v1/businesses/{slug}: Detailed shop profile, operating hours, and inventory.
- POST /api/v1/sellers/register: Register as a merchant and create a business profile.
- GET /api/v1/sellers/me: Get merchant dashboard profile, status, and earnings.
- PATCH /api/v1/sellers/me: Update shop details, branding banner, logo, and description.
- GET /api/v1/sellers/me/orders: List all orders placed with the merchant's shop.
- PATCH /api/v1/sellers/me/orders/{id}: Update order status (Confirm, Mark Packed, Ready for Pickup).
- GET /api/v1/sellers/me/earnings: Financial breakdown (gross sales, platform fees, net payout).
- POST /api/v1/sellers/me/withdrawals: Request merchant payout to registered M-Pesa number.
- GET /api/v1/seller/settings/: Merchant operational settings and notifications.
- PATCH /api/v1/seller/settings/: Update store operating hours, vacation mode, pickup instructions.

6.9 Riders & Geotracking Logistics
- POST /api/v1/riders/register: Register independent driver profile (vehicle type, license plate).
- GET /api/v1/riders/available: List available online couriers for assignment.
- POST /api/v1/riders/assignments/accept: Driver accepts assigned delivery order.
- POST /api/v1/riders/{id}/location: Driver updates real-time GPS coordinates (lat/lng).
- PATCH /api/v1/riders/assignments/{id}/status: Update delivery progress (picked up, delivered).
- GET /api/v1/riders/me/earnings: Driver delivery commission summary and tip earnings.
- GET /api/v1/delivery-zones/: View platform delivery zones, radius, and base rates.

6.10 Real-Time Chat & WebSockets
- GET /api/v1/messages/conversations: List active buyer-seller chat threads.
- GET /api/v1/messages/{other_user_id}: Retrieve message history for a specific conversation.
- POST /api/v1/messages/: Send text message or image attachment in a conversation.
- WS /api/v1/chat_ws: WebSocket connection for instant bidirectional chat messaging.
- WS /api/v1/notifications_ws: WebSocket connection for instant push alerts and rider location updates.

6.11 Push Notifications & Preferences
- GET /api/v1/notifications/: List user notifications (order updates, price alerts, messages).
- PATCH /api/v1/notifications/{id}/read: Mark single notification as read.
- POST /api/v1/notifications/read-all: Mark all notifications as read.
- GET /api/v1/notification-preferences/: View user notification preferences.
- PATCH /api/v1/notification-preferences/: Update email, SMS, and push delivery toggles.

6.12 Seller Subscriptions & Feature Limits
- GET /api/v1/subscriptions/plans: List subscription tiers (Starter, Business, Enterprise) and pricing.
- POST /api/v1/subscriptions/subscribe: Subscribe to a plan using M-Pesa STK push.
- GET /api/v1/subscriptions/me: Get active subscription plan, limits, and renewal date.
- POST /api/v1/subscriptions/cancel: Cancel subscription auto-renewal.

6.13 Advertising, Banners & Rotation Engine
- GET /api/v1/advertising/active-banners: Public active banner ads matching current page slot.
- POST /api/v1/advertising/campaigns: Create an advertising campaign with target dates and budget.
- POST /api/v1/advertising/banners/{id}/track-impression: Record banner view for analytics.
- POST /api/v1/advertising/banners/{id}/track-click: Record banner click and redirect.

6.14 Marketing Campaigns & Promo Codes
- POST /api/v1/discount-codes/validate: Validate promo code (e.g. SAVE10) and calculate discount.
- GET /api/v1/campaigns/active: List public promotional campaigns and seasonal discounts.

6.15 AI Services & Verification Checks
- POST /api/v1/ai/generate-title: Groq LLM generates high-converting listing title from keywords.
- POST /api/v1/ai/generate-description: Groq LLM writes detailed, structured ad description.
- POST /api/v1/ai/verifications/inspect-document: AI vision analysis checks ID validity and expiry.
- POST /api/v1/translate/: On-the-fly translation between Somali, Swahili, Arabic, and English.

6.16 Trust Operations & KYC Verification
- POST /api/v1/verifications/apply: Submit national ID document and selfie liveness image.
- GET /api/v1/verifications/me: Check current verification status (pending, verified, rejected).
- GET /api/v1/trust_ops/badges: View available trust badges and eligibility criteria.

6.17 Social Features: Reviews, Favorites, Follows, Deals
- POST /api/v1/reviews/: Submit 1-5 star review for product, seller, or rider.
- GET /api/v1/reviews/seller/{seller_id}: List verified reviews for a seller.
- GET /api/v1/favorites/: List current user's bookmarked listings.
- POST /api/v1/favorites/{listing_id}: Add listing to favorites.
- DELETE /api/v1/favorites/{listing_id}: Remove listing from favorites.
- POST /api/v1/follows/{shop_id}: Follow a merchant shop.
- DELETE /api/v1/follows/{shop_id}: Unfollow a merchant shop.
- POST /api/v1/offers/: Buyer submits price counter-offer to seller.
- POST /api/v1/price-alerts/: Subscribe to price drop notifications for an ad.
- POST /api/v1/saved-searches/: Save search query and receive alerts on new matches.

6.18 Analytics, Tracking & User Lifecycle
- POST /api/v1/analytics/track-view: Record page/listing impression with referrer data.
- GET /api/v1/analytics/seller/dashboard: Visual metric summaries for merchant dashboard.
- GET /api/v1/admin/lifecycle/cohorts: Cohort retention analysis for platform administrators.

6.19 Admin Management & System Broadcasts
- GET /api/v1/admin/overview: Platform overview (total users, active listings, GMV, orders).
- GET /api/v1/admin/listings: Administrative listing moderation queue.
- PATCH /api/v1/admin/listings/{id}/moderate: Approve, reject, or flag a classified ad.
- GET /api/v1/admin/verifications: KYC verification review queue with document inspector.
- PATCH /api/v1/admin/verifications/{id}/decide: Approve or reject KYC application with notes.
- POST /api/v1/admin/system-messages/broadcast: Send site-wide broadcast notification or SMS blast.
- GET /api/v1/admin/email-templates: List and edit transactional email templates.
- GET /api/v1/admin/email-analytics: Deliverability, bounce rates, and open rates tracking.

6.20 Monitoring, Health & Diagnostics
- GET /health: Health probe evaluating PostgreSQL and Redis connectivity.
- GET /metrics: Prometheus metrics endpoint exposing HTTP request counts and latencies.
- GET /api/v1/diagnostics/kafka: Kafka broker health check and topic partition status.
- GET /api/v1/admin-monitoring/traces: OpenTelemetry trace query via Jaeger client.

6.21 Kaalay Heedhe Community System (/api/v1/kh)
- Dedicated community classifieds module tailored for rapid Somali localized peer-to-peer
  announcements, emergency notices, local services, and neighborhood trade postings.
""")

    # Section 7
    sections.append("""
================================================================================
7. REAL-TIME EVENT STREAMING, WEBSOCKETS & ASYNC TASK PIPELINES
================================================================================

7.1 Kafka Event Topics & Payload Schemas
The backend implements an asynchronous event-driven architecture using Kafka:

1. suqafuran-orders Topic:
   - Event 'order_created': Triggered upon checkout completion.
     Payload: {order_id, user_id, seller_id, total_amount, fulfillment_type}
   - Event 'order_paid': Triggered upon M-Pesa STK push confirmation.
     Action: Triggers Celery notification task to alert seller and initiates rider dispatch.
   - Event 'order_status_updated': Triggered upon transition (packed, in_transit, delivered).
     Action: Broadcasts WebSocket event to buyer's active session and triggers SMS alert.

2. suqafuran-payments Topic:
   - Event 'payment_received': M-Pesa callback receipt reconciliation.
   - Event 'payout_processed': Merchant wallet withdrawal executed.

3. suqafuran-notifications Topic:
   - Ingests cross-system alert requests and routes them to SMS (Africa's Talking) or Email (Resend).

4. suqafuran-tracking Topic:
   - Streams real-time clickstream data, search keywords, and banner impressions for aggregation.

7.2 WebSocket Real-Time Multiplexing Architecture
Real-time capabilities are handled by FastAPI WebSockets (/api/v1/chat_ws and /api/v1/notifications_ws):
- ws_manager: Connection pool maintaining active WebSocket client connections mapped by user_id.
- Channels & Rooms:
  * Chat Rooms: Private conversation threads between buyer and seller.
  * Rider Geotracking Channel: Broadcasts courier latitude/longitude every 30 seconds to the
    buyer's live tracking map.
  * System Notification Channel: Pushes in-app banner alerts for orders, price drops, and messages.
- Event Loop Integration: Background Kafka consumers feed incoming domain events directly into
  ws_manager.broadcast() on the active asyncio event loop.

7.3 Celery Task Catalog & Route Queues
Celery tasks are defined in backend/app/tasks/ and routed to designated queues:
- email_tasks.py:
  * send_verification_email: Dispatches account verification links via Resend API.
  * send_password_reset_email: Dispatches secure password recovery tokens.
  * send_order_confirmation_email: Sends formatted invoice and receipt to customer.
  * send_seller_order_alert_email: Alerts merchant of new paid order requiring fulfillment.
- notification_tasks.py & notifications.py:
  * send_otp_sms: Sends 6-digit verification code via Africa's Talking SMS API.
  * send_delivery_status_sms: Sends real-time SMS to customer when rider is approaching.
- alert_tasks.py:
  * evaluate_monitoring_rules: Checks system latency and error counts, triggering admin alerts.
- promotion_tasks.py:
  * expire_stale_promotions: Daily task scanning active discounts and deactivating expired vouchers.
- retention_tasks.py:
  * dispatch_reengagement_emails: Scans dormant user cohorts and sends personalized recommendations.
- subscription_tasks.py:
  * evaluate_subscription_renewals: Verifies recurring billing status and downgrades expired tiers.

7.4 Celery Beat Cron Schedule
Celery Beat runs periodic tasks on exact intervals:
- Every 1 hour: evaluate_monitoring_rules (scans error logs and queue backlogs).
- Every 6 hours: expire_stale_promotions (deactivates expired discount codes and boost ads).
- Daily at 02:00 UTC: evaluate_subscription_renewals (verifies active merchant billing cycles).
- Daily at 09:00 UTC: dispatch_reengagement_emails (executes automated marketing lifecycle flows).
""")

    # Section 8
    sections.append("""
================================================================================
8. THIRD-PARTY SERVICE INTEGRATIONS
================================================================================

8.1 Lipana & Safaricom Daraja M-Pesa API
Mobile money is the foundational payment rails across Kenya and East Africa:
- Integration Endpoints: Lipana REST API and Safaricom Daraja STK Push (Lipa Na M-Pesa Online).
- Architecture:
  1. Customer initiates checkout specifying M-Pesa mobile number (2547XXXXXXXX).
  2. Backend triggers POST /api/v1/payments/mpesa/initiate.
  3. API initiates STK Push via Daraja/Lipana; prompt appears on customer handset requesting PIN.
  4. Customer enters secret PIN on handset.
  5. Safaricom processes transaction and fires POST webhook to /api/v1/payments/mpesa/callback.
  6. Backend validates webhook payload, verifies result_code == 0, updates Order status to 'paid',
     generates CheckoutReceipt, and publishes 'order_paid' event to Kafka.
- Currency Conversion: Automatically converts USD balances to KES using configurable rate (130.0).

8.2 Africa's Talking SMS & OTP Gateway
SMS infrastructure is powered by Africa's Talking (/backend/app/services/africastalking_service.py):
- Username & API Key: Authenticated connection using sender ID 'SUQAFURAN'.
- Core Features:
  * Automated 6-digit OTP generation and delivery for phone authentication and password resets.
  * Delivery notifications sent to buyers when couriers are dispatched.
  * High-priority SMS alerts sent to merchants when urgent orders are received.
  * Delivery receipts and failure logging stored in the otp_log database table.

8.3 Resend & Brevo Transactional / Promotional Email
Dual email engine optimizes deliverability and sender reputation:
- Resend API (email_service.py):
  * Dedicated to high-priority transactional emails (email verification, password resets,
    order invoices, dispute notices).
  * HTML email templates with responsive styling and brand assets.
- Brevo API (marketing_service.py):
  * Dedicated to marketing broadcasts, promotional campaigns, and newsletter distributions.
- Email Tracking Engine (email_tracking_service.py):
  * Injects 1x1 transparent tracking pixel into outbound emails to track open rates.
  * Wraps links in /api/v1/tracking/click redirect URLs to measure click-through rates.

8.4 Cloudinary Media Storage CDN
Image and media uploads are offloaded to Cloudinary (/backend/app/services/storage_service.py):
- Secure upload API for ad photographs, vehicle registration documents, and merchant banners.
- On-the-fly transformations: thumbnail generation, WebP automatic format conversion,
  responsive resizing, and CDN edge delivery.
- Fallback local filesystem storage in ./uploads mounted at /api/v1/listings/images for development.

8.5 Groq AI / Meta Llama 3.3 & Llama 4 Scout LLMs
AI capabilities powered by Groq's high-speed inference cloud (/backend/app/services/ai_service.py):
- Models: meta-llama/llama-3.3-70b-versatile and meta-llama/llama-4-scout-17b-16e-instruct.
- Use Cases:
  * Title Suggester: Analyzes rough merchant input and returns punchy, SEO-optimized ad titles.
  * Listing Description Generator: Converts bullet points into rich, compelling product descriptions.
  * Somali Localization & Translation: High-accuracy bidirectional translation between Somali, Swahili,
    Arabic, and English leveraging specialized vocabulary in somali_dictionary.py.
  * Automated Document Inspection: Inspects uploaded National ID documents for legibility and expiration.

8.6 Capacitor Native Mobile Plugins
Native smartphone hardware bridges enabled via Capacitor:
- Camera & Gallery: Direct native photo capture for ad listings and selfie verification.
- Push Notifications: Firebase Cloud Messaging (FCM) on Android and Apple Push Notifications (APNs) on iOS.
- Network State: Automatically detects transitions between 4G/5G/Wi-Fi and offline mode.
- Geolocation: Accesses native device GPS for courier location tracking and local ad discovery.
""")

    # Section 9
    sections.append("""
================================================================================
9. SECURITY, RBAC & FRAUD MITIGATION
================================================================================

9.1 Authentication Lifecycles & Token Security
- Stateless JWT Tokens: Access tokens contain user UUID, role, and expiration timestamp.
- Secret Key Protection: Signed with production HMAC-SHA256 secret.
- Token Expiration: Configurable via ACCESS_TOKEN_EXPIRE_MINUTES (capped strictly at 7 days).
- Secure Storage: Mobile apps utilize Capacitor Preferences (native Keychain / Keystore).
- Refresh Token Rotation: Prevents replay attacks by issuing single-use refresh tokens.

9.2 Role-Based Access Control (RBAC) Permission Matrix
+-----------------------+----------+--------+-------+-------+-------+------------+
| Feature / Operation   | Customer | Seller | Rider | Agent | Admin | SuperAdmin |
+-----------------------+----------+--------+-------+-------+-------+------------+
| Browse Ads & Shops    |   YES    |  YES   |  YES  |  YES  |  YES  |    YES     |
| Place Order / Checkout|   YES    |  YES   |  NO   |  NO   |  YES  |    YES     |
| Post Ad / Sell Product|   NO     |  YES   |  NO   |  NO   |  YES  |    YES     |
| Manage Shop & Staff   |   NO     |  YES   |  NO   |  NO   |  YES  |    YES     |
| Accept Delivery Order |   NO     |  NO    |  YES  |  NO   |  NO   |    YES     |
| Broadcast GPS Location|   NO     |  NO    |  YES  |  NO   |  NO   |    YES     |
| Assist Assigned Shops |   NO     |  NO    |  NO   |  YES  |  YES  |    YES     |
| KYC Review & Approval |   NO     |  NO    |  NO   |  NO   |  YES  |    YES     |
| Ad Moderation / Bans  |   NO     |  NO    |  NO   |  NO   |  YES  |    YES     |
| Financial Arbitration |   NO     |  NO    |  NO   |  NO   |  YES  |    YES     |
| Kafka & APM Monitoring|   NO     |  NO    |  NO   |  NO   |  YES  |    YES     |
+-----------------------+----------+--------+-------+-------+-------+------------+

9.3 Rate Limiting, Brute-Force & DDoS Defense
- SlowAPI In-Memory & Redis Limiting:
  * Public endpoints: 60 requests per minute per IP.
  * Authentication endpoints (/login, /signup, /request-otp): Strict limits (5 requests per minute)
    to prevent brute-force attacks.
  * Health probes: Unthrottled for monitoring agents.
- CORS Origin Lockdown:
  * Production strictly limits CORS origins to validated web domains and mobile protocols.
  * Reject unauthorized external domain cross-origin requests.

9.4 Content Moderation, Bad-Word Filter & Fraud Screening
- Automated Keyword Screening: Inbound listings scanned against prohibited items (weapons, drugs,
  counterfeit currency) and offensive language in English, Somali, and Swahili.
- Velocity Checks: Accounts posting excessive ads in short intervals automatically flagged for review.
- Liveness Check: Seller verification requires real-time selfie comparison against National ID photograph.
- Discard Dangerous Formats: File uploads strictly restrict extensions, rejecting executable or
  scriptable formats (SVG, PDF, HTML, XML, EXE, PHP, SH, JS).
""")

    # Section 10
    sections.append("""
================================================================================
10. DEPLOYMENT, DEVOPS & INFRASTRUCTURE CONFIGURATION
================================================================================

10.1 Docker Compose Services Matrix
The platform is orchestrated via docker-compose.yml:
+------------------------+-------------------------------+----------------------+
| Container Name         | Image / Context               | Ports & Network      |
+------------------------+-------------------------------+----------------------+
| suqafuran-nginx        | nginx:latest                  | 80:80, 443:443       |
| suqafuran-backend      | ./backend (Dockerfile)        | 127.0.0.1:8000:8000  |
| suqafuran-redis        | redis:7-alpine                | internal:6379        |
| suqafuran-celery       | ./backend (Dockerfile)        | internal             |
| suqafuran-celery-beat  | ./backend (Dockerfile)        | internal             |
| suqafuran-kafka        | confluentinc/cp-kafka:7.5.0   | 127.0.0.1:9092:9092  |
| suqafuran-zookeeper    | confluentinc/cp-zookeeper:7.5 | internal:2181        |
| suqafuran-jaeger       | jaegertracing/jaeger:latest   | 127.0.0.1:16686 (UI) |
| suqafuran-kafka-ui     | provectuslabs/kafka-ui:latest | 127.0.0.1:8080:8080  |
+------------------------+-------------------------------+----------------------+

10.2 Nginx Reverse Proxy Configuration & SSL
- Configured in ./nginx/nginx.conf and ./nginx/suqafuran-backend.conf.
- SSL certificates managed via Let's Encrypt / Certbot with automatic webroot validation.
- Enforces HTTP to HTTPS redirection (301 Permanent Redirect).
- Upstream proxying to http://backend:8000 with WebSocket header upgrades (Upgrade, Connection).
- Direct static file serving for uploaded ad images from /var/www/uploads.

10.3 Database Configuration & Connection Pool Budgeting
- Managed PostgreSQL hosted on DigitalOcean / Aiven cluster.
- Connection parameters set via DATABASE_URL or individual POSTGRES_* environment variables.
- Strict connection budget ensures zero connection exhaustion on managed databases:
  * Backend API: DB_POOL_SIZE=5, DB_MAX_OVERFLOW=2 (Max 7 connections)
  * Celery Worker: DB_POOL_SIZE=3, DB_MAX_OVERFLOW=2 (Max 5 connections)
  * Celery Beat: DB_POOL_SIZE=2, DB_MAX_OVERFLOW=1 (Max 3 connections)
  * Combined maximum: 15 connections (well below 25-connection managed limit).
  * DB_POOL_RECYCLE=300s prevents idle stale connections.

10.4 Mobile Build Pipelines
1. Android Release Build (Local Gradle):
   ```bash
   cd shops-app
   npm run build
   npx cap sync android
   cd android
   JAVA_HOME=<JDK 17/21 path> ./gradlew bundleRelease
   # Output: android/app/build/outputs/bundle/release/app-release.aab
   ```
   - Signed using key.properties and android/app/suqafuran.jks.
   - versionCode generated automatically from epoch timestamp.

2. iOS Release Build (GitHub Actions & Fastlane):
   - Defined in .github/workflows/ios.yml.
   - Triggered on push to main branch or manual workflow dispatch.
   - Fastlane signs IPA using App Store Connect API keys stored in GitHub Secrets.
   - Output IPA stored as artifact for 24 hours.

3. Web Deployment (cPanel / DigitalOcean Droplet):
   ```bash
   cd shops-app
   npm run build
   # Upload contents of shops-app/dist/ (including .htaccess) to document root
   ```

10.5 Master Environment Variables (.env) Reference
Below is the master list of environment variables required in backend/.env:
- ENVIRONMENT: 'production' or 'development'
- PROJECT_NAME: 'Suqafuran API'
- API_V1_STR: '/api/v1'
- SECRET_KEY: Cryptographic string for JWT signing
- JWT_ALGORITHM: 'HS256'
- ACCESS_TOKEN_EXPIRE_MINUTES: Token lifetime (e.g., 10080 for 7 days)
- DATABASE_URL: Complete PostgreSQL URI (postgresql://user:pass@host:port/dbname)
- POSTGRES_SERVER, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT
- DB_POOL_SIZE, DB_MAX_OVERFLOW, DB_POOL_RECYCLE
- REDIS_URL: Redis connection URI (redis://:pass@host:port/0)
- REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- KAFKA_BOOTSTRAP_SERVERS: 'kafka:9092'
- RESEND_API_KEY: Resend transactional email API key
- BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME
- AFRICASTALKING_USERNAME, AFRICASTALKING_API_KEY, AFRICASTALKING_SENDER_ID
- MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_BUSINESS_SHORTCODE, MPESA_PASSKEY
- LIPANA_SECRET_KEY, LIPANA_WEBHOOK_SECRET, KES_CONVERSION_RATE
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- GROQ_API_KEY, GROQ_MODEL, GROQ_TRANSLATE_MODEL
- OTEL_EXPORTER_OTLP_ENDPOINT: 'http://jaeger:4317'
- CORS_ORIGINS: Comma-separated allowed domain origins
""")

    # Section 11
    sections.append("""
================================================================================
11. OPERATIONAL PLAYBOOK & SYSTEM TROUBLESHOOTING
================================================================================

11.1 Service Management Commands
- Start All Services:
  ```bash
  docker-compose up -d --build
  ```
- View Running Service Status:
  ```bash
  docker-compose ps
  ```
- View Live Container Logs:
  ```bash
  docker-compose logs -f backend
  docker-compose logs -f celery-worker
  docker-compose logs -f nginx
  ```
- Restart Specific Service:
  ```bash
  docker-compose restart backend
  docker-compose restart celery-worker
  ```
- Graceful Shutdown:
  ```bash
  docker-compose down
  ```

11.2 Database Migrations & Divergence Safeguards
- Apply Migrations:
  ```bash
  docker-compose exec backend alembic upgrade head
  ```
- Diverged Heads Resolution:
  If Alembic reports multiple heads (e.g. from concurrent migrations):
  1. Inspect heads: `docker-compose exec backend alembic heads`
  2. Merge heads: `docker-compose exec backend alembic merge -m "merge diverged heads" <head1> <head2>`
  3. Apply merge: `docker-compose exec backend alembic upgrade head`
- Schema Self-Healing:
  FastAPI startup event in app/main.py includes ensure_checkout_receipt_schema() to guarantee
  critical database tables (checkout_receipt, interaction extensions) exist even if Alembic
  is diverged.

11.3 Troubleshooting Celery, Redis & Kafka Issues
1. Celery Tasks Queued But Never Executed:
   - Cause: Worker not listening to routed queue names.
   - Fix: Ensure celery-worker command specifies all queues:
     `celery -A app.tasks.celery_app worker -l info -c 4 -Q celery,default,notifications,promotions`
2. Redis Connection Refused / Auth Failed:
   - Cause: Redis running with password authentication but client missing password.
   - Fix: Ensure REDIS_URL in .env has format `redis://:<password>@redis:6379/0`.
3. Kafka Topics Missing:
   - Cause: Kafka broker started after backend initialization.
   - Fix: Trigger topic recreation via backend restart or execute Kafka CLI fallback:
     `docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list`

11.4 Trace Inspection with Jaeger & Structured Log Analysis
- Inspecting Slow API Calls:
  1. Open SSH tunnel to server: `ssh -L 16686:localhost:16686 user@server-ip`
  2. Open browser at `http://localhost:16686`
  3. Select service 'suqafuran-backend'
  4. Filter by operation (e.g. '/api/v1/listings/') or minimum duration (e.g. '500ms')
  5. Analyze waterfall breakdown across PostgreSQL queries, Redis calls, and Kafka publishes.
- Inspecting Production Logs:
  Every request outputs structured JSON containing 'request_id' and 'trace_id':
  ```bash
  docker-compose logs backend | grep '"latency_ms"'
  docker-compose logs backend | grep -i 'unhandled_exception'
  ```

================================================================================
                          END OF SUQAFURAN SYSTEM GUIDE
================================================================================
""")

    full_text = "\n".join(sections)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(full_text)
    
    print(f"Successfully generated {OUTPUT_FILE} ({len(full_text)} characters, {len(full_text.splitlines())} lines)")

if __name__ == "__main__":
    build_documentation()
