import api from './api';
import type { LoginCredentials, SignupCredentials, User, AuthResponse } from '../types/auth';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const formData = new FormData();
        formData.append('username', credentials.email);
        formData.append('password', credentials.password);

        const response = await api.post('/login/access-token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    },

    async signup(credentials: SignupCredentials): Promise<User> {
        const response = await api.post('/users/signup', credentials);
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

    async getUserPublicInfo(userId: number): Promise<{ full_name: string; id: number; is_verified: boolean }> {
        const response = await api.get(`/users/public/${userId}`);
        return response.data;
    }
};
