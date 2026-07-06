# Suqafuran Architecture Alignment & Implementation Plan

**Status**: Phase 1 - Audit & Planning  
**Generated**: July 6, 2026  
**Target Completion**: Phase 4 (Complete by August 2026)

---

## EXECUTIVE SUMMARY

The Suqafuran codebase has **85% of core models** implemented but is **weak in customer-facing features** (40% complete). The architecture is **distributed and needs consolidation**. This plan aligns implementation with the 17-module architecture specified in USER_ROLES_COMPLETE_GUIDE.md.

### Current State
- ✅ **Admin Dashboard**: Mature (18 pages, 95% complete)
- ✅ **Seller Module**: Functional (7 pages, 90% complete)  
- ✅ **Rider Module**: Functional (5 pages, 85% complete)
- ⚠️ **Customer Module**: Immature (40% complete, missing cart/checkout/tracking)
- ⚠️ **Database**: Scattered Order model, no dedicated Cart/Category models
- ⚠️ **API**: 70% endpoints, missing customer workflows

### Outcome of This Plan
- Unified 17-module architecture mapped to code
- All critical customer features implemented
- Consistent API design with proper module separation
- Complete API documentation
- Ready for Phase 5 (video, live streaming, social)

---

## PHASE 1: AUDIT & ARCHITECTURE MAPPING (Days 1-3)

### 1.1 Model Consolidation

#### Current: Scattered Order Logic
```python
# CURRENT (scattered):
# - delivery.py has order_id references
# - sellers.py router has order logic
# - orders.py router manages endpoints
# - No dedicated Order model class
```

#### Target: Unified Models

```python
# backend/app/models/order.py (NEW)
class Order(Base):
    id: int
    customer_id: int (FK → User)
    seller_id: int (FK → User via Shop)
    shop_id: int (FK → Shop)
    rider_id: int (FK → User, nullable)
    
    items: List[OrderItem] (1:M)
    payment: Payment (1:1)
    delivery: Delivery (1:1, nullable)
    
    status: enum (pending→confirmed→packed→pickup_ready→delivered/cancelled)
    fulfillment_type: enum (delivery, pickup)
    
    address_id: int (FK → SavedAddress, for delivery)
    notes: str
    created_at: datetime
    updated_at: datetime

class OrderItem(Base):
    id: int
    order_id: int (FK)
    product_id: int (FK → Listing)
    quantity: int
    price_at_time: decimal
    
class Cart(Base):
    id: int
    user_id: int (FK → User)
    items: List[CartItem] (1:M)
    
class CartItem(Base):
    id: int
    cart_id: int (FK)
    product_id: int (FK → Listing)
    quantity: int
    added_at: datetime

# backend/app/models/category.py (NEW)
class Category(Base):
    id: int
    name_en: str
    name_so: str
    slug: str
    icon: str  # lucide icon name
    parent_id: int (nullable, self-referential for hierarchy)
    subcategories: List['Category']
    products: List[Listing] (M:M through product_categories)

class ProductCategory(Base):
    product_id: int (FK → Listing)
    category_id: int (FK → Category)
```

#### Tasks
- [ ] Create `backend/app/models/order.py` with Order, OrderItem classes
- [ ] Create `backend/app/models/cart.py` with Cart, CartItem classes
- [ ] Create `backend/app/models/category.py` with Category model
- [ ] Update `backend/app/models/__init__.py` to export new models
- [ ] Create alembic migration for new tables
- [ ] Verify relationships with existing models (User, Listing, Shop, Delivery, Payment)

---

### 1.2 Database Schema Verification

#### Verify Current Schema
```bash
# Check existing tables
sqlite3 /Users/mac/suqafuran/backend/app.db ".tables"
sqlite3 /Users/mac/suqafuran/backend/app.db ".schema orders"  # if exists
```

#### Schema Gaps to Fill
1. **Categories**: Verify 17 root categories exist with 3-level hierarchy
2. **Orders**: Verify status enum, fulfillment_type enum
3. **Cart**: New table needed
4. **OrderItems**: Verify junction table exists
5. **ProductCategories**: Verify junction table exists

#### Tasks
- [ ] Document current schema
- [ ] Create migration for missing tables
- [ ] Seed 17 root categories + subcategories
- [ ] Verify foreign key relationships
- [ ] Test data integrity constraints

---

## PHASE 2: API ENDPOINT REFACTORING (Days 4-7)

### 2.1 Current API Audit

#### Backend Routers Map
```
/routers/
├── sellers.py              # Seller endpoints
├── seller_endpoints.py      # Additional seller endpoints (CONSOLIDATE)
├── riders.py               # Rider endpoints
├── rider_endpoints.py       # Additional rider endpoints (CONSOLIDATE)
├── orders.py               # Order management
├── payments.py             # Payment processing
├── delivery_endpoints.py    # Delivery endpoints (CONSOLIDATE with delivery_tracking)
├── delivery_tracking.py     # Delivery tracking (CONSOLIDATE with delivery_endpoints)
├── notifications.py        # Notifications
├── ratings.py              # Reviews/ratings
└── websocket_routes.py     # WebSocket (CONSOLIDATE into notifications)
```

### 2.2 Target API Architecture

Organize by **module** (not function):

```
/routers/
├── user.py                 # User auth, profile (consolidate from scattered auth code)
├── shop.py                 # Shop CRUD (currently in sellers.py)
├── product.py              # Product CRUD (need to extract from sellers.py)
├── category.py             # Category CRUD (NEW - admin only)
├── cart.py                 # Cart operations (NEW)
├── order.py                # Order CRUD (consolidate orders.py logic)
├── payment.py              # Payment processing (keep existing)
├── delivery.py             # Delivery management (consolidate delivery_endpoints + tracking)
├── review.py               # Reviews & ratings (rename from ratings.py)
├── verification.py         # Verification workflows (NEW)
├── message.py              # Messaging (NEW - extract from websocket)
├── notification.py         # Notifications (consolidate with websocket)
├── admin.py                # Admin operations (NEW)
├── rider.py                # Rider workflows (consolidate rider*.py)
├── agent.py                # Agent workflows (NEW)
└── websocket.py            # WebSocket events (consolidate, no business logic)
```

### 2.3 API Endpoint Mapping

#### MODULE: **Cart**

**Base Path**: `/api/v1/cart`

```python
# GET /api/v1/cart
@router.get("", response_model=CartResponse)
async def get_cart(current_user: User = Depends(get_current_user)):
    """Get user's shopping cart"""

# POST /api/v1/cart/items
@router.post("/items", response_model=CartItemResponse)
async def add_to_cart(request: AddToCartRequest, current_user: User):
    """Add product to cart"""

# DELETE /api/v1/cart/items/{item_id}
@router.delete("/items/{item_id}")
async def remove_from_cart(item_id: int, current_user: User):
    """Remove item from cart"""

# PATCH /api/v1/cart/items/{item_id}
@router.patch("/items/{item_id}", response_model=CartItemResponse)
async def update_cart_item(item_id: int, quantity: int, current_user: User):
    """Update quantity"""

# DELETE /api/v1/cart
@router.delete("")
async def clear_cart(current_user: User):
    """Clear entire cart"""

# POST /api/v1/cart/apply-promo
@router.post("/apply-promo")
async def apply_promo_code(code: str, current_user: User):
    """Apply promotional code"""
```

#### MODULE: **Order**

**Base Path**: `/api/v1/orders`

```python
# POST /api/v1/orders (CHECKOUT)
@router.post("", response_model=OrderResponse)
async def create_order(request: CreateOrderRequest, current_user: User):
    """Create order from cart"""
    # Validates cart exists
    # Creates Order record
    # Clears cart
    # Returns order details

# GET /api/v1/orders
@router.get("", response_model=List[OrderSummaryResponse])
async def list_orders(
    current_user: User,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """List user's orders (customer view)"""

# GET /api/v1/orders/{order_id}
@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(order_id: int, current_user: User):
    """Get order details (customer can see own, seller/rider can see assigned)"""

# PATCH /api/v1/orders/{order_id}/status
@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    new_status: OrderStatus,
    current_user: User
):
    """Update order status (seller confirms, rider marks delivered, etc.)"""

# POST /api/v1/orders/{order_id}/cancel
@router.post("/{order_id}/cancel")
async def cancel_order(order_id: int, current_user: User):
    """Cancel order (before shipped)"""

# GET /api/v1/orders/{order_id}/tracking
@router.get("/{order_id}/tracking", response_model=TrackingResponse)
async def get_order_tracking(order_id: int, current_user: User):
    """Get live tracking (customer viewing)"""
```

#### MODULE: **Category**

**Base Path**: `/api/v1/categories`

```python
# GET /api/v1/categories
@router.get("", response_model=List[CategoryResponse])
async def list_categories(parent_id: Optional[int] = None):
    """Get categories (by level)"""

# GET /api/v1/categories/{id}
@router.get("/{id}", response_model=CategoryDetailResponse)
async def get_category(id: int):
    """Get category with subcategories"""

# POST /api/v1/categories (ADMIN ONLY)
@router.post("", response_model=CategoryResponse)
async def create_category(request: CreateCategoryRequest, admin: User = Depends(require_admin)):
    """Create root or subcategory"""

# PATCH /api/v1/categories/{id} (ADMIN ONLY)
@router.patch("/{id}", response_model=CategoryResponse)
async def update_category(id: int, request: UpdateCategoryRequest, admin: User):
    """Update category"""

# DELETE /api/v1/categories/{id} (ADMIN ONLY)
@router.delete("/{id}")
async def delete_category(id: int, admin: User):
    """Delete category"""
```

#### MODULE: **Customer Product Browsing**

**Base Path**: `/api/v1/products` (rename from `/listings`)

```python
# GET /api/v1/products
@router.get("", response_model=List[ProductResponse])
async def search_products(
    q: Optional[str] = None,
    category: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    location: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """Search & browse products"""

# GET /api/v1/products/{id}
@router.get("/{id}", response_model=ProductDetailResponse)
async def get_product(id: int):
    """Get product details"""

# GET /api/v1/products/{id}/reviews
@router.get("/{id}/reviews", response_model=List[ReviewResponse])
async def get_product_reviews(id: int):
    """Get product reviews"""

# POST /api/v1/products/{id}/wishlist
@router.post("/{id}/wishlist")
async def add_to_wishlist(id: int, current_user: User):
    """Add to wishlist"""

# DELETE /api/v1/products/{id}/wishlist
@router.delete("/{id}/wishlist")
async def remove_from_wishlist(id: int, current_user: User):
    """Remove from wishlist"""
```

#### Additional Key Modules

**Delivery**:
- `GET /api/v1/deliveries/{id}` - Track delivery
- `POST /api/v1/deliveries/{id}/location` - Update rider location (WebSocket)
- `POST /api/v1/deliveries/{id}/complete` - Mark as delivered

**Payment**:
- `POST /api/v1/payments/initiate` - Start M-Pesa payment
- `POST /api/v1/payments/callback` - M-Pesa callback (webhook)
- `GET /api/v1/payments/{id}/status` - Check payment status

**Message** (NEW):
- `GET /api/v1/messages` - List conversations
- `POST /api/v1/messages` - Send message
- `GET /api/v1/messages/{conversation_id}` - Get conversation history

### 2.4 Implementation Tasks

**Consolidation Work**:
- [ ] Merge `seller_endpoints.py` into `sellers.py`
- [ ] Merge `rider_endpoints.py` into `riders.py`
- [ ] Merge `delivery_endpoints.py` + `delivery_tracking.py` into `delivery.py`
- [ ] Extract product endpoints from `sellers.py` into new `product.py`
- [ ] Extract shop endpoints from `sellers.py` into new `shop.py`

**New Endpoint Files**:
- [ ] Create `routers/cart.py` - Cart management
- [ ] Create `routers/order.py` - Order management (consolidate orders.py)
- [ ] Create `routers/category.py` - Category management
- [ ] Create `routers/review.py` - Reviews (rename from ratings)
- [ ] Create `routers/message.py` - Messaging
- [ ] Create `routers/verification.py` - Verification flows
- [ ] Create `routers/admin.py` - Admin operations

**Update Main App**:
- [ ] Update `backend/main.py` to register new routers
- [ ] Update route prefixes consistently

---

## PHASE 3: FRONTEND CUSTOMER FLOWS (Days 8-14)

### 3.1 Missing Customer Pages

```
new-frontend/src/app/
├── (app)/
│   ├── (home)/
│   │   ├── page.tsx               # Landing/homepage (NEW)
│   │   └── layout.tsx             # Root layout
│   │
│   ├── (catalog)/
│   │   ├── categories/
│   │   │   ├── page.tsx           # Browse categories (NEW)
│   │   │   └── [slug]/
│   │   │       └── page.tsx       # Category details (NEW)
│   │   │
│   │   ├── search/
│   │   │   └── page.tsx           # Search results (NEW)
│   │   │
│   │   └── products/
│   │       ├── [id]/
│   │       │   └── page.tsx       # Product details (EXISTS - verify)
│   │       └── similar/[id]/page.tsx # Similar products (NEW)
│   │
│   ├── (shopping)/
│   │   ├── cart/
│   │   │   └── page.tsx           # Shopping cart (NEW - CRITICAL)
│   │   │
│   │   ├── checkout/
│   │   │   ├── page.tsx           # Checkout flow (NEW - CRITICAL)
│   │   │   ├── payment/
│   │   │   │   └── page.tsx       # Payment confirmation (NEW)
│   │   │   └── success/
│   │   │       └── page.tsx       # Order confirmation (NEW)
│   │   │
│   │   └── orders/
│   │       ├── page.tsx           # Order history (NEW)
│   │       ├── [id]/
│   │       │   ├── page.tsx       # Order details (NEW)
│   │       │   ├── tracking/
│   │       │   │   └── page.tsx   # Live tracking (NEW)
│   │       │   └── review/
│   │       │       └── page.tsx   # Leave review (NEW)
│   │       └── [id]/receipt.tsx   # Download receipt (NEW)
│   │
│   ├── (profile)/
│   │   ├── profile/
│   │   │   ├── page.tsx           # Profile view/edit (VERIFY)
│   │   │   ├── addresses/
│   │   │   │   └── page.tsx       # Manage addresses (NEW)
│   │   │   └── preferences/
│   │   │       └── page.tsx       # Notification prefs (EXISTS)
│   │   │
│   │   └── wishlist/
│   │       └── page.tsx           # Saved items (NEW)
```

### 3.2 Key Pages to Implement (Priority Order)

1. **Cart Page** (CRITICAL - blocks checkout)
   - Show cart items with quantities
   - Apply promo codes
   - Edit quantities/remove items
   - Proceed to checkout button
   - Summary: subtotal, taxes, fees, total

2. **Checkout Flow** (CRITICAL)
   - Step 1: Confirm delivery/pickup
   - Step 2: Choose address (delivery) or confirm location (pickup)
   - Step 3: Enter phone number
   - Step 4: Review order summary
   - Step 5: Payment (M-Pesa)
   - Order confirmation

3. **Order Tracking** (HIGH)
   - Real-time delivery tracking with map
   - Order status timeline
   - Rider info + contact
   - Estimated time
   - Complete order + review button

4. **Product Search & Browse** (HIGH)
   - Search by query
   - Filter by category, price, rating, location
   - Infinite scroll or pagination

5. **Categories Browse** (MEDIUM)
   - Show 17 root categories
   - Click to see subcategories
   - Click to see products in category

### 3.3 Frontend Component Architecture

```
new-frontend/src/
├── components/
│   ├── shared/
│   │   ├── Header.tsx              # Already exists
│   │   ├── Footer.tsx              # NEW
│   │   ├── Sidebar.tsx             # NEW for mobile
│   │   └── SearchBar.tsx           # NEW
│   │
│   ├── features/
│   │   ├── ProductCard.tsx         # NEW
│   │   ├── ProductGrid.tsx         # NEW
│   │   ├── CategoryCard.tsx        # NEW
│   │   ├── CartItem.tsx            # NEW
│   │   ├── OrderCard.tsx           # NEW
│   │   ├── OrderTimeline.tsx       # NEW (status progress)
│   │   ├── PriceBreakdown.tsx      # NEW (taxes, fees, total)
│   │   ├── AddressSelector.tsx     # NEW
│   │   ├── DeliveryMap.tsx         # NEW (with rider location)
│   │   └── ReviewForm.tsx          # NEW
│   │
│   └── lib/
│       └── api.ts                  # API service
```

---

## PHASE 4: API DOCUMENTATION & CLEANUP (Days 15-18)

### 4.1 OpenAPI/Swagger Generation

```yaml
# backend/openapi.yaml (generated from FastAPI)
# Run: fastapi_to_openapi_schema
# Output to: new-frontend/public/api-schema.json
```

**Document Each Module**:
- Authentication flow
- Authorization by role
- Request/response schemas
- Error codes
- Rate limits
- WebSocket events

### 4.2 API Reference Guide

Create HTML docs at `/docs`:
```
GET /docs - Swagger UI (FastAPI auto-generated)
GET /redoc - ReDoc UI (FastAPI auto-generated)
```

### 4.3 Code Quality

- [ ] Add TypeScript types for all API responses (frontend)
- [ ] Add Pydantic schemas for all endpoints (backend)
- [ ] Add docstrings to all endpoints
- [ ] Add validation to all endpoints
- [ ] Add error handling to all endpoints

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Models (Days 1-3)
- [ ] Create Order model
- [ ] Create Cart model  
- [ ] Create Category model
- [ ] Create migration
- [ ] Verify schema
- [ ] Seed categories

### Phase 2: API (Days 4-7)
- [ ] Consolidate router files
- [ ] Create new endpoint files
- [ ] Implement cart endpoints
- [ ] Implement order endpoints
- [ ] Implement category endpoints
- [ ] Test all endpoints

### Phase 3: Frontend (Days 8-14)
- [ ] Create cart page
- [ ] Create checkout flow
- [ ] Create order tracking
- [ ] Create search/browse
- [ ] Create categories page
- [ ] Wire up to backend

### Phase 4: Documentation (Days 15-18)
- [ ] Generate OpenAPI schema
- [ ] Create API reference
- [ ] Add TypeScript types
- [ ] Add docstrings
- [ ] Error handling review

---

## ARCHITECTURE PRINCIPLES

1. **Module-Driven Organization** - Code organized by business module, not by function
2. **Separation of Concerns** - Router files, model files, schema files kept separate
3. **Consistent Patterns** - All endpoints follow same structure (auth, validation, response)
4. **Database Normalization** - Proper foreign keys, no data duplication
5. **API First** - Frontend built on clean API contracts
6. **TypeScript Strict** - All frontend code strictly typed
7. **Documentation Required** - Every endpoint documented
8. **Role-Based Access** - All endpoints check permissions

---

## SUCCESS METRICS

By end of Phase 4:
- ✅ Customer can browse products → add to cart → checkout → track order
- ✅ All 17 modules have dedicated model + endpoint files
- ✅ 100% of API endpoints documented
- ✅ Zero orphaned code (consolidation complete)
- ✅ Admin/Seller/Rider/Customer flows all working
- ✅ Database schema normalized and migration-driven

---

## NEXT PHASES (Post-Alignment)

**Phase 5 (Aug 2026)**: Video shopping, live streaming, social features  
**Phase 6 (Sep 2026)**: Fraud detection, seller insurance, advanced analytics  
**Phase 7 (Oct 2026)**: ML recommendations, autonomous delivery, international

