import api from './api';
import type { LoginCredentials, User, AuthResponse } from '../types/auth';

export const authService = {
    async signup(data: any): Promise<{ message: string; cooldown_seconds: number }> {
        const response = await api.post('/auth/signup', data);
        return response.data;
    },

    async requestOTP(phone: string): Promise<{ message: string }> {
        const response = await api.post('/auth/request-otp', { phone });
        return response.data;
    },

    async verifyOTP(phone: string, code: string, fullName?: string): Promise<AuthResponse> {
        const response = await api.post('/auth/verify-otp', { phone, otp: code, full_name: fullName });
        return response.data;
    },

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const formData = new FormData();
        // Backend expects 'username' and 'password' for OAuth2 flow
        // We map 'phone' (from UI) to 'username'
        formData.append('username', credentials.phone || credentials.email || '');
        formData.append('password', credentials.password || '');

        const response = await api.post('/login/access-token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    },

    async getMe(): Promise<User> {
        const response = await api.get('/users/me');
        return response.data;
    },

    async verifyEmail(email: string, code: string): Promise<{ message: string }> {
        const response = await api.post('/users/verify-email', { email, code });
        return response.data;
    },

    async resendVerification(email: string): Promise<{ message: string }> {
        const response = await api.post('/users/resend-verification', { email });
        return response.data;
    },

    async forgotPassword(email: string): Promise<{ message: string }> {
        const response = await api.post('/users/forgot-password', { email });
        return response.data;
    },

    async resetPassword(data: any): Promise<{ message: string }> {
        const response = await api.post('/users/reset-password', data);
        return response.data;
    },

    async updateUser(data: any): Promise<User> {
        const response = await api.patch('/users/me', data);
        return response.data;
    },

    async uploadAvatar(file: File): Promise<User> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/users/me/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async changePassword(data: any): Promise<{ message: string }> {
        const response = await api.post('/users/me/change-password', data);
        return response.data;
    },

    async getUserPublicInfo(userId: number): Promise<{
        full_name: string;
        id: number;
        is_verified: boolean;
        avatar_url?: string;
        phone?: string;
        response_time?: string;
    }> {
        const response = await api.get(`/users/public/${userId}`);
        return response.data;
    },

    async trackProfileView(userId: number): Promise<void> {
        await api.post(`/users/public/${userId}/view`);
    }
};
