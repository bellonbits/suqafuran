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

export const searchService = {
  /**
   * Search across all products, verified shops, and categories simultaneously
   */
  async universalSearch(query: string, limit: number = 6): Promise<UniversalSearchResult> {
    if (!query.trim()) {
      return { query: '', products: [], shops: [], categories: [] };
    }
    const response = await api.get('/search/universal', {
      params: { q: query.trim(), limit },
    });
    return response.data;
  },

  /**
   * AI-Powered Natural Language Shopping Assistant
   * Understands shopping requests, finds products/shops, and formats directed inquiries.
   * Includes graceful fallback to live marketplace search if the AI endpoint is unreachable.
   */
  async aiShop(query: string): Promise<AiShopperResult> {
    const cleanQ = query.trim();
    if (!cleanQ) {
      return {
        query: '',
        understood: {},
        ai_advice: 'Please describe what you want to buy.',
        products: [],
        shops: [],
        primary_directed_inquiry: null,
      };
    }

    try {
      const response = await api.post('/search/ai-shopper', {
        query: cleanQ,
      });
      if (response?.data && Array.isArray(response.data.products)) {
        return response.data;
      }
      throw new Error('Invalid AI response structure');
    } catch (err) {
      // Graceful fallback: query live products and shops directly from the marketplace
      try {
        const fallback = await this.universalSearch(cleanQ, 12);
        const products: AiShopperProduct[] = (fallback.products || []).map((p) => ({
          ...p,
          directed_message: (
            `${p.image ? `[PRODUCT_IMAGE]: ${p.image}\n` : ''}` +
            `🛍️ INQUIRY: ${p.title}\n\n` +
            `Hi ${p.seller_name}! 👋 I found your listing on Suqafuran for "${p.title}" (KSh ${p.price?.toLocaleString() || '0'}).\n` +
            `Is this item currently available? I would like to arrange delivery/inspection.\n\n` +
            `Please confirm availability so we can proceed. Thank you!`
          ),
          chat_url: `/messages?userId=${p.seller_id}&productId=${p.id}`,
        }));

        return {
          query: cleanQ,
          understood: {
            keywords: cleanQ,
            budget: 'Market Price',
            location: 'Kenya',
            intent_to_chat: true,
            buyer_question: 'Is this item currently available?',
          },
          ai_advice: products.length > 0
            ? `Found ${products.length} live product${products.length > 1 ? 's' : ''} for "${cleanQ}". Select any item to view or message the verified seller directly.`
            : `No exact matches found for "${cleanQ}". Try searching for broader terms or related categories.`,
          products,
          shops: fallback.shops || [],
          primary_directed_inquiry: products[0] || null,
        };
      } catch (fallbackErr) {
        return {
          query: cleanQ,
          understood: { keywords: cleanQ },
          ai_advice: `Please try another search or check back shortly.`,
          products: [],
          shops: [],
          primary_directed_inquiry: null,
        };
      }
    }
  },
};
