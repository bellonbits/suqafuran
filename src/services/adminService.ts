import api from './api';
import type { Listing } from '../types/listing';
import type { User } from '../types/auth';

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

    async getUsers(): Promise<User[]> {
        const response = await api.get('/admin/users');
        return response.data;
    },

    async getVerificationRequests() {
        const response = await api.get('/verifications');
        return response.data;
    },

    async moderateVerification(id: number, status: string) {
        const response = await api.patch(`/verifications/${id}`, { status });
        return response.data;
    },

    async createCategory(data: { name: string; slug: string; icon_name: string }): Promise<any> {
        const response = await api.post('/listings/categories', data);
        return response.data;
    },

    async deleteCategory(id: number): Promise<void> {
        await api.delete(`/listings/categories/${id}`);
    }
};
