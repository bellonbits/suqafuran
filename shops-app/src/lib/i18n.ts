import { useLanguageStore } from '../store/useLanguage';

/**
 * Most page content already carries real `_en`/`_so` fields per record
 * (listing titles, category names, etc.) — see useLocalizedField below for
 * that. This dictionary only covers static chrome strings (nav labels,
 * buttons) that have no backing record to localize from.
 */
const STRINGS: Record<string, { en: string; so: string }> = {
    'Home': { en: 'Home', so: 'Guriga' },
    'Explore': { en: 'Explore', so: 'Sahmin' },
    'Sell': { en: 'Sell', so: 'Iibso' },
    'Orders': { en: 'Orders', so: 'Dalabyada' },
    'Profile': { en: 'Profile', so: 'Xisaabta' },
    'Grocery': { en: 'Grocery', so: 'Khudaar' },
    'Deals': { en: 'Deals', so: 'Dukaamaha' },
    'Search Suqafuran': { en: 'Search Suqafuran', so: 'Raadi Suqafuran' },
    'Select Location': { en: 'Select Location', so: 'Dooro Goobta' },
    'Sign In': { en: 'Sign In', so: 'Soo Gal' },
    'Sign Up': { en: 'Sign Up', so: 'Is Diiwaangeli' },
    'Sign Out': { en: 'Sign Out', so: 'Ka Bax' },
    'Delivery': { en: 'Delivery', so: 'Gaarsiin' },
    'Pickup': { en: 'Pickup', so: 'Qaadasho' },
    'Favorites': { en: 'Favorites', so: 'La Jeclaaday' },
    'Following': { en: 'Following', so: 'La Raacaayo' },
    'Cart': { en: 'Cart', so: 'Dambiisha' },
    'Chat': { en: 'Chat', so: 'Farriimaha' },
    'Use Current Location': { en: 'Use Current Location', so: 'Isticmaal Goobta Hadda' },
    'Detecting Location...': { en: 'Detecting Location...', so: 'Waa la helayaa Goobta...' },
    'Search any city, town, or address': { en: 'Search any city, town, or address', so: 'Raadi magaalo, tuulo, ama cinwaan' },
    'Buy, Sell & Trade Securely in Africa': { en: 'Buy, Sell & Trade Securely in Africa', so: 'Ku Iibi, Ku Iibso & Ku Ganacso Ammaan Africa' },
    'Find local verified sellers, discover negotiable deals, and trade with secure escrow protection.': { en: 'Find local verified sellers, discover negotiable deals, and trade with secure escrow protection.', so: 'Hel iibiyeyaal la xaqiijiyay, heshiisyo laga xoogsado, kuna ganacso dammaanad buuxda.' },
    'Enter your city or neighborhood...': { en: 'Enter your city or neighborhood...', so: 'Geli magaaladaada ama deegaankaaga...' },
    'Sign in for saved addresses': { en: 'Sign in for saved addresses', so: 'U gal cinwaanada la keydiyay' },
    'Start Selling & Earn': { en: 'Start Selling & Earn', so: 'Bilow Iibinta & Faa\'iido' },
    'Have items to sell? Post ads for free in minutes and reach thousands nearby.': { en: 'Have items to sell? Post ads for free in minutes and reach thousands nearby.', so: 'Ma haysaa badeecad aad iibiso? Ku dar xayeysiis bilaash ah dhowr daqiiqo gudahood.' },
    'Grow Your Business': { en: 'Grow Your Business', so: 'Kordhi Ganacsigaaga' },
    'Create a digital storefront, manage products, track orders, and build trust.': { en: 'Create a digital storefront, manage products, track orders, and build trust.', so: 'Abuur dukaan dijital ah, maaree alaabta, la soco dalabaadka, kuna dhis kalsooni.' },
    'Get the Mobile App': { en: 'Get the Mobile App', so: 'Hel App-ka Mobilka' },
    'Enjoy live chat alerts, precise location matching, and offline sync.': { en: 'Enjoy live chat alerts, precise location matching, and offline sync.', so: 'Ku raaxayso ogeysiisyada tooska ah, helitaanka goobta, iyo wada-shaqaynta offline-ka.' },
    'Become a Seller': { en: 'Become a Seller', so: 'Noqo Iibiye' },
    'Grow Store': { en: 'Grow Store', so: 'Kordhi Dukaanka' },
    'Download App': { en: 'Download App', so: 'Dajiso App-ka' },
    'Get more from your neighborhood': { en: 'Get more from your neighborhood', so: 'Ka hel wax badan agagaarkaaga' },
    'Top Cities': { en: 'Top Cities', so: 'Magaalooyinka Ugu Waaweyn' },
    'Top Categories': { en: 'Top Categories', so: 'Qaybaha Ugu Caansan' },
    'Top Storefronts': { en: 'Top Storefronts', so: 'Dukaamaha Ugu Wanaagsan' },
};

export function translate(key: string, language: 'en' | 'so'): string {
    return STRINGS[key]?.[language] ?? key;
}

/** Hook form — re-renders automatically when the language preference changes. */
export function useT() {
    const language = useLanguageStore((s) => s.language);
    return (key: string) => translate(key, language);
}

/**
 * Most domain records carry parallel `_en`/`_so` fields (listings,
 * categories, businesses...). This picks the right one for the current
 * language, falling back to English when no Somali translation was filled
 * in by the seller.
 */
export function useLocalizedField() {
    const language = useLanguageStore((s) => s.language);
    return (en: string, so?: string | null) => (language === 'so' && so ? so : en);
}
