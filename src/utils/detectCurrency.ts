import type { Currency } from '../store/useCurrencyStore';

// ISO country code → display currency
const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
    KE: 'KES',  // Kenya
    UG: 'UGX',  // Uganda
    TZ: 'TZS',  // Tanzania
    ET: 'ETB',  // Ethiopia
    RW: 'RWF',  // Rwanda
    BI: 'USD',  // Burundi (uses USD for large transactions)
    SS: 'USD',  // South Sudan
    SD: 'USD',  // Sudan
    SO: 'USD',  // Somalia — USD is the de facto currency
    DJ: 'USD',  // Djibouti
    ER: 'USD',  // Eritrea
};

export async function detectCurrencyFromIP(): Promise<Currency> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);

        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) return 'USD';

        const data = await res.json();
        const countryCode: string = data.country_code ?? '';
        return COUNTRY_TO_CURRENCY[countryCode] ?? 'USD';
    } catch {
        return 'USD';
    }
}
