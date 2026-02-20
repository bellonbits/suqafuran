import api from './api';

export interface PromotionPlan {
    id: number;
    name: string;
    price_usd: number;
    duration_days: number;
    description?: string;
}

export interface Promotion {
    id: number;
    listing_id: number;
    listing_title?: string;
    plan_id: number;
    plan_name?: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';
    payment_proof?: string;
    admin_notes?: string;
    promotion_code?: string;
    approved_by?: number;
    approved_at?: string;
    created_at: string;
    updated_at: string;
    expires_at?: string;
}

export const promotionService = {
    getPlans: async (): Promise<PromotionPlan[]> => {
        const response = await api.get('/promotions/plans');
        return response.data;
    },

    createPromotion: async (listingId: number, planId: number, paymentPhone: string): Promise<Promotion> => {
        const response = await api.post('/promotions/', {
            listing_id: listingId,
            plan_id: planId,
            payment_phone: paymentPhone,
        });
        return response.data;
    },

    checkPayment: async (promotionId: number): Promise<{ status: string; message: string; expires_at?: string }> => {
        const response = await api.post(`/promotions/${promotionId}/check-payment`);
        return response.data;
    },

    submitProof: async (promotionId: number, proof: string): Promise<Promotion> => {
        const response = await api.post(`/promotions/${promotionId}/proof`, {
            payment_proof: proof,
        });
        return response.data;
    },

    getMyPromotions: async (): Promise<Promotion[]> => {
        const response = await api.get('/promotions/my');
        return response.data;
    },

    // Admin-only functions
    getPendingPromotions: async (): Promise<Promotion[]> => {
        const response = await api.get('/promotions/pending');
        return response.data;
    },

    approvePromotion: async (promotionId: number, planId: number): Promise<{ success: boolean; promotion_code: string; expires_at: string; message: string }> => {
        const response = await api.post(`/promotions/${promotionId}/approve`, {
            plan_id: planId,
        });
        return response.data;
    },

    rejectPromotion: async (promotionId: number, reason: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.post(`/promotions/${promotionId}/reject`, {
            reason,
        });
        return response.data;
    },

    directPromote: async (listingId: number, planId: number): Promise<{ success: boolean; promotion_code: string; listing_id: number; listing_title: string; message: string }> => {
        const response = await api.post('/promotions/admin/direct-promote', {
            listing_id: listingId,
            plan_id: planId,
        });
        return response.data;
    },

    generateCode: async (amount: number = 0): Promise<{ code: string; id: number; amount: number }> => {
        const response = await api.post('/promotions/codes/generate', { amount });
        return response.data;
    },

    applyCode: async (payload: { code: string; listing_id: number; plan_id: number }): Promise<{ success: boolean; message: string }> => {
        const response = await api.post('/promotions/codes/apply', payload);
        return response.data;
    },

    // Agent Portal Methods
    getPaymentQueue: async (): Promise<any[]> => {
        const response = await api.get('/promotions/agent/payment-queue');
        return response.data;
    },

    getPendingOrders: async (): Promise<any[]> => {
        const response = await api.get('/promotions/agent/pending-orders');
        return response.data;
    },

    matchPayment: async (promotionId: number, transactionId: number): Promise<{ success: boolean; message: string }> => {
        const response = await api.post(`/promotions/${promotionId}/match`, {
            transaction_id: transactionId,
        });
        return response.data;
    },

    agentActivate: async (promotionId: number): Promise<{ success: boolean; message: string }> => {
        const response = await api.post(`/promotions/${promotionId}/activate`);
        return response.data;
    },

    getAgentHistory: async (): Promise<any[]> => {
        const response = await api.get('/promotions/agent/history');
        return response.data;
    },

    rejectTransaction: async (transactionId: number): Promise<{ success: boolean; message: string }> => {
        const response = await api.post(`/promotions/agent/transactions/${transactionId}/reject`);
        return response.data;
    },
};

export default promotionService;
