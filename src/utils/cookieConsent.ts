const KEY = 'suqafuran-cookie-consent';

export type ConsentValue = 'accepted' | 'rejected' | null;

export const getConsent = (): ConsentValue =>
    (localStorage.getItem(KEY) as ConsentValue) ?? null;

export const hasConsent = (): boolean =>
    localStorage.getItem(KEY) === 'accepted';

export const setConsent = (value: 'accepted' | 'rejected') =>
    localStorage.setItem(KEY, value);
