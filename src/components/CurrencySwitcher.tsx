import React from 'react';
import { useCurrencyStore } from '../store/useCurrencyStore';
import type { Currency } from '../store/useCurrencyStore';
import { cn } from '../utils/cn';
import { Coins } from 'lucide-react';

const CurrencySwitcher: React.FC = () => {
    const { currency, setCurrency } = useCurrencyStore();

    const currencies: { id: Currency; label: string; symbol: string }[] = [
        { id: 'KES', label: 'KSH', symbol: 'KSh' },
        { id: 'SOS', label: 'SOS', symbol: 'Sh' },
        { id: 'USD', label: 'USD', symbol: '$' },
    ];

    return (
        <div className="flex items-center bg-gray-50 p-0.5 rounded-lg border border-gray-200 shadow-sm">
            {currencies.map((curr) => (
                <button
                    key={curr.id}
                    onClick={() => setCurrency(curr.id)}
                    className={cn(
                        "px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest transition-all duration-200 uppercase",
                        currency === curr.id
                            ? "bg-white text-primary-600 shadow-sm border border-gray-100"
                            : "text-gray-400 hover:text-gray-600 hover:bg-white/30"
                    )}
                >
                    {curr.label}
                </button>
            ))}
        </div>
    );
};

export { CurrencySwitcher };
