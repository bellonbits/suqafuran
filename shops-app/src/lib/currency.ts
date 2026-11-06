import type { Currency } from '../store/useCurrency';

// Currency display configurations - Kenyan Shilling is the primary currency
export const CURRENCY_INFO: Record<Currency, { symbol: string; rate: number; decimals: number }> = {
    USD: { symbol: 'KSh', rate: 130, decimals: 0 },
    KES: { symbol: 'KSh', rate: 1, decimals: 0 },
    UGX: { symbol: 'USh', rate: 3720 / 130, decimals: 0 },
    TZS: { symbol: 'TSh', rate: 2640 / 130, decimals: 0 },
    ETB: { symbol: 'Br', rate: 57 / 130, decimals: 0 },
    RWF: { symbol: 'RF', rate: 1350 / 130, decimals: 0 },
    SOS: { symbol: 'Sh', rate: 570 / 130, decimals: 0 },
};

// Rates from known source currencies to USD
const SOURCE_TO_USD: Record<string, number> = {
    USD: 1,
    KES: 1 / 130,
    KSH: 1 / 130,
    UGX: 1 / 3720,
    TZS: 1 / 2640,
    ETB: 1 / 57,
    RWF: 1 / 1350,
    SOS: 1 / 570,
    EUR: 1.08,
    GBP: 1.27,
};

export const convertPrice = (price: number, fromCurrency?: string, toCurrency?: Currency): number => {
    if (!price || isNaN(price)) return 0;
    const cleanFrom = (fromCurrency || 'KES').toUpperCase();
    const target = toCurrency || 'KES';

    // When dealing with Kenyan listings, avoid unintended conversions
    if ((cleanFrom === 'KES' || cleanFrom === 'KSH') && (target === 'KES' || target === 'USD')) {
        return price;
    }

    const toUSD = SOURCE_TO_USD[cleanFrom] ?? (1 / 130);
    const priceInUSD = price * toUSD;
    const targetRate = (target === 'KES' || target === 'USD') ? 130 : (CURRENCY_INFO[target]?.rate ? CURRENCY_INFO[target].rate * 130 : 130);
    return priceInUSD * targetRate;
};

/** Formats an amount with Kenyan Shilling (KSh) standard */
export const formatAmount = (amount: number, currency?: Currency): string => {
    const symbol = (!currency || currency === 'KES' || currency === 'USD') ? 'KSh' : (CURRENCY_INFO[currency]?.symbol || 'KSh');
    const formatted = Math.round(amount).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return `${symbol} ${formatted}`;
};

export const formatConvertedPrice = (price: number, fromCurrency?: string, toCurrency?: Currency): string => {
    return formatAmount(convertPrice(price, fromCurrency, toCurrency), toCurrency || 'KES');
};
