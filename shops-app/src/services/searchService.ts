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
   * Understands shopping requests, finds products/shops, and formats directed inquiries
   */
  async aiShop(query: string): Promise<AiShopperResult> {
    const response = await api.post('/search/ai-shopper', {
      query: query.trim(),
    });
    return response.data;
  },
};

