import api from './api';
import type { Listing, Category, ListingCreate } from '../types/listing';

export const listingService = {
    async getListings(params?: any): Promise<Listing[]> {
        const response = await api.get('/listings/', { params });
        return response.data;
    },

    async getListing(id: number): Promise<Listing> {
        const response = await api.get(`/listings/${id}`);
        return response.data;
    },

    async createListing(data: ListingCreate): Promise<Listing> {
        const response = await api.post('/listings/', data);
        return response.data;
    },

    async updateListing(id: number, data: Partial<ListingCreate>): Promise<Listing> {
        const response = await api.put(`/listings/${id}`, data);
        return response.data;
    },

    async deleteListing(id: number): Promise<void> {
        await api.delete(`/listings/${id}`);
    },

    async getMyListings(): Promise<Listing[]> {
        const response = await api.get('/listings/me');
        return response.data;
    },

    async getCategories(): Promise<Category[]> {
        const response = await api.get('/listings/categories');
        return response.data;
    },

    async uploadImage(file: File): Promise<{ filename: string; url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/listings/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
