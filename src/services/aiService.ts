import api from './api';

export interface AIGenerationPayload {
  type: 'title' | 'description' | 'translate';
  input: string;
  target_language?: 'en' | 'so';
  category?: string;
  attributes?: Record<string, any>;
}

export const aiService = {
  generate: async (payload: AIGenerationPayload) => {
    const response = await api.post('/ai/listings/generate', payload);
    return response.data;
  },
  checkModeration: async (listingData: any) => {
    const response = await api.post('/ai/moderation/check', listingData);
    return response.data;
  },
  parseSearch: async (query: string) => {
    const response = await api.post('/ai/search/parse', { query });
    return response.data;
  },
  getPriceRecommendation: async (listingData: any) => {
    const response = await api.post('/ai/listings/price-recommendation', listingData);
    return response.data;
  },
  predictCategory: async (title: string, description?: string) => {
    const response = await api.post('/ai/listings/predict-category', { title, description });
    return response.data;
  },
  getChatSuggestions: async (messages: any[], role: 'buyer' | 'seller') => {
    const response = await api.post('/ai/chat/suggestions', { messages, role });
    return response.data;
  },
  getSellerScore: async (userId: number) => {
    const response = await api.get(`/ai/seller/score/${userId}`);
    return response.data;
  },
  getDemandInsights: async (location: string, category: string) => {
    const response = await api.post('/ai/insights/demand', { location, category });
    return response.data;
  },
  getRecommendations: async (history: string[]) => {
    const response = await api.post('/ai/recommendations', { history });
    return response.data;
  },
  parseListing: async (input: string) => {
    const response = await api.post('/ai/listings/parse', { input });
    return response.data;
  },
};
