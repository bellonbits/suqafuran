export interface User {
    id: number;
    full_name: string;
    email: string;
    phone?: string;
    is_active: boolean;
    is_verified: boolean;
    is_admin: boolean;
    response_time?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}
