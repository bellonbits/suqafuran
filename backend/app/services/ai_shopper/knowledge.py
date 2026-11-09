"""
Suqafuran Marketplace Grounded Knowledge Base
Authoritative reference data for Suqafuran AI Shopper.
Zero-hallucination source of truth for platform features, categories, and policies.
"""

SUQAFURAN_PLATFORM_INFO = {
    "name": "Suqafuran Marketplace",
    "description": (
        "Suqafuran is Kenya's premier digital marketplace connecting verified local businesses, "
        "wholesalers, retailers, and individual buyers across Nairobi, Mombasa, Kisumu, Nakuru, "
        "Eldoret, and nationwide."
    ),
    "primary_currency": "KES (KSh)",
    "hub_locations": [
        "Nairobi (CBD, Eastleigh, Westlands, Gikomba, Kilimani, Karen, Ngong Road)",
        "Mombasa (Nyali, Island, Bamburi)",
        "Kisumu",
        "Nakuru",
        "Eldoret",
        "Thika",
    ],
    "categories": [
        {
            "slug": "fashion",
            "name": "Fashion",
            "highlights": "Clothing, sneakers, heels, traditional wear, bags, accessories",
        },
        {
            "slug": "beauty-personal-care",
            "name": "Health & Beauty",
            "highlights": "Skincare, perfumes, makeup, haircare, personal grooming",
        },
        {
            "slug": "household-items",
            "name": "Household & Kitchenware",
            "highlights": "Cookware, kitchen appliances, furniture, bedding, home decor",
        },
        {
            "slug": "food-groceries",
            "name": "Food & Groceries",
            "highlights": "Pantry staples, fresh foods, snacks, bulk groceries",
        },
        {
            "slug": "electronics",
            "name": "Electronics & Tech",
            "highlights": "Smartphones (iPhone, Samsung, Pixel), Laptops (HP, Dell, MacBook), TVs, Audio",
        },
        {
            "slug": "vehicles",
            "name": "Vehicles",
            "highlights": "Cars, motorbikes, spare parts, vehicle accessories",
        },
        {
            "slug": "leisure-sports",
            "name": "Leisure & Sports",
            "highlights": "Gym equipment, athletic wear, outdoor gear, games",
        },
    ],
    "buying_guide": {
        "how_to_buy": [
            "Search for products or chat with Suqafuran AI Shopper to find recommendations.",
            "Click on any product to view verified specifications, real pricing in KSh, and photos.",
            "Use 'Chat with Seller' to negotiate prices, ask questions, or agree on delivery.",
            "Use 'Make Offer' to submit an instant price proposal to the seller.",
        ],
        "safety_shield": [
            "Always inspect products in person before making payment.",
            "Meet sellers in safe, public places or use trusted physical shop locations.",
            "Never send advance deposits or delivery fees to unknown persons.",
            "Never share your M-Pesa PIN, password, or OTP code with anyone.",
        ],
    },
    "selling_guide": {
        "how_to_sell": [
            "Sign up for a free Suqafuran account and click 'Start Selling' or visit the Seller Studio.",
            "Set your shop name, contact information, and operating market location.",
            "Upload product images, set accurate prices in KSh, and select the correct category.",
            "Post single listings or use the Bulk CSV Import feature on the Business plan.",
        ],
        "plans": [
            {
                "id": "free",
                "name": "Free Shop",
                "price": "KSh 0",
                "capacity": "Up to 20 listings",
                "features": "Basic seller storefront, direct customer messaging",
            },
            {
                "id": "starter",
                "name": "Starter",
                "price": "KSh 750/month (7-Day Free Trial available)",
                "capacity": "Up to 200 listings",
                "features": "Analytics dashboard, verified shop badge, promotional discount codes",
            },
            {
                "id": "business",
                "name": "Business",
                "price": "KSh 2,500/month",
                "capacity": "Unlimited listings",
                "features": "Priority search ranking, 3 team staff accounts, CSV bulk product import, custom shop branding",
            },
        ],
        "verification": (
            "Sellers can submit their National ID or registered business documents to earn the "
            "✓ Verified Shop badge, which boosts buyer confidence and search ranking."
        ),
    },
    "support_contact": {
        "phone": "+254720073322",
        "whatsapp_url": "https://wa.me/254720073322",
        "email": "support@suqafuran.com",
    },
}


def get_marketplace_overview_text() -> str:
    """Returns a rich grounded summary of the marketplace for LLM prompt context."""
    return f"""
SUQAFURAN MARKETPLACE FACTS & POLICIES:
- Name: Suqafuran (Kenya's modern digital marketplace)
- Core Mission: Connecting verified African businesses and sellers directly with buyers with 0% hidden middleman fees.
- Key Hubs: Nairobi (Eastleigh, CBD, Westlands, Gikomba, Kilimani), Mombasa, Kisumu, Nakuru, Eldoret.
- Currency: All prices are strictly in Kenyan Shillings (KSh / KES).
- Direct Seller Connection: Buyers chat directly with shop owners via in-app chat or phone.
- Safety Rules: Inspect items in person before paying. Never send upfront deposits. Never disclose M-Pesa PINs.
- Seller Plans:
  * Free: Up to 20 products.
  * Starter (KSh 750/mo, 7-day free trial): Up to 200 products, verified badge, analytics.
  * Business (KSh 2,500/mo): Unlimited products, priority ranking, bulk import, staff accounts.
- Customer Care Contact: Phone & WhatsApp: +254 720 073322.
"""
