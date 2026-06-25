import api from './api';
import type { User } from '../types';

interface OtpAck {
    success: boolean;
    cooldown_seconds: number;
}

export const authService = {
    /** Real backend: OAuth2PasswordRequestForm — form-encoded `username`/`password`, not JSON. */
    async loginWithPassword(email: string, password: string): Promise<{ access_token: string }> {
        const form = new URLSearchParams();
        form.set('username', email);
        form.set('password', password);
        const { data } = await api.post('/login/access-token', form, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return data;
    },

    async getMe(token: string): Promise<User> {
        const { data } = await api.get<User>('/users/me', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return data;
    },

    // --- Email OTP (signup and passwordless sign-in) ---
    async requestEmailOtp(email: string): Promise<OtpAck> {
        const { data } = await api.post('/auth/request-otp', { email });
        return data;
    },

    async signupEmail(payload: { full_name: string; email: string; password: string; phone?: string; promo_code?: string }): Promise<OtpAck> {
        const { data } = await api.post('/auth/signup', payload);
        return data;
    },

    async verifyEmailOtp(email: string, otp: string): Promise<{ access_token: string; token_type: string }> {
        const { data } = await api.post('/auth/verify-otp', { email, otp });
        return data;
    },

    // --- Phone OTP (SMS via Africa's Talking) ---
    async requestPhoneOtp(phone: string): Promise<OtpAck> {
        const { data } = await api.post('/auth/request-phone-otp', { phone });
        return data;
    },

    async signupPhone(payload: { full_name: string; phone: string; promo_code?: string }): Promise<OtpAck> {
        const { data } = await api.post('/auth/signup-phone', payload);
        return data;
    },

    async verifyPhoneOtp(phone: string, otp: string): Promise<{ access_token: string; token_type: string }> {
        const { data } = await api.post('/auth/verify-phone-otp', { phone, otp });
        return data;
    },
};
