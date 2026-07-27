import type { Currency } from '../store/useCurrencyStore';

export interface CountryInfo {
    code: string;
    name: string;
    currency: Currency;
    cities: string[];
}

/**
 * Major-city lists for the East African countries Suqafuran serves.
 * Currency reflects what we *display* (auto-detect rule), not local legal tender.
 * Per product decision: Kenya → KES; everywhere else (incl. EAC + DRC + Horn) → USD.
 * Users can still manually switch to UGX/TZS/etc via the currency switcher.
 */
export const COUNTRIES: Record<string, CountryInfo> = {
    KE: {
        code: 'KE',
        name: 'Kenya',
        currency: 'KES',
        cities: [
            'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika',
            'Malindi', 'Kitale', 'Garissa', 'Nyeri', 'Machakos', 'Meru',
            'Naivasha', 'Kakamega', 'Kericho', 'Embu', 'Kisii', 'Bungoma',
            'Lamu', 'Isiolo',
        ],
    },
    SO: {
        code: 'SO',
        name: 'Somalia',
        currency: 'USD',
        cities: [
            'Mogadishu', 'Hargeysa', 'Boosaaso', 'Kismaayo', 'Baydhabo',
            'Gaalkacyo', 'Garoowe', 'Marka', 'Beledweyne', 'Burco',
            'Boorama', 'Ceerigaabo', 'Dhuusamareeb', 'Laascaanood', 'Jowhar',
            'Afgooye', 'Wanlaweyn', 'Buuloburde', 'Baardheere', 'Luuq',
        ],
    },
    UG: {
        code: 'UG',
        name: 'Uganda',
        currency: 'USD',
        cities: [
            'Kampala', 'Entebbe', 'Jinja', 'Gulu', 'Mbarara', 'Mbale',
            'Lira', 'Masaka', 'Fort Portal', 'Arua', 'Soroti', 'Hoima',
            'Kabale', 'Mukono', 'Kasese',
        ],
    },
    TZ: {
        code: 'TZ',
        name: 'Tanzania',
        currency: 'USD',
        cities: [
            'Dar es Salaam', 'Dodoma', 'Mwanza', 'Arusha', 'Mbeya',
            'Morogoro', 'Tanga', 'Zanzibar City', 'Kigoma', 'Iringa',
            'Tabora', 'Songea', 'Moshi', 'Musoma', 'Bukoba',
        ],
    },
    RW: {
        code: 'RW',
        name: 'Rwanda',
        currency: 'USD',
        cities: [
            'Kigali', 'Butare', 'Gitarama', 'Ruhengeri', 'Gisenyi',
            'Byumba', 'Cyangugu', 'Kibuye', 'Kibungo', 'Nyanza',
        ],
    },
    BI: {
        code: 'BI',
        name: 'Burundi',
        currency: 'USD',
        cities: [
            'Bujumbura', 'Gitega', 'Muyinga', 'Ngozi', 'Ruyigi',
            'Kayanza', 'Rutana', 'Bururi', 'Makamba', 'Cibitoke',
        ],
    },
    CD: {
        code: 'CD',
        name: 'DR Congo',
        currency: 'USD',
        cities: [
            'Kinshasa', 'Lubumbashi', 'Goma', 'Bukavu', 'Kisangani',
            'Mbuji-Mayi', 'Kananga', 'Likasi', 'Kolwezi', 'Matadi',
            'Boma', 'Bunia', 'Uvira', 'Beni',
        ],
    },
    SS: {
        code: 'SS',
        name: 'South Sudan',
        currency: 'USD',
        cities: [
            'Juba', 'Wau', 'Malakal', 'Yei', 'Aweil',
            'Bor', 'Rumbek', 'Torit', 'Bentiu', 'Kuajok',
        ],
    },
    ET: {
        code: 'ET',
        name: 'Ethiopia',
        currency: 'USD',
        cities: [
            'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Adama',
            'Hawassa', 'Bahir Dar', 'Jimma', 'Dessie', 'Jijiga',
            'Harar', 'Shashamane', 'Arba Minch',
        ],
    },
};

export const SUPPORTED_COUNTRY_CODES = Object.keys(COUNTRIES);

export const getCountryInfo = (code: string | null | undefined): CountryInfo | null => {
    if (!code) return null;
    return COUNTRIES[code.toUpperCase()] ?? null;
};

export const getCitiesForCountry = (code: string | null | undefined): string[] => {
    return getCountryInfo(code)?.cities ?? [];
};
