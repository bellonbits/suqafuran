import api from './api';

export interface Feedback {
    id: number;
    author_id: number;
    target_user_id: number;
    listing_id?: number;
    rating: number;
    comment?: string;
    created_at: string;
}

export const feedbackService = {
    getUserFeedback: async (userId: number): Promise<Feedback[]> => {
        const response = await api.get(`/feedback/user/${userId}/feedback`);
        return response.data;
    },
    
    submitFeedback: async (data: Partial<Feedback>): Promise<Feedback> => {
        const response = await api.post('/feedback/feedback', data);
        return response.data;
    }
};
