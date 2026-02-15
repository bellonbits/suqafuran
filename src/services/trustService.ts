import api from './api';

export const MeetingResponse = {
    YES: 'yes' as const,
    NO: 'no' as const,
    NOT_YET: 'not_yet' as const,
};
export type MeetingResponse = typeof MeetingResponse[keyof typeof MeetingResponse];

export const DealOutcome = {
    BOUGHT: 'bought' as const,
    NOT_BOUGHT: 'not_bought' as const,
    CANCELLED: 'cancelled' as const,
};
export type DealOutcome = typeof DealOutcome[keyof typeof DealOutcome];

export const trustService = {
    respondToMeeting: async (meetingId: number, response: MeetingResponse) => {
        const res = await api.post(`/meetings/${meetingId}/respond`, { response });
        return res.data;
    },

    respondToDeal: async (dealId: number, outcome: DealOutcome) => {
        const res = await api.post(`/deals/${dealId}/respond`, { outcome });
        return res.data;
    },

    getPendingActions: async () => {
        const res = await api.get('/trust_ops/pending');
        return res.data;
    }
};
