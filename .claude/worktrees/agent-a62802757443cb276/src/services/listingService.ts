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

    async createListing(data: ListingCreate, ownerId?: number): Promise<Listing> {
        const response = await api.post('/listings/', data, {
            params: { owner_id: ownerId }
        });
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

    async uploadImage(file: File): Promise<{ filename: string; url: string; phash?: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/listings/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // 2 minutes for large single image upload
        });
        return response.data;
    },

    async uploadVideo(file: File): Promise<{ filename: string; url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/listings/upload-video', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000, // 5 minutes for large video
        });
        return response.data;
    },

    async uploadMultipleImages(files: File[]): Promise<{ filename: string; url: string; phash?: string }[]> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const response = await api.post('/listings/upload-multiple', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 240000, // 4 minutes for multiple images upload
        });
        return response.data;
    },

    async patchListing(id: number, data: any): Promise<Listing> {
        const response = await api.patch(`/listings/${id}`, data);
        return response.data;
    },

    async applyListingBoost(id: number, boostType: string) {
        const response = await api.post(`/listings/${id}/boost`, { boost_type: boostType });
        return response.data;
    },

    async getCategoryAttributes(slug: string) {
        const response = await api.get(`/listings/categories/${slug}/attributes`);
        return response.data;
    },

    // Category CRUD
    async createCategory(data: any) {
        const response = await api.post('/listings/categories', data);
        return response.data;
    },

    async updateCategory(id: number, data: any) {
        const response = await api.patch(`/listings/categories/${id}`, data);
        return response.data;
    },

    async deleteCategory(id: number) {
        await api.delete(`/listings/categories/${id}`);
    },

    // Subcategory CRUD
    async createSubcategory(data: any) {
        const response = await api.post('/listings/subcategories', data);
        return response.data;
    },

    async updateSubcategory(id: number, data: any) {
        const response = await api.patch(`/listings/subcategories/${id}`, data);
        return response.data;
    },

    async deleteSubcategory(id: number) {
        await api.delete(`/listings/subcategories/${id}`);
    },

    // Subsubcategory CRUD
    async createSubsubcategory(data: any) {
        const response = await api.post('/listings/subsubcategories', data);
        return response.data;
    },

    async updateSubsubcategory(id: number, data: any) {
        const response = await api.patch(`/listings/subsubcategories/${id}`, data);
        return response.data;
    },

    async deleteSubsubcategory(id: number) {
        await api.delete(`/listings/subsubcategories/${id}`);
    },

    async getTrendingListings(): Promise<Listing[]> {
        const response = await api.get('/listings/', { params: { sort: 'trending', limit: 6 } });
        return response.data;
    },
};
