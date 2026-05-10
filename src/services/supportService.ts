import api from './api';

export const supportService = {
    async getTickets(params?: { status?: string; skip?: number; limit?: number }) {
        const response = await api.get('/support/tickets', { params });
        return response.data;
    },

    async getTicket(ticketId: number) {
        const response = await api.get(`/support/tickets/${ticketId}`);
        return response.data;
    },

    async updateTicket(ticketId: number, data: { status?: string; admin_notes?: string; priority?: string }) {
        const response = await api.patch(`/support/tickets/${ticketId}`, data);
        return response.data;
    },

    async deleteTicket(ticketId: number) {
        const response = await api.delete(`/support/tickets/${ticketId}`);
        return response.data;
    },

    async getStats() {
        const response = await api.get('/support/stats');
        return response.data;
    }
};
