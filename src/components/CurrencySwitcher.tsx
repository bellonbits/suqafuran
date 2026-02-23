import React from 'react';
import { useCurrencyStore } from '../store/useCurrencyStore';
import type { Currency } from '../store/useCurrencyStore';
import { cn } from '../utils/cn';

import { Globe, ChevronDown } from 'lucide-react';

const CurrencySwitcher: React.FC = () => {
    const { currency, setCurrency } = useCurrencyStore();

    const currencies: { id: Currency; label: string; symbol: string }[] = [
        { id: 'KES', label: 'KSH', symbol: 'KSh' },
        { id: 'USD', label: 'USD', symbol: '$' },
    ];

    const currentCurrency = currencies.find(c => c.id === currency) || currencies[0];

    return (
        <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-primary-500 transition-all shadow-sm active:scale-95 group">
                <Globe className="h-4 w-4 text-gray-500 group-hover:text-primary-500 transition-colors" />
                <span className="text-[11px] font-bold text-gray-700">{currentCurrency.label}</span>
                <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-primary-500 transition-colors" />
            </button>

            <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] transform origin-top-right">
                {currencies.map((curr) => (
                    <button
                        key={curr.id}
                        onClick={() => setCurrency(curr.id)}
                        className={cn(
                            "w-full px-4 py-2 text-left text-[11px] font-semibold transition-colors flex items-center justify-between",
                            currency === curr.id
                                ? "bg-primary-50 text-primary-600"
                                : "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <span>{curr.label}</span>
                        <span className="text-gray-400 font-medium">{curr.symbol}</span>
                    </button>
                ))}
                <div className="px-4 py-2 border-t border-gray-50 mt-1">
                    <span className="text-[10px] text-gray-400 italic">More coming...</span>
                </div>
            </div>
        </div>
    );
};

export { CurrencySwitcher };
