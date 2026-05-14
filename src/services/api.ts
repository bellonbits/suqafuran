import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api/v1' : 'https://api.suqafuran.com/api/v1');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
    withCredentials: true,
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

// Track whether we're already handling a session-expiry to avoid loops
let isValidatingSession = false;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;

        // Only attempt recovery on 401 (Unauthorized) when we have a stored token.
        // 403 (Forbidden) means the token is valid but the user lacks permission —
        // do NOT log them out for that.
        if (status === 401 && !isValidatingSession) {
            const { token } = useAuthStore.getState();

            if (!token) return Promise.reject(error);

            isValidatingSession = true;
            try {
                // Background check to see if the session is truly dead
                await axios.get(`${API_BASE_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // If it succeeds, the original 401 was a fluke or endpoint-specific
            } catch (verifyError: any) {
                if (verifyError.response?.status === 401) {
                    // Only log out if it's a genuine, confirmed 401 on /users/me
                    // and we are NOT on a native platform where we want to be stickier
                    const isNative = typeof (window as any).Capacitor !== 'undefined';
                    if (!isNative) {
                        // logout(); // Disabled per user request: "no refreshing of the app and logs you out"
                    }
                }
            } finally {
                isValidatingSession = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
