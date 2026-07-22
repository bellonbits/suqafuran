import axios from 'axios';
import { useAuthStore } from '../store/useAuth';
import { useAuthModal } from '../store/useAuthModal';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && (import.meta as any)?.env?.VITE_API_URL) ||
  (typeof window !== 'undefined' && (import.meta as any)?.env?.VITE_REACT_APP_API_URL) ||
  '/api/v1';

const API_ORIGIN = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, '') || 'http://backend:8000');

// Some media (e.g. user avatars) is stored on the backend as a path relative
// to the API host rather than a full URL. Resolve it against the API origin
// so it doesn't 404 against whatever origin the frontend happens to be on.
export function resolveMediaUrl(url?: string | null): string | null {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Optimize Cloudinary URLs for high-quality display
export function optimizeCloudinaryUrl(url?: string | null, options: { width?: number; quality?: 'auto' | number; fetch_format?: 'auto' | 'webp' | 'jpg' } = {}): string | null {
    if (!url || typeof url !== 'string') return null;

    // Only optimize Cloudinary URLs
    if (!url.includes('cloudinary.com')) return url;

    const { width = 1920, quality = 'auto', fetch_format = 'auto' } = options;

    // Insert optimization params into Cloudinary URL
    // Format: /image/upload/w_1920,q_auto,f_auto/...
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    const params = [`w_${width}`, `q_${quality}`, `f_${fetch_format}`];
    return `${parts[0]}/upload/${params.join(',')},dpr_auto/${parts[1]}`;
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 45000, // Increased to 45s to handle large listings queries
});

api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Let browser handle content-type for FormData (multipart/form-data with boundary)
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
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

        // Override timeout for slow endpoints
        if (config.url?.includes('/listings/')) {
            config.timeout = 60000; // 60s for listings queries (database is slow)
        } else if (config.url?.includes('/admin/shops')) {
            config.timeout = config.method === 'put' ? 60000 : 30000; // 60s for PUT (file upload), 30s for GET (first query is slow)
        } else if (config.url?.includes('/shops')) {
            config.timeout = 60000; // 60s for shops detail/listing queries
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
