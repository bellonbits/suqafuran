import api from './api';

export interface Delivery {
    id: number;
    listing_id: number;
    seller_id: number;
    buyer_id: number;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    tracking_number?: string;
    created_at: string;
}

export const deliveryService = {
    getMyDeliveries: async (): Promise<Delivery[]> => {
        const response = await api.get('/delivery/my/delivery');
        return response.data;
    },
    
    createDelivery: async (listingId: number): Promise<Delivery> => {
        const response = await api.post(`/delivery/listings/${listingId}/delivery`);
        return response.data;
    }
};
