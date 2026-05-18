import api from './api';

export const aiService = {
    async generateListingText(data: { 
        title: string; 
        category?: string; 
        attributes?: any; 
        target_language?: string; 
        type?: string; 
    }) {
        const response = await api.post('/ai/listings/generate', data);
        return response.data;
    },

    async checkModeration(data: { text: string; image_urls?: string[] }) {
        const response = await api.post('/ai/moderation/check', data);
        return response.data;
    },

    async parseSearch(query: string) {
        const response = await api.post('/ai/search/parse', { query });
        return response.data;
    },

    async getPriceRecommendation(data: { title: string; category_id: number; condition: string; currency?: string }) {
        const response = await api.post('/ai/listings/price-recommendation', data);
        return response.data;
    },

    async predictCategory(title: string) {
        const response = await api.post('/ai/listings/predict-category', { title });
        return response.data;
    },

    async getChatSuggestions(conversationId: number) {
        const response = await api.post('/ai/chat/suggestions', { conversation_id: conversationId });
        return response.data;
    },

    async getSellerScore(userId: number) {
        const response = await api.get(`/ai/seller/score/${userId}`);
        return response.data;
    },

    async getDemandInsights(data: { category_id?: number; location?: string }) {
        const response = await api.post('/ai/insights/demand', data);
        return response.data;
    },

    async parseListing(text: string) {
        const response = await api.post('/ai/listings/parse', { text });
        return response.data;
    },

    async getRecommendations(params?: { category_id?: number; limit?: number }) {
        const response = await api.post('/ai/recommendations', params);
        return response.data;
    },

    async getSupportChat(messages: { role: string; content: string }[], currentListingId?: number, ticketId?: number) {
        const response = await api.post('/ai/support/chat', { 
            messages,
            current_listing_id: currentListingId,
            ticket_id: ticketId
        });
        return response.data;
    }
};
