import api from './api';

export interface WalletBalance {
    balance: number;
    currency: string;
    updated_at: string;
    total_spent: number;
    active_boosts: number;
}

export interface Transaction {
    id: number;
    wallet_id: number;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
    description: string;
    status: 'pending' | 'completed' | 'failed';
    reference: string;
    created_at: string;
}

export interface Voucher {
    id: number;
    code: string;
    amount: number;
    is_redeemed: boolean;
    created_at: string;
    redeemed_at?: string;
    redeemed_by_id?: number;
}

export const walletService = {
    getBalance: async () => {
        const response = await api.get<WalletBalance>('/wallet/balance');
        return response.data;
    },

    getTransactions: async (skip = 0, limit = 100) => {
        const response = await api.get<Transaction[]>('/wallet/transactions', {
            params: { skip, limit }
        });
        return response.data;
    },

    deposit: async (amount: number, description = 'Deposit') => {
        const response = await api.post<{ message: string; new_balance: number }>('/wallet/deposit', {
            amount,
            description
        });
        return response.data;
    },

    getBoostPrices: async () => {
        const response = await api.get<Record<number, { name: string; price: number; days: number }>>('/boosts/prices');
        return response.data;
    },

    applyBoost: async (listingId: number, boostLevel: number) => {
        const response = await api.post<{ message: string; boost_expires_at: string; new_balance: number }>('/boosts/apply', {
            listing_id: listingId,
            boost_level: boostLevel
        });
        return response.data;
    },

    redeemVoucher: async (code: string) => {
        const response = await api.post<{ message: string; amount: number; new_balance: number }>('/wallet/recharge', {
            code
        });
        return response.data;
    },

    getVouchers: async () => {
        const response = await api.get<Voucher[]>('/wallet/vouchers');
        return response.data;
    },

    createVoucher: async (amount: number, code: string) => {
        const response = await api.post<Voucher>('/wallet/vouchers', {
            amount,
            code
        });
        return response.data;
    }
};
