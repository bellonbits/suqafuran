import api from './api';
import type { Listing, Category } from '../types';

export const listingsService = {
    async getListings(params?: any): Promise<Listing[]> {
        const response = await api.get('/listings/', { params });
        return response.data;
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
        const response = await api.get('/listings/categories');
        return response.data;
    },

    async getTrendingListings(): Promise<Listing[]> {
        const response = await api.get('/listings/', { params: { sort: 'trending', limit: 8 } });
        return response.data;
    },

    async getCategoryAttributes(slug: string): Promise<any> {
        const response = await api.get(`/listings/categories/${slug}/attributes`);
        return response.data;
    },

    async uploadImage(file: File): Promise<{ filename: string; url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/listings/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};
