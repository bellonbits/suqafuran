import api from './api';

export const InteractionType = {
    CALL: 'call' as const,
    WHATSAPP: 'whatsapp' as const,
};

export type InteractionType = typeof InteractionType[keyof typeof InteractionType];

export interface Interaction {
    id: number;
    listing_id: number;
    buyer_id: number;
    type: InteractionType;
    created_at: string;
}

export const interactionService = {
    logInteraction: async (listingId: number, type: InteractionType) => {
        const response = await api.post<Interaction>('/interactions/', {
            listing_id: listingId,
            type: type,
        });
        return response.data;
    },
};
