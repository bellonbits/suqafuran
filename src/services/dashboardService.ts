import api from './api';

export interface DashboardStats {
    listings: number;
    messages: number;
    favorites: number;
    views: string;
}

export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
};
