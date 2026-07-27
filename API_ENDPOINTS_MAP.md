# Suqafuran API Endpoints Map

## Admin Panel

### Core Admin Endpoints
- `GET /api/v1/admin/stats` - Dashboard statistics
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/orders` - List all orders
- `GET /api/v1/admin/queue` - Moderation queue (pending listings)
- `GET /api/v1/admin/sellers` - List sellers
- `GET /api/v1/admin/verification-attempts` - Fraud detection
- `POST /api/v1/admin/users/{user_id}/status` - Update user status
- `DELETE /api/v1/admin/users/{user_id}` - Delete user
- `POST /api/v1/admin/moderate/{listing_id}` - Moderate listing

### Support
- `GET /api/v1/support/tickets` - List support tickets
- `PATCH /api/v1/support/tickets/{ticket_id}` - Update ticket
- `GET /api/v1/support/stats` - Support statistics

### Marketing
- `GET /api/v1/marketing/codes` - List promotional codes
- `POST /api/v1/marketing/codes` - Create code
- `DELETE /api/v1/marketing/codes/{code_id}` - Deactivate code
- `GET /api/v1/marketing/validate/{code}` - Validate code

### Content & Settings
- `GET /api/v1/listings/categories` - List categories (17 available)
- `GET /api/v1/admin/email/analytics` - Email analytics
- `POST /api/v1/admin/email/broadcast` - Send broadcast email

## User Features

### Orders & Transactions
- `GET /api/v1/admin/orders` - Admin view all orders
- `POST /api/v1/orders/create` - Create order
- `GET /api/v1/orders` - Get user's orders
- `POST /api/v1/orders/{order_id}/cancel` - Cancel order

### Ratings & Reviews
- `POST /api/v1/ratings/{order_id}/rate` - Submit rating
- `GET /api/v1/ratings/seller/{seller_id}/reviews` - Get seller reviews
- `GET /api/v1/ratings/seller/{seller_id}/stats` - Get seller stats

### Feedback
- `GET /api/v1/feedback/user/{user_id}/feedback` - User feedback
- `POST /api/v1/feedback/feedback` - Create feedback
- `GET /api/v1/feedback/listing/{listing_id}` - Listing feedback

### Follows
- `GET /api/v1/follows/my/followers` - Get followers
- `GET /api/v1/follows/my/following` - Get following list
- `POST /api/v1/follows/follow/{user_id}` - Follow user
- `DELETE /api/v1/follows/unfollow/{user_id}` - Unfollow user
- `GET /api/v1/follows/stats/{user_id}` - Follow statistics

### Addresses
- `GET /api/v1/addresses/` - Get user addresses
- `POST /api/v1/addresses/` - Create address
- `PATCH /api/v1/addresses/{address_id}` - Update address
- `DELETE /api/v1/addresses/{address_id}` - Delete address

## AI Features
- `POST /api/v1/ai/listings/generate` - AI generate listing text
- `POST /api/v1/ai/listings/price-recommendation` - Price recommendation
- `POST /api/v1/ai/listings/predict-category` - Category prediction
- `POST /api/v1/ai/moderation/check` - Content moderation check
- `GET /api/v1/ai/seller/score/{user_id}` - Seller reputation score

## Utilities
- `POST /api/v1/translate` - Translate text
- `GET /api/v1/content/version` - System version
- `GET /api/v1/seo/landing` - SEO landing page data

---

**Total Available Endpoints: 50+**
**Active Data Points: Users (1), Orders (9), Sellers (1), Verifications (1), Listings (1), Categories (17), Support Tickets (1), Marketing Codes (1)**
