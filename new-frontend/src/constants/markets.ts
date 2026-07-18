/**
 * Kenyan Markets Database
 * Used for shop location filtering and display
 */

export const KENYAN_MARKETS = [
  // Nairobi Markets
  "Eastleigh Market",
  "Gikomba Market",
  "Kamukunji Market",
  "Muthurwa Market",
  "Toi Market",
  "Ngara Market",
  "City Market",
  "Kariobangi Market",
  "Kangemi Market",
  "Wakulima Market",
  "Kawangware Market",

  // Mombasa Markets
  "Kongowea Market (Mombasa)",
  "Marikiti Market (Mombasa)",

  // Kisumu Markets
  "Kibuye Market (Kisumu)",

  // Other Major Cities
  "Nakuru Market",
  "Eldoret Market",
  "Kitale Market",
  "Machakos Market",
  "Meru Market",
  "Garissa Market",

  // International Markets
  "Somali Market",
] as const;

export type Market = typeof KENYAN_MARKETS[number];

export const DEFAULT_MARKET: Market = "Eastleigh Market";

export const MARKETS_SORTED = [...KENYAN_MARKETS].sort();

export const MARKET_TO_CITY: Record<Market, string> = {
  // Nairobi
  "Eastleigh Market": "Nairobi",
  "Gikomba Market": "Nairobi",
  "Kamukunji Market": "Nairobi",
  "Muthurwa Market": "Nairobi",
  "Toi Market": "Nairobi",
  "Ngara Market": "Nairobi",
  "City Market": "Nairobi",
  "Kariobangi Market": "Nairobi",
  "Kangemi Market": "Nairobi",
  "Wakulima Market": "Nairobi",
  "Kawangware Market": "Nairobi",
  // Mombasa
  "Kongowea Market (Mombasa)": "Mombasa",
  "Marikiti Market (Mombasa)": "Mombasa",
  // Kisumu
  "Kibuye Market (Kisumu)": "Kisumu",
  // Other Kenya
  "Nakuru Market": "Nakuru",
  "Eldoret Market": "Eldoret",
  "Kitale Market": "Kitale",
  "Machakos Market": "Machakos",
  "Meru Market": "Meru",
  "Garissa Market": "Garissa",
  // International
  "Somali Market": "Somalia",
};

export function getMarketsByCity(city: string): Market[] {
  return KENYAN_MARKETS.filter((market) => MARKET_TO_CITY[market] === city);
}

export function getCities(): string[] {
  return [...new Set(Object.values(MARKET_TO_CITY))].sort();
}
