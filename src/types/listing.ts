import type { User } from './auth';

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
    subsubcategory_id?: number;
    owner_id: number;
    status: string;
    images: string[];
    boost_level?: number;
    boost_expires_at?: string;
    created_at: string;
    updated_at: string;
    lang_available: string; // en, so, both
    owner?: User & {
        response_time?: string;
        is_verified?: boolean;
    };
    attributes?: Record<string, any>;
    is_negotiable?: boolean;
    views?: number;
    leads?: number;
    rejection_reason?: string;
    admin_notes?: Record<string, any>;
}

export interface ListingCreate {
    title_en?: string;
    title_so?: string;
    description_en?: string;
    description_so?: string;
    price: number;
    currency: string;
    location: string;
    condition: string;
    category_id: number;
    subcategory_id?: number;
    subsubcategory_id?: number;
    images: string[];
    status?: string;
    attributes?: Record<string, any>;
    is_negotiable?: boolean;
    lang_available: string;
}

export interface Category {
    id: number;
    name_en: string;
    name_so?: string;
    slug: string;
    icon_name: string;
    image_url?: string;
    icon?: string;
    attributes_schema?: any;
    subcategories?: SubCategory[];
}

export interface SubCategory {
    id: number;
    name_en: string;
    name_so?: string;
    slug: string;
    image_url?: string;
    category_id: number;
    attributes_schema?: any;
    subsubcategories?: SubSubCategory[];
}

export interface SubSubCategory {
    id: number;
    name_en: string;
    name_so?: string;
    slug: string;
    image_url?: string;
    subcategory_id: number;
}
