import axios from 'axios';
import { useAuthStore } from '../store/useAuth';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000/api/v1' : 'https://api.suqafuran.com/api/v1');

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
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
