import type { Currency } from '../store/useCurrencyStore';

// Conversion rates to USD
const RATES_TO_USD: Record<string, number> = {
    USD: 1,
    KES: 1 / 130,
    EUR: 1.08,
    SOS: 1 / 570,
};

export const convertPrice = (price: number, fromCurrency: string, _toCurrency: Currency): number => {
    const rate = RATES_TO_USD[fromCurrency] ?? 1;
    return price * rate;
};

export const formatConvertedPrice = (price: number, fromCurrency: string, targetCurrency: Currency): string => {
    const converted = convertPrice(price, fromCurrency, targetCurrency);
    return `$ ${converted.toFixed(2)}`;
};
