import api from './api';

export interface Notification {
    id: number;
    user_id: number;
    type: string;
    data: any;
    is_read: boolean;
    created_at: string;
}

export const notificationService = {
    async getMyNotifications(): Promise<Notification[]> {
        const response = await api.get('/notifications/');
        return response.data;
    },

    async markAsRead(notificationId: number): Promise<Notification> {
        const response = await api.post(`/notifications/${notificationId}/read`);
        return response.data;
    },

    async markAllAsRead(): Promise<{ message: string }> {
        const response = await api.post('/notifications/read-all');
        return response.data;
    },

    async deleteNotification(notificationId: number): Promise<{ message: string }> {
        const response = await api.delete(`/notifications/${notificationId}`);
        return response.data;
    },
};
