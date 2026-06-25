import axios from 'axios';
import { useAuthStore } from '../store/useAuth';
import { useAuthModal } from '../store/useAuthModal';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.suqafuran.com/api/v1';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

// Some media (e.g. user avatars) is stored on the backend as a path relative
// to the API host rather than a full URL. Resolve it against the API origin
// so it doesn't 404 against whatever origin the frontend happens to be on.
export function resolveMediaUrl(url?: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (typeof window !== 'undefined') {
            const fingerprintData = {
                ua: navigator.userAgent,
                scr: `${window.screen.width}x${window.screen.height}`,
                lang: navigator.language,
                tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
                plat: navigator.platform,
                hc: navigator.hardwareConcurrency || 'unknown'
            };
            config.headers['X-Device-Fingerprint'] = btoa(JSON.stringify(fingerprintData));
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            const wasAuthenticated = useAuthStore.getState().isAuthenticated;
            useAuthStore.getState().logout();
            // Surface the sign-in modal in place rather than yanking the user to a
            // different page and losing whatever they were doing.
            if (wasAuthenticated) {
                useAuthModal.getState().open('signin');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
