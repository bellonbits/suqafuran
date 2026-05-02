import type { Currency } from '../store/useCurrencyStore';

// USD-denominated rates: 1 USD = X local units
export const CURRENCY_INFO: Record<Currency, { symbol: string; rate: number; decimals: number }> = {
    USD: { symbol: '$',   rate: 1,    decimals: 2 },
    KES: { symbol: 'KSh', rate: 130,  decimals: 0 },  // $1 = KSh 130
    UGX: { symbol: 'USh', rate: 3720, decimals: 0 },  // $1 = USh 3,720
    TZS: { symbol: 'TSh', rate: 2640, decimals: 0 },  // $1 = TSh 2,640
    ETB: { symbol: 'Br',  rate: 57,   decimals: 0 },  // $1 = Br 57
    RWF: { symbol: 'RF',  rate: 1350, decimals: 0 },  // $1 = RF 1,350
    SOS: { symbol: 'Sh',  rate: 570,  decimals: 0 },  // $1 = Sh 570
};

// Rates from known source currencies to USD (all listings stored in USD or these)
const SOURCE_TO_USD: Record<string, number> = {
    USD: 1,
    KES: 1 / 130,
    UGX: 1 / 3720,
    TZS: 1 / 2640,
    ETB: 1 / 57,
    RWF: 1 / 1350,
    SOS: 1 / 570,
    EUR: 1.08,
    GBP: 1.27,
};

export const convertPrice = (price: number, fromCurrency: string, toCurrency: Currency): number => {
    const toUSD = SOURCE_TO_USD[fromCurrency] ?? 1;
    const priceInUSD = price * toUSD;
    return priceInUSD * CURRENCY_INFO[toCurrency].rate;
};

export const formatConvertedPrice = (price: number, fromCurrency: string, toCurrency: Currency): string => {
    const converted = convertPrice(price, fromCurrency, toCurrency);
    const info = CURRENCY_INFO[toCurrency];
    const formatted = converted.toLocaleString(undefined, {
        minimumFractionDigits: info.decimals,
        maximumFractionDigits: info.decimals,
    });
    return `${info.symbol} ${formatted}`;
};
