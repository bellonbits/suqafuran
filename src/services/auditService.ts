import api from './api';

export interface AuditLogEntry {
    id: number;
    user_id: number;
    action: string;
    resource_type: string;
    resource_id: number;
    details?: string;
    timestamp: string;
    user_email?: string;
    user_name?: string;
}

export const auditService = {
    getLogs: async (params?: { limit?: number; action?: string; resource_type?: string }): Promise<AuditLogEntry[]> => {
        const response = await api.get<AuditLogEntry[]>('/audit/logs', { params });
        return response.data;
    },
};

export default auditService;
