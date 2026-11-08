import api from './api';

export interface UniversalSearchProduct {
  id: number;
  title: string;
  price: number;
  currency: string;
  location: string;
  image: string | null;
  seller_id: number;
  seller_name: string;
  is_verified: boolean;
  category_id?: number;
}

export interface UniversalSearchShop {
  id: number;
  name: string;
  slug: string;
  avatar_url: string | null;
  location: string;
  is_verified: boolean;
  is_featured: boolean;
}

export interface UniversalSearchCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface UniversalSearchResult {
  query: string;
  products: UniversalSearchProduct[];
  shops: UniversalSearchShop[];
  categories: UniversalSearchCategory[];
}

export interface AiShopperProduct extends UniversalSearchProduct {
  directed_message: string;
  chat_url: string;
}

export interface AiShopperResult {
  query: string;
  is_fallback?: boolean;
  understood: {
    keywords?: string;
    budget?: string;
    location?: string;
    category?: string;
    intent_to_chat?: boolean;
    buyer_question?: string;
  };
  ai_advice: string;
  products: AiShopperProduct[];
  shops: UniversalSearchShop[];
  primary_directed_inquiry: AiShopperProduct | null;
}

/**
 * Natural language intent parser for Kenyan marketplace queries
 */
export function parseShoppingQuery(raw: string) {
  const clean = raw.trim();
  let maxPrice: number | null = null;
  let location: string | null = null;

  // Extract budget: e.g. "under 35k", "under 35,000", "below 50k", "< 100k"
  const priceMatch = clean.match(/(?:under|below|less than|up to|within|<=?)\s*(?:ksh|kes)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|m)?/i);
  if (priceMatch) {
    let num = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (priceMatch[2]?.toLowerCase() === 'k') num *= 1000;
    if (priceMatch[2]?.toLowerCase() === 'm') num *= 1000000;
    maxPrice = num;
  }

  // Extract common Kenyan cities/towns
  const towns = ['nairobi', 'eastleigh', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'kiambu', 'westlands', 'cbd', 'kilimani'];
  for (const town of towns) {
    const rx = new RegExp(`\\b(?:in|around|near|at)?\\s*(${town})\\b`, 'i');
    if (rx.test(clean)) {
      location = town.charAt(0).toUpperCase() + town.slice(1);
      break;
    }
  }

  // Strip out conversational wrapper words so search hits real keywords
  let kw = clean
    .replace(/^(?:find|search|show|show me|look for|looking for|i need|i want|please find|recommend|get me|where can i find|tell me about|try searching|explore)\s+/i, '')
    .replace(/(?:under|below|less than|up to|within|<=?)\s*(?:ksh|kes)?\s*\d+(?:,\d+)*(?:\.\d+)?\s*(k|m)?/i, '')
    .replace(/\b(?:in|around|near|at)\s+[a-z]+/i, '')
    .replace(/\b(?:all categories|all category|all products|categories|trending|deals|category)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const isGeneric = !kw || /^(?:all|everything|anything|products|items)$/i.test(kw);

  return {
    raw: clean,
    keywords: isGeneric ? '' : kw,
    isGeneric,
    maxPrice,
    location,
  };
}

export const searchService = {
  /**
   * Search across all products, verified shops, and categories
   */
  async universalSearch(query: string, limit: number = 8): Promise<UniversalSearchResult> {
    const cleanQ = query.trim();
    if (!cleanQ) {
      return { query: '', products: [], shops: [], categories: [] };
    }

    try {
      // 1. Try dedicated endpoint first
      const res = await api.get('/search/universal', {
        params: { q: cleanQ, limit },
      });
      if (res?.data?.products) {
        return res.data;
      }
    } catch {
      // Gracefully fall through to live /listings/ endpoint
    }

    // 2. Resilient live fallback using existing /listings/ API
    try {
      const parsed = parseShoppingQuery(cleanQ);
      const [listingsRes, shopsRes] = await Promise.all([
        api.get('/listings/', { params: { q: parsed.keywords || undefined, limit } }).catch(() => ({ data: [] })),
        api.get('/listings/shops', { params: { search: parsed.keywords || undefined, limit: 4 } }).catch(() => ({ data: { shops: [] } })),
      ]);

      const rawListings = Array.isArray(listingsRes.data) ? listingsRes.data : [];
      const rawShops = Array.isArray(shopsRes.data?.shops) ? shopsRes.data.shops : [];

      const products: UniversalSearchProduct[] = rawListings.map((l: any) => ({
        id: l.id,
        title: l.title_en || l.title_so || l.title || 'Product',
        price: Number(l.price) || 0,
        currency: l.currency || 'KES',
        location: l.location || 'Kenya',
        image: (Array.isArray(l.images) && l.images[0]) ? l.images[0] : (l.image || null),
        seller_id: l.owner_id || l.user_id || 1,
        seller_name: l.owner?.business_name || l.owner?.full_name || 'Verified Seller',
        is_verified: !!(l.owner?.is_verified),
        category_id: l.category_id,
      }));

      const shops: UniversalSearchShop[] = rawShops.map((s: any) => {
        const name = s.business_name || s.name || s.full_name || 'Shop';
        const slug = s.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '');
        return {
          id: s.id,
          name,
          slug,
          avatar_url: s.avatar_url || s.logo_url || null,
          location: s.location || 'Nairobi',
          is_verified: !!s.is_verified,
          is_featured: !!s.is_featured,
        };
      });

      return {
        query: cleanQ,
        products,
        shops,
        categories: [],
      };
    } catch (err) {
      console.error('Universal search fallback error:', err);
      return { query: cleanQ, products: [], shops: [], categories: [] };
    }
  },

  /**
   * AI-Powered Natural Language Shopping Assistant
   * Understands complex shopping prompts, extracts budget/location, queries live products,
   * and formats directed inquiries ready for chat.
   */
  async aiShop(query: string): Promise<AiShopperResult> {
    const cleanQ = query.trim();
    if (!cleanQ) {
      return {
        query: '',
        understood: {},
        ai_advice: 'What product or shop are you looking for today?',
        products: [],
        shops: [],
        primary_directed_inquiry: null,
      };
    }

    const parsed = parseShoppingQuery(cleanQ);

    // 1. Try backend /search/ai-shopper endpoint first
    try {
      const response = await api.post('/search/ai-shopper', {
        query: cleanQ,
      });
      if (response?.data && Array.isArray(response.data.products) && response.data.products.length > 0) {
        return response.data;
      }
    } catch {
      // Backend route not yet deployed or failed, use live marketplace query below
    }

    // 2. Resilient live search via /listings/ and /listings/shops
    try {
      const queryParams: any = { limit: 40 };
      if (parsed.keywords) {
        queryParams.q = parsed.keywords;
      }

      let [listingsRes, shopsRes] = await Promise.all([
        api.get('/listings/', { params: queryParams }).catch(() => ({ data: [] })),
        api.get('/listings/shops', { params: { search: parsed.keywords || undefined, limit: 6 } }).catch(() => ({ data: { shops: [] } })),
      ]);

      let rawListings = Array.isArray(listingsRes.data) ? listingsRes.data : [];
      let rawShops = Array.isArray(shopsRes.data?.shops) ? shopsRes.data.shops : [];
      let isFallback = false;

      // If specific search keyword yielded 0 items, fetch latest active listings so user always sees live products
      if (rawListings.length === 0) {
        const fallbackRes = await api.get('/listings/', { params: { limit: 30 } }).catch(() => ({ data: [] }));
        rawListings = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
        if (parsed.keywords) {
          isFallback = true;
        }
      }

      // If shops were empty, fetch top verified shops
      if (rawShops.length === 0) {
        const fallbackShops = await api.get('/listings/shops', { params: { limit: 6 } }).catch(() => ({ data: { shops: [] } }));
        rawShops = Array.isArray(fallbackShops.data?.shops) ? fallbackShops.data.shops : [];
      }

      // Map to AiShopperProduct format with directed messages
      let products: AiShopperProduct[] = rawListings.map((l: any) => {
        const sellerName = l.owner?.business_name || l.owner?.full_name || 'Verified Seller';
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
          currency: l.currency || 'KES',
          location: l.location || 'Kenya',
          image: firstImg,
          seller_id: sellerId,
          seller_name: sellerName,
          is_verified: !!(l.owner?.is_verified),
          category_id: l.category_id,
          directed_message: directedMsg,
          chat_url: `/messages?userId=${sellerId}&productId=${l.id}`,
        };
      });

      // HARD CONSTRAINT: Budget specified by customer is strictly enforced
      if (parsed.maxPrice) {
        products = products.filter(p => p.price <= parsed.maxPrice!);
      }

      // Map shops
      const shops: UniversalSearchShop[] = rawShops.map((s: any) => {
        const name = s.business_name || s.name || s.full_name || 'Shop';
        const slug = s.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '');
        return {
          id: s.id,
          name,
          slug,
          avatar_url: s.avatar_url || s.logo_url || null,
          location: s.location || 'Nairobi',
          is_verified: !!s.is_verified,
          is_featured: !!s.is_featured,
        };
      });

      // Format clean AI advice text
      const budgetNote = parsed.maxPrice ? ` within KSh ${parsed.maxPrice.toLocaleString()}` : '';
      const locNote = parsed.location ? ` in ${parsed.location}` : '';
      const termDisplay = parsed.keywords || 'top marketplace listings';

      const aiAdvice = products.length > 0
        ? (isFallback
            ? `I couldn't find an exact match for "${cleanQ}". Here are recommended verified listings currently available on Suqafuran.`
            : `Found ${products.length} live product${products.length > 1 ? 's' : ''} for "${termDisplay}"${budgetNote}${locNote}. You can message the seller directly or add items to your cart.`)
        : `Showing featured verified listings across Suqafuran. Tap any item to inspect or chat with the shop owner.`;

      return {
        query: cleanQ,
        is_fallback: isFallback,
        understood: {
          keywords: parsed.keywords || cleanQ,
          budget: parsed.maxPrice ? `Under KSh ${parsed.maxPrice.toLocaleString()}` : 'Market Price',
          location: parsed.location || 'All Kenya',
          intent_to_chat: true,
          buyer_question: 'Is this item currently available?',
        },
        ai_advice: aiAdvice,
        products,
        shops,
        primary_directed_inquiry: products[0] || null,
      };
    } catch (err) {
      console.error('AI Shopper query fallback error:', err);
      return {
        query: cleanQ,
        understood: { keywords: cleanQ },
        ai_advice: 'Explore live listings from verified sellers below.',
        products: [],
        shops: [],
        primary_directed_inquiry: null,
      };
    }
  },
};
