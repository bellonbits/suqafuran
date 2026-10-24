import api from './api';

export interface Offer {
  id: number;
  listing_id: number;
  buyer_id: number;
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
}

export const offersService = {
  async createOffer(listingId: number, amount: number, message?: string): Promise<Offer> {
    const { data } = await api.post('/offers/', {
      listing_id: listingId,
      amount,
      message,
    });
    return data;
  },

  async getMyOffers(): Promise<Offer[]> {
    const { data } = await api.get('/offers/my-offers');
    return data;
  },
};

export default offersService;
