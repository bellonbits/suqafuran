import api from './api';

export interface Conversation {
    other_user_id: number;
    other_user_name: string;
    other_user_avatar: string | null;
    last_message: string;
    last_message_at: string | null;
    unread_count: number;
    listing_id: number | null;
}

export interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    listing_id: number | null;
    content: string;
    is_read: boolean;
    created_at: string;
}

export const messageService = {
    async getConversations(): Promise<Conversation[]> {
        const res = await api.get('/messages/conversations');
        return res.data;
    },

    async getMessages(otherUserId: number, listingId?: number): Promise<Message[]> {
        const params: any = {};
        if (listingId) params.listing_id = listingId;
        const res = await api.get(`/messages/${otherUserId}`, { params });
        return res.data;
    },

    async sendMessage(receiverId: number, content: string, listingId?: number): Promise<Message> {
        const res = await api.post('/messages/', {
            receiver_id: receiverId,
            content,
            listing_id: listingId ?? null,
        });
        return res.data;
    },

    async markAsRead(otherUserId: number): Promise<void> {
        await api.post(`/messages/${otherUserId}/read`);
    },
};
