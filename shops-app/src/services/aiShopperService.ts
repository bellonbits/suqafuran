import api from './api';

export interface ShopperProduct {
  id: number;
  title: string;
  price: number;
  compare_at_price?: number | null;
  currency: string;
  condition: string;
  location: string;
  image?: string | null;
  seller_id: number;
  seller_name: string;
  is_verified: boolean;
  category_id?: number;
  match_score?: number;
  match_reasons?: string[];
  directed_message: string;
  listing_url: string;
  chat_url: string;
  attributes?: Record<string, any>;
}

export interface ShopperSeller {
  id: number;
  name: string;
  slug: string;
  avatar_url?: string | null;
  location: string;
  is_verified: boolean;
  shop_url: string;
}

export interface ComparisonDimension {
  dimension: string;
  values: Record<string, string>;
  winner_id?: number | null;
  note?: string | null;
}

export interface ComparisonData {
  products: ShopperProduct[];
  dimensions: ComparisonDimension[];
  strengths: Record<string, string[]>;
  limitations: Record<string, string[]>;
  verdict: string;
  best_overall_id?: number | null;
  best_budget_id?: number | null;
}

export interface ShopperChatResponse {
  message: string;
  intent: string;
  products: ShopperProduct[];
  comparison?: ComparisonData | null;
  sellers: ShopperSeller[];
  suggested_followups: string[];
  conversation_id: string;
  is_fallback: boolean;
}

/**
 * Intelligent client-side fallback query parser
 */
function parseClientQuery(raw: string) {
  const clean = raw.trim();
  let maxPrice: number | null = null;
  let location: string | null = null;

  const priceMatch = clean.match(/(?:under|below|less than|up to|within|<=?)\s*(?:ksh|kes)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|m)?/i);
  if (priceMatch) {
    let num = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (priceMatch[2]?.toLowerCase() === 'k') num *= 1000;
    if (priceMatch[2]?.toLowerCase() === 'm') num *= 1000000;
    maxPrice = num;
  }

  const towns = ['nairobi', 'eastleigh', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'kiambu', 'westlands', 'cbd', 'kilimani'];
  for (const town of towns) {
    const rx = new RegExp(`\\b(?:in|around|near|at)?\\s*(${town})\\b`, 'i');
    if (rx.test(clean)) {
      location = town.charAt(0).toUpperCase() + town.slice(1);
      break;
    }
  }

  let kw = clean
    .replace(/^(?:find|search|show|show me|look for|looking for|i need|i want|please find|recommend|get me|where can i find|tell me about|try searching|explore|help me choose|choose)\s+/i, '')
    .replace(/(?:under|below|less than|up to|within|<=?)\s*(?:ksh|kes)?\s*\d+(?:,\d+)*(?:\.\d+)?\s*(k|m)?/i, '')
    .replace(/\b(?:within|on)\s+(?:a\s+|my\s+)?budget\b/gi, '')
    .replace(/\b(?:in|around|near|at)\s+[a-z]+/i, '')
    .replace(/\b(?:all categories|all category|all products|categories|trending|deals|category|popular products|popular)\b/gi, '')
    .replace(/^(?:a|an|the)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Normalize common queries to marketplace root keywords
  if (/smartphones?|phones?|mobiles?/i.test(kw)) kw = 'phone';
  else if (/laptops?|notebooks?|macbooks?/i.test(kw)) kw = 'laptop';
  else if (/fashions?|clothes?|clothing|dresses?/i.test(kw)) kw = 'fashion';
  else if (/appliances?|home appliances?/i.test(kw)) kw = 'appliance';

  return { clean, keywords: kw, maxPrice, location };
}

export const aiShopperService = {
  /**
   * Main Conversational Shopping Request
   */
  async chat(message: string, conversationId?: string): Promise<ShopperChatResponse> {
    const cleanMsg = message.trim();
    if (!cleanMsg) {
      return {
        message: "Tell me what you're looking for. I'll help you discover products, compare options, and find the right sellers.",
        intent: "general",
        products: [],
        sellers: [],
        suggested_followups: [
          "Find a smartphone within my budget",
          "Help me choose a laptop",
          "Discover fashion deals",
        ],
        conversation_id: conversationId || "new",
        is_fallback: false,
      };
    }

    // 1. Try Backend API first (/ai-shopper/chat)
    try {
      const res = await api.post('/ai-shopper/chat', {
        message: cleanMsg,
        conversation_id: conversationId,
      });
      if (res?.data && typeof res.data.message === 'string') {
        return res.data;
      }
    } catch {
      // Fallback gracefully to direct marketplace listings query
    }

    // 2. High-resilience marketplace fallback
    return this.fallbackSearch(cleanMsg, conversationId);
  },

  /**
   * Structured Search
   */
  async search(query: string, filters: { maxPrice?: number; location?: string; condition?: string } = {}): Promise<ShopperChatResponse> {
    const clean = query.trim();
    try {
      const res = await api.post('/ai-shopper/search', {
        query: clean,
        max_price: filters.maxPrice,
        location: filters.location,
        condition: filters.condition,
        limit: 12,
      });
      if (res?.data && Array.isArray(res.data.products)) {
        return {
          message: res.data.is_fallback
            ? `I couldn't find exact matches for "${clean}". Here are top recommended listings currently on Suqafuran.`
            : `Found ${res.data.products.length} live product${res.data.products.length > 1 ? 's' : ''} matching your search.`,
          intent: "search",
          products: res.data.products,
          sellers: res.data.sellers || [],
          suggested_followups: ["Compare top picks", "Show verified shops only", "Under my budget"],
          conversation_id: "search-session",
          is_fallback: res.data.is_fallback,
        };
      }
    } catch {
      // Fallback
    }

    return this.fallbackSearch(clean);
  },

  /**
   * Product Comparison
   */
  async compare(productIds: number[], query: string = ""): Promise<ComparisonData | null> {
    try {
      const res = await api.post('/ai-shopper/compare', {
        product_ids: productIds,
        query,
      });
      if (res?.data?.comparison) {
        return res.data.comparison;
      }
    } catch {
      // Fallback
    }
    return null;
  },

  /**
   * Suggestions for Welcome Screen
   */
  async getSuggestions(): Promise<string[]> {
    try {
      const res = await api.get('/ai-shopper/suggestions');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return [
      "Find a smartphone within my budget",
      "Help me choose a laptop",
      "Discover fashion deals",
      "Find home appliances",
      "Compare popular products",
    ];
  },

  /**
   * Delete Conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await api.delete(`/ai-shopper/conversations/${conversationId}`);
    } catch {
      // Ignore
    }
  },

  /**
   * Resilient fallback query using live /listings/ and /listings/shops
   */
  async fallbackSearch(cleanMsg: string, conversationId: string = "fallback"): Promise<ShopperChatResponse> {
    const parsed = parseClientQuery(cleanMsg);

    try {
      const queryParams: any = { limit: 30 };
      if (parsed.keywords) {
        queryParams.q = parsed.keywords;
      }

      let [listingsRes, shopsRes] = await Promise.all([
        api.get('/listings/', { params: queryParams }).catch(() => ({ data: [] })),
        api.get('/listings/shops', { params: { search: parsed.keywords || undefined, limit: 4 } }).catch(() => ({ data: { shops: [] } })),
      ]);

      let rawListings = Array.isArray(listingsRes.data) ? listingsRes.data : [];
      let rawShops = Array.isArray(shopsRes.data?.shops) ? shopsRes.data.shops : [];
      let isFallback = false;

      // If specific search keyword yielded 0 items, fetch latest active listings so user ALWAYS sees real products
      if (rawListings.length === 0) {
        const fallbackRes = await api.get('/listings/', { params: { limit: 20 } }).catch(() => ({ data: [] }));
        rawListings = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
        if (parsed.keywords) {
          isFallback = true;
        }
      }

      if (rawShops.length === 0) {
        const fallbackShops = await api.get('/listings/shops', { params: { limit: 4 } }).catch(() => ({ data: { shops: [] } }));
        rawShops = Array.isArray(fallbackShops.data?.shops) ? fallbackShops.data.shops : [];
      }

      let products: ShopperProduct[] = rawListings.map((l: any) => {
        const sellerName = l.owner?.business_name || l.owner?.full_name || 'Verified Shop';
        const firstImg = (Array.isArray(l.images) && l.images[0]) ? l.images[0] : (l.image || '');
        const priceVal = Number(l.price) || 0;
        const titleStr = l.title_en || l.title_so || l.title || 'Product';
        const sellerId = l.owner_id || l.user_id || 1;

        const directedMsg = (
          `${firstImg ? `[PRODUCT_IMAGE]: ${firstImg}\n` : ''}` +
          `🛍️ INQUIRY: ${titleStr}\n\n` +
          `Hi ${sellerName}! 👋 I found your listing on Suqafuran for "${titleStr}" (KSh ${priceVal.toLocaleString()}).\n` +
          `Is this item currently available? I would like to arrange delivery/inspection.\n\n` +
          `Please confirm availability so we can proceed. Thank you!`
        ).trim();

        return {
          id: l.id,
          title: titleStr,
          price: priceVal,
          compare_at_price: l.compare_at_price ? Number(l.compare_at_price) : null,
          currency: l.currency || 'KES',
          condition: l.condition || 'Used',
          location: l.location || 'Kenya',
          image: firstImg,
          seller_id: sellerId,
          seller_name: sellerName,
          is_verified: !!(l.owner?.is_verified),
          category_id: l.category_id,
          directed_message: directedMsg,
          listing_url: `/listing/${l.id}`,
          chat_url: `/messages?userId=${sellerId}&productId=${l.id}`,
          attributes: l.attributes || {},
        };
      });

      if (parsed.maxPrice) {
        const filtered = products.filter(p => p.price <= parsed.maxPrice!);
        if (filtered.length > 0) products = filtered;
      }

      const sellers: ShopperSeller[] = rawShops.map((s: any) => {
        const name = s.business_name || s.name || s.full_name || 'Shop';
        return {
          id: s.id,
          name,
          slug: s.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, ''),
          avatar_url: s.avatar_url || s.logo_url || null,
          location: s.location || 'Nairobi',
          is_verified: !!s.is_verified,
          shop_url: `/shop/${s.slug || s.id}`,
        };
      });

      let advice = "";
      if (isFallback) {
        advice = `I couldn't find exact matches for "${cleanMsg}". Here are recommended verified listings currently available on Suqafuran.`;
      } else if (products.length > 0) {
        const top = products[0];
        advice = `Found ${products.length} live product${products.length > 1 ? 's' : ''} on Suqafuran. Highly recommended is "${top.title}" (KSh ${top.price.toLocaleString()}) from ${top.seller_name}.`;
      } else {
        advice = `Showing featured verified listings across Suqafuran. Ask me for specific brands or budget ranges!`;
      }

      return {
        message: advice,
        intent: "search",
        products,
        sellers,
        suggested_followups: [
          "Show options under my budget",
          "Show brand new items only",
          "Show verified shops",
        ],
        conversation_id: conversationId,
        is_fallback: isFallback,
      };
    } catch {
      return {
        message: "Explore featured marketplace listings below or let me know what you'd like to find.",
        intent: "general",
        products: [],
        sellers: [],
        suggested_followups: [
          "Smart TVs under 35,000 KSh",
          "Sneakers & sports shoes",
          "Laptops for work",
        ],
        conversation_id: conversationId,
        is_fallback: false,
      };
    }
  },
};

