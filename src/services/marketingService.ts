import api from './api';

export interface MarketingCode {
    id: number;
    code: string;
    description: string;
    created_by: string;
    max_uses: number | null;
    uses_count: number;
    ads_posted_count: number;
    conversion_rate: number;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
    is_expired: boolean;
}

export interface CreateCodePayload {
    code: string;
    description?: string;
    created_by?: string;
    max_uses?: number | null;
    expires_at?: string | null;
}

export const marketingService = {
    async listCodes(): Promise<MarketingCode[]> {
        const res = await api.get('/marketing/codes');
        return res.data;
    },

    async createCode(payload: CreateCodePayload): Promise<MarketingCode> {
        const res = await api.post('/marketing/codes', payload);
        return res.data;
    },

    async toggleCode(id: number, is_active: boolean): Promise<MarketingCode> {
        const res = await api.patch(`/marketing/codes/${id}`, { is_active });
        return res.data;
    },

    async validateCode(code: string): Promise<{ valid: boolean; reason?: string; description?: string }> {
        const res = await api.get(`/marketing/validate/${encodeURIComponent(code)}`);
        return res.data;
    },
};
