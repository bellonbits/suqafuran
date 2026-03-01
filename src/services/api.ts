import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

import { Capacitor } from '@capacitor/core';

const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    const isDev = import.meta.env.DEV;
    const PROD_API_URL = 'http://143.198.30.249:8888/api/v1';
    const LOCAL_API_URL = 'http://172.20.10.3:8000/api/v1';

    if (Capacitor.isNativePlatform()) {
        // Use the computer's local Wi-Fi IP for all native development
        // This works for both emulators and physical phones on the same network
        return isDev ? LOCAL_API_URL : PROD_API_URL;
    }

    return isDev ? LOCAL_API_URL : PROD_API_URL;
};

export const API_BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default api;
