import React, { useEffect, useRef, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useCurrencyStore, type Currency } from '../store/useCurrencyStore';
import { CURRENCY_INFO } from '../utils/currencyUtils';
import { cn } from '../utils/cn';

const CURRENCY_LABELS: Record<Currency, string> = {
    USD: 'US Dollar',
    KES: 'Kenyan Shilling',
    UGX: 'Ugandan Shilling',
    TZS: 'Tanzanian Shilling',
    ETB: 'Ethiopian Birr',
    RWF: 'Rwandan Franc',
    SOS: 'Somali Shilling',
};

const OPTIONS: Currency[] = ['USD', 'KES', 'UGX', 'TZS', 'ETB', 'RWF', 'SOS'];

interface CurrencySwitcherProps {
    className?: string;
    /** When true, omit the dropdown chevron and label — chip only. */
    compact?: boolean;
}

const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({ className, compact = false }) => {
    const { currency, setCurrency, setAutoDetected } = useCurrencyStore();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    const choose = (c: Currency) => {
        setCurrency(c);
        // Mark as user-chosen so geolocation/IP detection doesn't overwrite it later.
        setAutoDetected(true);
        setOpen(false);
    };

    return (
        <div ref={wrapRef} className={cn('relative inline-block', className)}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="text-[11px] font-bold text-gray-700">{currency}</span>
                {!compact && <ChevronDown className={cn('h-3 w-3 text-gray-400 transition-transform', open && 'rotate-180')} />}
            </button>

            {open && (
                <div
                    role="listbox"
                    className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                    {OPTIONS.map((c) => {
                        const info = CURRENCY_INFO[c];
                        const selected = c === currency;
                        return (
                            <button
                                key={c}
                                role="option"
                                aria-selected={selected}
                                onClick={() => choose(c)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                                    selected ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                                )}
                            >
                                <span className="w-8 text-xs font-extrabold text-gray-500">{info.symbol}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold leading-tight">{c}</p>
                                    <p className="text-[10px] text-gray-400 leading-tight truncate">{CURRENCY_LABELS[c]}</p>
                                </div>
                                {selected && <Check className="h-4 w-4 text-primary-600 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export { CurrencySwitcher };
