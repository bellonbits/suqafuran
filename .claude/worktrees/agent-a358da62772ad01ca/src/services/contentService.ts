import api from './api';

export const contentService = {
    async getContentOverrides() {
        try {
            const response = await api.get('/content/');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch content overrides:', error);
            return { en: {}, so: {} };
        }
    },

    async getAllContent() {
        const response = await api.get('/content/all');
        return response.data;
    },

    async updateContent(key: string, data: { value_en?: string, value_so?: string }) {
        const response = await api.patch(`/content/${key}`, data);
        return response.data;
    },

    async syncContent(contentMap: any, pageGroup: string = 'general') {
        const response = await api.post('/content/sync', contentMap, {
            params: { page_group: pageGroup }
        });
        return response.data;
    }
};
