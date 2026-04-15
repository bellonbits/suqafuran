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
            const { token, logout } = useAuthStore.getState();

            if (!token) {
                // No token stored — nothing to do, just reject.
                return Promise.reject(error);
            }

            // Silently verify the token is genuinely expired by calling /users/me.
            // If that also 401s, the session is truly dead and we log out.
            // This prevents a single mis-configured endpoint from booting the user.
            isValidatingSession = true;
            try {
                await api.get('/users/me');
                // /users/me succeeded — the original 401 was endpoint-specific,
                // not a token expiry. Keep the session alive.
            } catch (verifyError: any) {
                if (verifyError.response?.status === 401) {
                    // Token is genuinely invalid — log out cleanly.
                    logout();
                }
                // Any other error (network, 5xx) → leave session intact,
                // the user is still logged in.
            } finally {
                isValidatingSession = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
