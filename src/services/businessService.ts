import api from './api';

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
    is_approved?: boolean;
    opening_hours?: Record<string, any>;
    rating: number;
    trust_score: number;
    is_active: boolean;
    brand_color?: string;
    tagline?: string;
    created_at: string;
    updated_at: string;
}

export interface Employee {
    id: number;
    business_id: string;
    user_id?: number;
    invite_email?: string;
    invite_phone?: string;
    role: string;
    is_active: boolean;
    joined_at?: string;
    performance_sales: number;
    performance_responses: number;
    performance_orders_handled: number;
}

export interface BusinessProduct {
    id: number;
    business_id: string;
    listing_id?: number;
    name_en: string;
    name_so?: string;
    description_en?: string;
    description_so?: string;
    sku?: string;
    price: number;
    discount_price?: number;
    stock_level: number;
    low_stock_threshold: number;
    category_id?: number;
    subcategory_id?: number;
    images: string[];
    variants: Record<string, any>;
    is_active: boolean;
    views: number;
    clicks: number;
    sales: number;
}

export interface BusinessCustomer {
    id: number;
    business_id: string;
    user_id: number;
    notes?: string;
    total_orders: number;
    total_spent: number;
    loyalty_score: number;
    segmentation: 'new' | 'regular' | 'VIP' | 'inactive';
    last_purchase_at?: string;
    created_at: string;
}

export interface Order {
    id: number;
    business_id: string;
    customer_id: number;
    employee_id?: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
    total_amount: number;
    payment_status: string;
    payment_method: string;
    items: any[];
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface BusinessMessage {
    id: number;
    business_id: string;
    customer_id: number;
    sender_id: number;
    content: string;
    is_from_customer: boolean;
    is_read: boolean;
    tags: string[];
    created_at: string;
}

export interface TeamMessage {
    id: number;
    business_id: string;
    sender_id: number;
    content: string;
    is_announcement: boolean;
    order_id?: number;
    created_at: string;
}

export interface BusinessTask {
    id: number;
    business_id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    assigned_to?: number;
    order_id?: number;
    due_date?: string;
    created_at: string;
}

export const businessService = {
    // Workspace management
    registerBusiness: async (params: {
        name: string;
        slug: string;
        category: string;
        description?: string;
        address?: string;
        phone?: string;
        email?: string;
        location_lat?: number;
        location_lng?: number;
    }): Promise<Business> => {
        const { data } = await api.post<Business>('/businesses/', null, { params });
        return data;
    },

    getMyBusinesses: async (): Promise<Business[]> => {
        const { data } = await api.get<Business[]>('/businesses/my-businesses');
        return data;
    },

    getBusiness: async (businessId: string): Promise<Business> => {
        const { data } = await api.get<Business>(`/businesses/${businessId}`);
        return data;
    },

    updateBusiness: async (businessId: string, updateData: Partial<Business>): Promise<Business> => {
        const { data } = await api.put<Business>(`/businesses/${businessId}`, updateData);
        return data;
    },

    // Employee management
    getEmployees: async (businessId: string): Promise<Employee[]> => {
        const { data } = await api.get<Employee[]>(`/businesses/${businessId}/employees`);
        return data;
    },

    inviteEmployee: async (
        businessId: string,
        params: { email?: string; phone?: string; role: string }
    ): Promise<Employee> => {
        const { data } = await api.post<Employee>(`/businesses/${businessId}/employees/invite`, null, { params });
        return data;
    },

    updateEmployee: async (
        businessId: string,
        employeeId: number,
        updateData: { role?: string; is_active?: boolean }
    ): Promise<Employee> => {
        const { data } = await api.put<Employee>(`/businesses/${businessId}/employees/${employeeId}`, updateData);
        return data;
    },

    // Inventory & catalog
    getProducts: async (businessId: string): Promise<BusinessProduct[]> => {
        const { data } = await api.get<BusinessProduct[]>(`/businesses/${businessId}/products`);
        return data;
    },

    addProduct: async (
        businessId: string,
        productData: {
            name_en: string;
            price: number;
            name_so?: string;
            description_en?: string;
            description_so?: string;
            sku?: string;
            stock_level?: number;
            low_stock_threshold?: number;
            category_id?: number;
            subcategory_id?: number;
            images?: string[];
            variants?: Record<string, any>;
        }
    ): Promise<BusinessProduct> => {
        const { data } = await api.post<BusinessProduct>(`/businesses/${businessId}/products`, productData);
        return data;
    },

    updateProduct: async (
        businessId: string,
        productId: number,
        updateData: Partial<BusinessProduct>
    ): Promise<BusinessProduct> => {
        const { data } = await api.put<BusinessProduct>(`/businesses/${businessId}/products/${productId}`, updateData);
        return data;
    },

    // Order tracking
    getOrders: async (businessId: string): Promise<Order[]> => {
        const { data } = await api.get<Order[]>(`/businesses/${businessId}/orders`);
        return data;
    },

    recordOrder: async (
        businessId: string,
        orderData: {
            customer_id: number;
            items: any[];
            total_amount: number;
            payment_method?: string;
            notes?: string;
            employee_id?: number;
        }
    ): Promise<Order> => {
        const { data } = await api.post<Order>(`/businesses/${businessId}/orders`, orderData);
        return data;
    },

    updateOrder: async (
        businessId: string,
        orderId: number,
        updateData: { status: string; employee_id?: number }
    ): Promise<Order> => {
        const { data } = await api.put<Order>(`/businesses/${businessId}/orders/${orderId}`, updateData);
        return data;
    },

    // CRM integration
    getCustomers: async (businessId: string): Promise<BusinessCustomer[]> => {
        const { data } = await api.get<BusinessCustomer[]>(`/businesses/${businessId}/customers`);
        return data;
    },

    updateCustomerNotes: async (
        businessId: string,
        customerId: number,
        notes: string
    ): Promise<BusinessCustomer> => {
        const { data } = await api.put<BusinessCustomer>(`/businesses/${businessId}/customers/${customerId}`, { notes });
        return data;
    },

    // Task boards
    getTasks: async (businessId: string): Promise<BusinessTask[]> => {
        const { data } = await api.get<BusinessTask[]>(`/businesses/${businessId}/tasks`);
        return data;
    },

    createTask: async (
        businessId: string,
        taskData: {
            title: string;
            description?: string;
            status?: string;
            assigned_to?: number;
            order_id?: number;
            due_date?: string;
        }
    ): Promise<BusinessTask> => {
        const { data } = await api.post<BusinessTask>(`/businesses/${businessId}/tasks`, taskData);
        return data;
    },

    updateTask: async (
        businessId: string,
        taskId: number,
        updateData: Partial<BusinessTask>
    ): Promise<BusinessTask> => {
        const { data } = await api.put<BusinessTask>(`/businesses/${businessId}/tasks/${taskId}`, updateData);
        return data;
    },

    // Real-time Chat history
    getCustomerChatHistory: async (businessId: string, customerId: number): Promise<BusinessMessage[]> => {
        const { data } = await api.get<BusinessMessage[]>(`/businesses/${businessId}/messages/customer/${customerId}`);
        return data;
    },

    sendCustomerChatMessage: async (
        businessId: string,
        customerId: number,
        content: string,
        tags: string[] = []
    ): Promise<BusinessMessage> => {
        const { data } = await api.post<BusinessMessage>(`/businesses/${businessId}/messages/customer/${customerId}`, {
            content,
            tags,
        });
        return data;
    },

    getTeamChatHistory: async (businessId: string): Promise<TeamMessage[]> => {
        const { data } = await api.get<TeamMessage[]>(`/businesses/${businessId}/messages/team`);
        return data;
    },

    sendTeamChatMessage: async (
        businessId: string,
        content: string,
        isAnnouncement = false,
        orderId?: number
    ): Promise<TeamMessage> => {
        const { data } = await api.post<TeamMessage>(`/businesses/${businessId}/messages/team`, {
            content,
            is_announcement: isAnnouncement,
            order_id: orderId,
        });
        return data;
    },

    // Redis analytics
    getAnalytics: async (businessId: string): Promise<any> => {
        const { data } = await api.get<any>(`/businesses/${businessId}/analytics`);
        return data;
    },

    // Groq AI helpers
    aiGenerateDescription: async (
        businessId: string,
        inputText: string,
        targetLanguage = 'en',
        category?: string,
        attributes: Record<string, any> = {}
    ): Promise<string> => {
        const { data } = await api.post<{ description: string }>(`/businesses/${businessId}/ai/generate-description`, {
            input_text: inputText,
            target_language: targetLanguage,
            category,
            attributes,
        });
        return data.description;
    },

    aiSuggestPrice: async (
        businessId: string,
        title: string,
        category: string,
        condition = 'Used'
    ): Promise<any> => {
        const { data } = await api.post<any>(`/businesses/${businessId}/ai/suggest-price`, {
            title,
            category,
            condition,
        });
        return data;
    },

    aiSuggestReply: async (businessId: string, customerId: number): Promise<string[]> => {
        const { data } = await api.post<string[]>(`/businesses/${businessId}/ai/suggest-reply`, {
            customer_id: customerId,
        });
        return data;
    },

    aiSummarizeChat: async (businessId: string, customerId: number): Promise<string> => {
        const { data } = await api.post<{ summary: string }>(`/businesses/${businessId}/ai/summarize-chat`, {
            customer_id: customerId,
        });
        return data.summary;
    },

    // Public Storefront methods
    getPublicShop: async (slug: string): Promise<{ business: Business; products: BusinessProduct[]; listings: any[] }> => {
        const { data } = await api.get<{ business: Business; products: BusinessProduct[]; listings: any[] }>(`/businesses/public/${slug}`);
        return data;
    },

    getNearbyShops: async (params?: {
        lat?: number;
        lng?: number;
        category?: string;
        limit?: number;
        offset?: number;
    }): Promise<(Business & { distance_km?: number })[]> => {
        const { data } = await api.get<(Business & { distance_km?: number })[]>('/businesses/nearby', { params });
        return data;
    },
};
