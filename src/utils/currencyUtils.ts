import type { Currency } from '../store/useCurrencyStore';

/**
 * Conversion rates (base: KES)
 * 1 USD = 130 KES
 * 1 KES = 4.42 SOS
 */

const RATES_TO_KES: Record<string, number> = {
    USD: 130,
    KES: 1,
    SOS: 1 / 4.42,
    EUR: 140,
    SLS: 1 / 4.42,
};

export const convertPrice = (price: number, fromCurrency: string, toCurrency: Currency): number => {
    // 1. Normalize to KES
    const rateToKES = RATES_TO_KES[fromCurrency] ?? 1;
    const priceInKES = price * rateToKES;

    // 2. Convert to target
    if (toCurrency === 'KES') return priceInKES;
    if (toCurrency === 'USD') return priceInKES / 130;
    return priceInKES * 4.42; // SOS
};

export const formatConvertedPrice = (price: number, fromCurrency: string, targetCurrency: Currency): string => {
    const converted = convertPrice(price, fromCurrency, targetCurrency);

    if (targetCurrency === 'KES') return `KSh ${Math.round(converted).toLocaleString()}`;
    if (targetCurrency === 'USD') return `$ ${converted.toFixed(2)}`;
    return `SOS ${Math.round(converted).toLocaleString()}`;
};
