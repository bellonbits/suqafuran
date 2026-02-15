export interface User {
    id: number;
    full_name: string;
    email?: string | null;
    phone: string;
    is_active: boolean;
    is_verified: boolean;
    is_admin: boolean;
    verified_level: 'guest' | 'phone' | 'id' | 'trusted';
    avatar_url?: string | null;
    response_time?: string;
    email_notifications: boolean;
    sms_notifications: boolean;
}

export interface LoginCredentials {
    email: string;
    password?: string;
}

export interface SignupCredentials {
    full_name: string;
    phone: string;
    email?: string;
    password?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}
