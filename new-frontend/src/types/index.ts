export interface User {
    id: number;
    full_name: string;
    email: string;
    phone?: string | null;
    is_active: boolean;
    is_verified: boolean;
    is_admin: boolean;
    is_agent: boolean;
    verified_level: 'guest' | 'phone' | 'id' | 'trusted' | 'premium' | 'TRUSTED' | 'NEW';
    trust_score?: number;
    trust_level?: string;
    avatar_url?: string | null;
    created_at?: string;
    profile_views?: number;
}

export interface Listing {
    id: number;
    title_en: string;
    title_so?: string;
    description_en: string;
    description_so?: string;
    price: number;
    currency: string;
    location: string;
    condition: string;
    category_id: number;
    subcategory_id?: number;
    owner_id: number;
    status: string;
    images: string[];
    created_at: string;
    updated_at: string;
    owner?: User;
    is_negotiable?: boolean;
    views?: number;
}

export interface Category {
    id: number;
    name_en: string;
    name_so?: string;
    slug: string;
    icon_name: string;
    image_url?: string;
    subcategories?: SubCategory[];
}

export interface SubCategory {
    id: number;
    name_en: string;
    name_so?: string;
    slug: string;
    category_id: number;
}

export interface Business {
    id: string;
    owner_id: number;
    name: string;
    slug: string;
    logo_url?: string;
    banner_url?: string;
    description?: string;
    category: string;
    location_lat?: number;
    location_lng?: number;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    is_verified: boolean;
    show_in_nearby?: boolean;
    rating: number;
    trust_score: number;
    is_active: boolean;
    brand_color?: string;
    tagline?: string;
}

export interface BusinessProduct {
    id: number;
    business_id: string;
    name_en: string;
    description_en?: string;
    price: number;
    stock_level: number;
    images: string[];
    is_active: boolean;
}

export interface Order {
    id: number;
    business_id: string;
    customer_id: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
    total_amount: number;
    payment_status: string;
    payment_method: string;
    items: any[];
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: number;
    sender_id: number;
    recipient_id?: number;
    business_id?: string;
    content: string;
    is_read: boolean;
    created_at: string;
    product_shared?: Listing;
}
