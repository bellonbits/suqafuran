import type { Currency } from '../store/useCurrencyStore';

/**
 * Auto-detection rule (per product decision):
 *   Kenya → KES.
 *   East-African neighbours (Somalia, Uganda, Tanzania, Rwanda, Burundi,
 *   DRC, South Sudan, Ethiopia, Djibouti, Eritrea, Sudan) → USD.
 *   Everywhere else → USD.
 *
 * Users can still manually switch to UGX/TZS/ETB/RWF/SOS via the CurrencySwitcher.
 */
const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
    KE: 'KES',
};

export interface GeoDetectionResult {
    currency: Currency;
    countryCode: string | null;
    city: string | null;
}

export async function detectGeoFromIP(): Promise<GeoDetectionResult> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);

        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) return { currency: 'USD', countryCode: null, city: null };

        const data = await res.json();
        const countryCode: string = (data.country_code ?? '').toUpperCase();
        const city: string | null = data.city ?? null;
        const currency = COUNTRY_TO_CURRENCY[countryCode] ?? 'USD';
        return { currency, countryCode: countryCode || null, city };
    } catch {
        return { currency: 'USD', countryCode: null, city: null };
    }
}

// Back-compat: existing callers that only want the currency.
export async function detectCurrencyFromIP(): Promise<Currency> {
    const { currency } = await detectGeoFromIP();
    return currency;
}
