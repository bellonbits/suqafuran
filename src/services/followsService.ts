import api from './api';
import type { User } from '../store/useAuthStore';

export const followsService = {
    getMyFollowers: async (): Promise<User[]> => {
        const response = await api.get('/follows/my/followers');
        return response.data;
    },
    
    followUser: async (userId: number): Promise<{ message: string }> => {
        const response = await api.post(`/follows/follow/${userId}`);
        return response.data;
    }
};
