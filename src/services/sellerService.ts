import api from './api';

export interface Seller {
    id: number;
    full_name: string;
    email: string;
    phone?: string | null;
    business_name: string;
    shop_description?: string | null;
    shop_page_banner?: string | null;
    shop_detail_banner?: string | null;
    avatar_url?: string | null;
    is_verified: boolean;
    is_featured: boolean;
    free_delivery: boolean;
    verified_level?: string;
    trust_score: number;
    trust_level: string;
    location?: string | null;
    response_time?: string;
    created_at: string;
    listings_count: number;
}

export interface SellerCheckResult {
    is_seller: boolean;
    user_id: number;
}

export const sellerService = {
    /**
     * Get all sellers.
     * Sellers = verified users with at least one active, approved listing.
     * No separate registration required.
     */
    async getSellers(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        featured_only?: boolean;
    }): Promise<Seller[]> {
        const response = await api.get('/sellers/', { params });
        return response.data;
    },

    /**
     * Count all qualified sellers (for pagination).
     */
    async countSellers(search?: string): Promise<number> {
        const response = await api.get('/sellers/count', {
            params: search ? { search } : {},
        });
        return response.data.total;
    },

    /**
     * Get a single seller's public profile by user ID.
     * Throws 404 if the user is not a verified seller with active listings.
     */
    async getSeller(sellerId: number): Promise<Seller> {
        const response = await api.get(`/sellers/${sellerId}`);
        return response.data;
    },

    /**
     * Quick check: returns whether a user is currently a qualified seller.
     * Useful for conditionally rendering seller-specific UI.
     */
    async isUserSeller(userId: number): Promise<SellerCheckResult> {
        const response = await api.get(`/sellers/${userId}/is-seller`);
        return response.data;
    },
};
