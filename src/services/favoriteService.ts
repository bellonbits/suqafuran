import api from './api';
import type { Listing } from '../types/listing';

export const favoriteService = {
    async getMyFavorites(): Promise<Listing[]> {
        const response = await api.get('/favorites/');
        return response.data;
    },

    async addFavorite(listingId: number): Promise<any> {
        const response = await api.post(`/favorites/${listingId}`);
        return response.data;
    },

    async removeFavorite(listingId: number): Promise<any> {
        const response = await api.delete(`/favorites/${listingId}`);
        return response.data;
    },
};
