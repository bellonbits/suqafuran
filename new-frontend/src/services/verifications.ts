import api from './api';
import type { VerificationRequest } from '../types';

export const verificationsService = {
    async listRequests(params?: { skip?: number; limit?: number }): Promise<VerificationRequest[]> {
        const { data } = await api.get<VerificationRequest[]>('/verifications/', { params });
        return data;
    },

    async updateStatus(id: number, status: 'approved' | 'rejected'): Promise<VerificationRequest> {
        const { data } = await api.patch<VerificationRequest>(`/verifications/${id}`, { status });
        return data;
    },
};
