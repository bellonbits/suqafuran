import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api/v1' : 'https://api.suqafuran.com/api/v1');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
    // withCredentials intentionally omitted — auth uses JWT Bearer tokens,
    // not cookies. Setting this to true breaks CORS on Android WebView when
    // the server uses Access-Control-Allow-Origin: *.
});

// Attach token to every request
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Layer 1.1: Advanced Device Fingerprinting (Sync Signals)
        const fingerprintData = {
            ua: navigator.userAgent,
            scr: `${screen.width}x${screen.height}`,
            lang: navigator.language,
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
            plat: navigator.platform,
            hc: navigator.hardwareConcurrency || 'unknown'
        };
        config.headers['X-Device-Fingerprint'] = btoa(JSON.stringify(fingerprintData));
        
        return config;
    },
    (error) => Promise.reject(error)
);


api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;

        // Only attempt recovery on 401 (Unauthorized) when we have a stored token.
        // 403 (Forbidden) means the token is valid but the user lacks permission —
        // do NOT log them out for that.
        if (status === 401) {
            const isNative = typeof (window as any).Capacitor !== 'undefined';
            if (!isNative) {
                useAuthStore.getState().logout();
                // Force a redirect to login if we're on a protected route
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
