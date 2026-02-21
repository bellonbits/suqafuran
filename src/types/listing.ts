import type { User } from './auth';

export interface Listing {
    id: number;
    title: string;
    description: string;
    price: number;
    currency: string;
    location: string;
    condition: string;
    category_id: number;
    owner_id: number;
    status: string;
    images: string[];
    boost_level?: number;
    boost_expires_at?: string;
    created_at: string;
    updated_at: string;
    owner?: User & {
        response_time?: string;
        is_verified?: boolean;
    };
    attributes?: Record<string, any>;
    views?: number;
    leads?: number;
}

export interface ListingCreate {
    title: string;
    description: string;
    price: number;
    currency: string;
    location: string;
    condition: string;
    category_id: number;
    images: string[];
    status?: string;
    attributes?: Record<string, any>;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    icon_name: string;
    icon?: string;
    attributes_schema?: any;
}
