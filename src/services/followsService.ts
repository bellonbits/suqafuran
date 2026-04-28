import api from './api';
import type { User } from '../store/useAuthStore';

export interface FollowStats {
    followers_count: number;
    following_count: number;
    is_following: boolean;
}

export const followsService = {
    getMyFollowers: async (): Promise<User[]> => {
        const response = await api.get('/follows/my/followers');
        return response.data;
    },

    getMyFollowing: async (): Promise<User[]> => {
        const response = await api.get('/follows/my/following');
        return response.data;
    },

    followUser: async (userId: number): Promise<{ message: string }> => {
        const response = await api.post(`/follows/follow/${userId}`);
        return response.data;
    },

    unfollowUser: async (userId: number): Promise<{ message: string }> => {
        const response = await api.delete(`/follows/unfollow/${userId}`);
        return response.data;
    },

    getFollowStats: async (userId: number): Promise<FollowStats> => {
        const response = await api.get(`/follows/stats/${userId}`);
        return response.data;
    },
};
