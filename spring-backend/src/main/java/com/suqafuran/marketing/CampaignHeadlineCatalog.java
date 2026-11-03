package com.suqafuran.marketing;

import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * High-converting, rotating headline catalog for African marketplace marketing campaigns.
 * Guarantees 15 to 20 diverse variants per campaign type to avoid headline fatigue.
 */
public final class CampaignHeadlineCatalog {

    private static final Map<MarketingCampaignType, List<String>> CATALOG = new EnumMap<>(MarketingCampaignType.class);

    static {
        // 1. BUYER_REENGAGEMENT (15 variants)
        CATALOG.put(MarketingCampaignType.BUYER_REENGAGEMENT, List.of(
            "New products are waiting for you on Suqafuran",
            "Come back and discover what's new in your area",
            "It's been a while — see what sellers have posted",
            "We miss you on Suqafuran! Check out what's new today",
            "Lots of fresh listings have arrived since your last visit",
            "Ready to explore? New deals are waiting for you",
            "Catch up on what you've missed on Suqafuran",
            "Sellers near you have posted hundreds of new items",
            "Come take another look — fresh listings just added",
            "It's a great time to browse Suqafuran again",
            "Your local marketplace is full of new opportunities today",
            "Don't miss out on what's new since you've been away",
            "New deals matching your interests are live right now",
            "See what's happening on Suqafuran today",
            "Take a minute to see what sellers posted recently"
        ));

        // 2. NEW_ARRIVALS (15 variants)
        CATALOG.put(MarketingCampaignType.NEW_ARRIVALS, List.of(
            "New products just added on Suqafuran",
            "Fresh listings you haven't seen yet",
            "Just in: new arrivals near your location",
            "Fresh picks just dropped on the marketplace",
            "Check out what's new on Suqafuran today",
            "New arrivals in your area are moving fast",
            "Fresh items just posted by local verified sellers",
            "Hot off the press: latest additions on Suqafuran",
            "Explore brand-new listings in your neighborhood",
            "New stock alert: see today's newest marketplace items",
            "Just listed! Discover fresh deals around you",
            "Don't miss out on today's newest arrivals",
            "Early look: brand new products on Suqafuran",
            "Fresh deals waiting for you right now",
            "New items added near you — take a quick look"
        ));

        // 3. WEEKLY_DIGEST (15 variants)
        CATALOG.put(MarketingCampaignType.WEEKLY_DIGEST, List.of(
            "This week on Suqafuran: top picks & fresh deals",
            "Your weekly marketplace roundup and summary",
            "Top highlights from Suqafuran this week",
            "This week's best deals and new arrivals",
            "Marketplace recap: what you might have missed",
            "Your weekly digest of top Suqafuran finds",
            "Weekly top picks: popular deals near you",
            "Explore the week's hottest listings on Suqafuran",
            "Your curated Suqafuran weekly market update",
            "The best of Suqafuran: your weekly recap",
            "Weekend marketplace digest: top finds & new shops",
            "What moved fastest on Suqafuran this week",
            "Fresh picks and top trends in your weekly digest",
            "Weekly buyer's guide: new products across categories",
            "Catch up on this week's most-viewed products"
        ));

        // 4. PRICE_DROP_ALERT (15 variants)
        CATALOG.put(MarketingCampaignType.PRICE_DROP_ALERT, List.of(
            "Good news! An item you saved is now cheaper",
            "Price drop alert: savings on items you liked",
            "Save now: price reduced on a listing you watched",
            "Great news: price cut on an item on your radar",
            "Price reduction alert! Don't miss this deal",
            "The seller just lowered the price for you",
            "It's cheaper today! Check out this price reduction",
            "Price drop notification: grab it before someone else does",
            "Special update: cheaper price on your saved listing",
            "Good timing: price just reduced on Suqafuran",
            "New bargain alert: price reduced on your favorite item",
            "Price slashed! See the new lower price now",
            "Discount update: the seller dropped their price",
            "Save today: price reduction on a product you viewed",
            "Urgent price drop: the item you liked is now on sale"
        ));

        // 5. SAVED_SEARCH_MATCH (15 variants)
        CATALOG.put(MarketingCampaignType.SAVED_SEARCH_MATCH, List.of(
            "New listings match your saved search criteria",
            "Fresh matches found for your saved alert",
            "Just listed: items matching what you're looking for",
            "New products matching your search are now live",
            "Search alert: new items matching your exact filters",
            "We found new matches for your saved search query!",
            "Great news: fresh listings match your search alert",
            "Your search alert found new items today",
            "Instant match: new items for your saved search",
            "New results available for your saved alert",
            "Check out newly posted listings matching your search",
            "Fresh items matching your keywords were just posted",
            "Alert update: new matches ready for your review",
            "Items you've been searching for were just listed",
            "New match alert: take a look before they're sold"
        ));

        // 6. SELLER_INACTIVITY_NUDGE (15 variants)
        CATALOG.put(MarketingCampaignType.SELLER_INACTIVITY_NUDGE, List.of(
            "Buyers are searching for products like yours on Suqafuran",
            "It's been a while — check your listings on Suqafuran",
            "Buyers are active in your area! Give your shop a refresh",
            "Keep the momentum going: update your items on Suqafuran",
            "Your shop has visitors — update your stock today",
            "Reconnect with buyers: restock or refresh your listings",
            "Demand is high: see what buyers are looking for in your category",
            "Give your listings a boost — return to Suqafuran today",
            "Are your items still available? Update your shop status",
            "Come back to active sales: refresh your Suqafuran storefront",
            "Buyers are browsing: renew your listings for more leads",
            "High marketplace interest: don't leave buyers waiting",
            "Time to restock: keep your shop active and visible",
            "Active buyers are searching your category right now",
            "Boost your sales: add new products or update existing ones"
        ));

        // 7. SHOP_SPOTLIGHT (15 variants)
        CATALOG.put(MarketingCampaignType.SHOP_SPOTLIGHT, List.of(
            "Discover this week's featured shop on Suqafuran",
            "A verified shop worth checking out today",
            "Meet one of our top trusted marketplace sellers",
            "Featured seller: quality products from a verified shop",
            "Explore this verified merchant's full catalog",
            "Spotlight on a trusted local Suqafuran seller",
            "Shop local: check out this week's featured vendor",
            "Great products from a top-rated shop owner",
            "Meet a seller buyers consistently trust on Suqafuran",
            "Featured store of the week: explore their inventory",
            "Quality verified: browse this top merchant's shop",
            "Seller in focus: exceptional deals and fast responses",
            "Explore goods from one of our most active shops",
            "Trusted shop alert: see what they have in stock",
            "Discover great inventory from this week's spotlight shop"
        ));

        // 8. TRENDING_PRODUCTS (15 variants)
        CATALOG.put(MarketingCampaignType.TRENDING_PRODUCTS, List.of(
            "What's trending on Suqafuran right now",
            "The most-viewed listings across the marketplace",
            "See what items everyone's looking at today",
            "Top trending deals on Suqafuran this week",
            "Hot listings getting the most buyer attention today",
            "Trending now: popular picks buyers are eyeing",
            "What's hot on the marketplace right now",
            "The most popular products of the week on Suqafuran",
            "Discover what other buyers are viewing today",
            "Trending items that might sell out quickly",
            "Marketplace favorites: today's most-wanted items",
            "High-demand listings catching buyers' eyes",
            "Top picks generating buzz on Suqafuran",
            "Trending alert: items buyers are inquiring about",
            "See this week's highest-ranked products"
        ));
    }

    private CampaignHeadlineCatalog() {}

    /**
     * Retrieve all available headline variants for a campaign type.
     */
    public static List<String> getHeadlines(MarketingCampaignType type) {
        return CATALOG.getOrDefault(type, Collections.emptyList());
    }

    /**
     * Select a rotating headline without revolving in just one headline.
     * Uses user ID offset + send sequence modulo total variants.
     */
    public static String getRotatingHeadline(MarketingCampaignType type, Long userId, int sendSequence) {
        List<String> variants = getHeadlines(type);
        if (variants.isEmpty()) {
            return "Latest updates from Suqafuran";
        }
        long uid = userId != null ? Math.abs(userId) : 0L;
        int index = (int) ((uid + sendSequence) % variants.size());
        return variants.get(index);
    }
}

