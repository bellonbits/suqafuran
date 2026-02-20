import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'KES' | 'SOS' | 'USD';

interface CurrencyState {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
    persist(
        (set) => ({
            currency: 'KES',
            setCurrency: (currency) => set({ currency }),
        }),
        {
            name: 'suqafuran-currency',
        }
    )
);
