import api from './api';
import type { Listing, Category } from '../types';

// Utility function to deduplicate items by ID
function deduplicateById<T extends { id: number | string }>(items: T[]): T[] {
    const seen = new Set<number | string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
}

export interface PublicShop {
    id: string;
    user_id: string;
    shop_name: string;
    owner_name: string;
    category: string;
    shop_address: string;
    location_lat: number;
    location_lng: number;
    rating: number;
    is_verified: boolean;
    listing_count: number;
    category_ids: number[];
    cover_image: string | null;
    shop_page_banner: string | null;  // Cloudinary URL for shop card banner
    logo_url?: string | null;  // Shop logo/avatar image
    owner_avatar_url?: string | null;  // Owner profile picture
    slug: string;
    created_at: string | null;
    market?: string;  // Kenyan market location (e.g., "Eastleigh Market")
    response_time?: string;
    is_featured?: boolean;
    free_delivery?: boolean;
    phone?: string;  // Seller phone number
    user?: {
        id: string;
        avatar_url?: string;
    };
}

export const listingsService = {
    async getListings(params?: any): Promise<Listing[]> {
        // Simple cache key - MUST include owner_id to prevent showing wrong shop's listings
        const cacheKey = `listings:${JSON.stringify({
            owner_id: params?.owner_id,
            limit: params?.limit,
            skip: params?.skip,
            category: params?.category
        })}`;

        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    // Return cached data if less than 5 minutes old
                    if (data.timestamp && Date.now() - data.timestamp < 300000) {
                        return data.value;
                    }
                } catch (e) {
                    localStorage.removeItem(cacheKey);
                }
            }
        }

        const response = await api.get('/listings/', { params });

        // Deduplicate listings by ID
        const dedupedData = deduplicateById(response.data);

        // Cache the result
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    value: dedupedData,
                    timestamp: Date.now(),
                }));
            } catch (e) {
                // Ignore storage quota errors
            }
        }

        return dedupedData;
    },

    async getListing(id: number | string): Promise<Listing> {
        const response = await api.get(`/listings/${id}`);
        return response.data;
    },

    async createListing(data: any): Promise<Listing> {
        const response = await api.post('/listings/', data);
        return response.data;
    },

    async getCategories(): Promise<Category[]> {
        // Cache categories - they change rarely
        const cacheKey = 'listings:categories';

        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    // Return cached data if less than 1 hour old
                    if (data.timestamp && Date.now() - data.timestamp < 3600000) {
                        return data.value;
                    }
                } catch (e) {
                    localStorage.removeItem(cacheKey);
                }
            }
        }

        const response = await api.get('/listings/categories');

        // Cache the result
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    value: response.data,
                    timestamp: Date.now(),
                }));
            } catch (e) {
                // Ignore storage quota errors
            }
        }

        return response.data;
    },

    async getShops(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        category_id?: number;
        shop_id?: string;
    }): Promise<{ total: number; shops: PublicShop[] }> {
        // Cache key for shops list - only cache when no search
        if (!params?.search && !params?.shop_id && typeof window !== 'undefined') {
            const cacheKey = `shops:${params?.skip || 0}:${params?.limit || 50}:${params?.category_id || 'all'}`;
            const cached = localStorage.getItem(cacheKey);

            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    // Return cached data if less than 10 minutes old
                    if (data.timestamp && Date.now() - data.timestamp < 600000) {
                        return data.value;
                    }
                } catch (e) {
                    localStorage.removeItem(cacheKey);
                }
            }
        }

        const response = await api.get('/listings/shops', { params });

        // Deduplicate shops by user_id to prevent showing same shop twice
        const seenUsers = new Set<string>();
        const dedupedShops = (response.data.shops || []).filter((shop: PublicShop) => {
            if (seenUsers.has(shop.user_id)) return false;
            seenUsers.add(shop.user_id);
            return true;
        });

        const dedupedData = {
            ...response.data,
            shops: dedupedShops
        };

        // Cache the result (only non-search queries)
        if (!params?.search && !params?.shop_id && typeof window !== 'undefined') {
            try {
                const cacheKey = `shops:${params?.skip || 0}:${params?.limit || 50}:${params?.category_id || 'all'}`;
                localStorage.setItem(cacheKey, JSON.stringify({
                    value: dedupedData,
                    timestamp: Date.now(),
                }));
            } catch (e) {
                // Ignore storage quota errors
            }
        }

        return dedupedData;
    },

    async getTrendingListings(): Promise<Listing[]> {
        const response = await api.get('/listings/', { params: { sort: 'trending', limit: 8 } });
        return response.data;
    },

    async getCategoryAttributes(slug: string): Promise<any> {
        const response = await api.get(`/listings/categories/${slug}/attributes`);
        return response.data;
    },

    async getSubcategories(categoryId: number): Promise<any[]> {
        const response = await api.get('/subcategories', { params: { category_id: categoryId } });
        return response.data;
    },

    async uploadImage(file: File): Promise<{ filename: string; url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/listings/upload/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};

