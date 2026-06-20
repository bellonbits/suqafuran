import api from './api';
import type { User } from '../types';

export const authService = {
    async login(credentials: { email: string; password?: string }): Promise<{ access_token: string; token_type: string }> {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    async signup(credentials: { full_name: string; email: string; phone?: string; password?: string }): Promise<User> {
        const response = await api.post('/auth/signup', credentials);
        return response.data;
    },

    async getCurrentUser(): Promise<User> {
        const response = await api.get('/auth/me');
        return response.data;
    }
};
