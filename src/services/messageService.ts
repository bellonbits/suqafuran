import api from './api';

export interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    listing_id?: number;
    content: string;
    is_read: boolean;
    created_at: string;
}

export const messageService = {
    async sendMessage(data: { receiver_id: number; content: string; listing_id?: number }): Promise<Message> {
        const response = await api.post('/messages/', data);
        return response.data;
    },

    async getConversations(): Promise<any[]> {
        const response = await api.get('/messages/conversations');
        return response.data;
    },

    async getConversation(otherUserId: number, listingId?: number): Promise<Message[]> {
        const response = await api.get(`/messages/${otherUserId}`, {
            params: { listing_id: listingId }
        });
        return response.data;
    },
};
