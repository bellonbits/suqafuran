import api from './api';
import type { Listing } from '../types/listing';
import type { User } from '../types/auth';

export interface OtpLogEntry {
    id: number;
    identifier: string;
    channel: string;
    event_type: string;
    status: string;
    attempt_count: number;
    expires_at: string | null;
    created_at: string;
    meta: Record<string, any> | null;
}

export interface AdminStats {
    total_users: number;
    total_listings: number;
    active_listings: number;
    pending_listings: number;
    pending_promotions: number;
}

export const adminService = {
    async getStats(): Promise<AdminStats> {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    async getModerationQueue(): Promise<Listing[]> {
        const response = await api.get('/admin/queue');
        return response.data;
    },

    async moderateListing(listingId: number, approve: boolean): Promise<Listing> {
        const response = await api.post(`/admin/moderate/${listingId}`, null, {
            params: { approve }
        });
        return response.data;
    },

    async getUsers(params?: { skip?: number; limit?: number; search?: string }): Promise<User[]> {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    async getUserCount(search?: string): Promise<number> {
        const response = await api.get('/admin/users/count', { params: search ? { search } : {} });
        return response.data.total;
    },

    async getOtp(params: { phone?: string; email?: string }): Promise<{ found: boolean; channel?: string; identifier?: string; code?: string; expires_in_seconds?: number; message: string }> {
        const response = await api.get('/admin/otps', { params });
        return response.data;
    },

    async getVerificationAttempts(identifier: string): Promise<{
        user: { id: number; full_name: string; email: string; phone: string; is_verified: boolean } | null;
        attempts: { id: number; document_type: string; status: string; created_at: string; auto_verification_status: string | null }[];
    }> {
        const response = await api.get('/admin/verification-attempts', { params: { identifier } });
        return response.data;
    },

    async getOtpLogs(params: {
        identifier?: string;
        event_type?: string;
        channel?: string;
        date_from?: string;
        date_to?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ total: number; results: OtpLogEntry[] }> {
        const response = await api.get('/admin/otp-logs', { params });
        return response.data;
    },

    async getVerificationRequests() {
        const response = await api.get('/verifications/');
        return response.data;
    },

    async moderateVerification(id: number, status: string) {
        const response = await api.patch(`/verifications/${id}`, { status });
        return response.data;
    },

    async createCategory(data: { name_en: string; name_so?: string; slug: string; icon_name: string; image_url?: string }): Promise<any> {
        const response = await api.post('/listings/categories', data);
        return response.data;
    },

    async updateCategory(id: number, data: Partial<{ name_en: string; name_so?: string; slug: string; icon_name: string; image_url?: string }>): Promise<any> {
        const response = await api.patch(`/listings/categories/${id}`, data);
        return response.data;
    },

    async deleteCategory(id: number): Promise<void> {
        await api.delete(`/listings/categories/${id}`);
    },

    async createSubCategory(data: { name_en: string; name_so?: string; slug: string; category_id: number; image_url?: string }): Promise<any> {
        const response = await api.post('/listings/subcategories', data);
        return response.data;
    },

    async updateSubCategory(id: number, data: Partial<{ name_en: string; name_so?: string; slug: string; image_url?: string }>): Promise<any> {
        const response = await api.patch(`/listings/subcategories/${id}`, data);
        return response.data;
    },

    async deleteSubCategory(id: number): Promise<void> {
        await api.delete(`/listings/subcategories/${id}`);
    },

    async createSubSubCategory(data: { name_en: string; name_so?: string; slug: string; subcategory_id: number; image_url?: string }): Promise<any> {
        const response = await api.post('/listings/subsubcategories', data);
        return response.data;
    },

    async updateSubSubCategory(id: number, data: Partial<{ name_en: string; name_so?: string; slug: string; image_url?: string }>): Promise<any> {
        const response = await api.patch(`/listings/subsubcategories/${id}`, data);
        return response.data;
    },

    async deleteSubSubCategory(id: number): Promise<void> {
        await api.delete(`/listings/subsubcategories/${id}`);
    },

    async updateUserStatus(userId: number, isActive: boolean): Promise<User> {
        const response = await api.post(`/admin/users/${userId}/status`, null, {
            params: { is_active: isActive }
        });
        return response.data;
    },

    async deleteUser(userId: number): Promise<void> {
        await api.delete(`/admin/users/${userId}`);
    },

    async sendManualEmail(data: {
        email: string;
        subject: string;
        title: string;
        subtitle?: string;
        content_html: string;
        action_text?: string;
        action_url?: string;
        campaign_id?: string;
    }): Promise<any> {
        const response = await api.post('/admin/email/send-manual', data);
        return response.data;
    },

    async sendBroadcastEmail(data: {
        subject: string;
        title: string;
        subtitle?: string;
        content_html: string;
        action_text?: string;
        action_url?: string;
        campaign_id?: string;
    }): Promise<any> {
        const response = await api.post('/admin/email/broadcast', data);
        return response.data;
    },

    async getBusinessesQueue(): Promise<any[]> {
        const response = await api.get('/admin/businesses/queue');
        return response.data;
    },

    async approveBusiness(businessId: string): Promise<any> {
        const response = await api.post(`/admin/businesses/${businessId}/approve`);
        return response.data;
    },

    async disapproveBusiness(businessId: string): Promise<any> {
        const response = await api.post(`/admin/businesses/${businessId}/disapprove`);
        return response.data;
    }
};
