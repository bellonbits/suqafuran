import api from './api';
import { useAuthStore } from '../store/useAuthStore';

// ── Formatting ──────────────────────────────────────────────────────────────
export const fmtKSh = (amount: number | null | undefined): string => {
  if (amount == null) return 'KSh 0';
  return `KSh ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// ── Types ────────────────────────────────────────────────────────────────────
export interface SellerDashboardStats {
  total_revenue?: number;
  revenue_today?: number;
  revenue_this_month?: number;
  total_orders?: number;
  pending_orders?: number;
  processing_orders?: number;
  delivered_orders?: number;
  cancelled_orders?: number;
  active_products?: number;
  out_of_stock_products?: number;
  shop_views?: number;
  product_views?: number;
  unread_messages?: number;
  total_reviews?: number;
  average_rating?: number;
  listings_count?: number;
  // Raw dashboard response fields
  [key: string]: any;
}

export interface SellerProfile {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  business_name: string;
  shop_description?: string | null;
  shop_page_banner?: string | null;
  shop_detail_banner?: string | null;
  avatar_url?: string | null;
  is_verified: boolean;
  is_featured: boolean;
  free_delivery: boolean;
  verified_level?: string;
  trust_score: number;
  trust_level: string;
  location?: string | null;
  response_time?: string;
  created_at: string;
  listings_count: number;
  // Extended fields
  whatsapp?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  website?: string | null;
  business_registration_number?: string | null;
  business_category?: string | null;
  county?: string | null;
  city?: string | null;
  area?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  standard_delivery_fee?: number | null;
  express_delivery_fee?: number | null;
  min_order_free_delivery?: number | null;
  pickup_available?: boolean;
  same_day_delivery?: boolean;
}

export interface SellerOrder {
  id: number;
  order_number?: string;
  status: 'pending' | 'accepted' | 'processing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: number;
  delivery_fee?: number;
  payment_method?: string;
  delivery_method?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  buyer_id?: number;
  buyer_name?: string;
  buyer_phone?: string;
  delivery_address?: string;
  items?: SellerOrderItem[];
  // fallback fields
  [key: string]: any;
}

export interface SellerOrderItem {
  id: number;
  listing_id?: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  image_url?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  is_active: boolean;
  description?: string;
}

export interface MarketingCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value?: number;
  max_uses?: number;
  uses_count?: number;
  is_active: boolean;
  expires_at?: string;
  created_at?: string;
}

export interface CustomerRecord {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  total_orders: number;
  total_spend: number;
  last_purchase_date?: string;
  is_new?: boolean;
}

export interface ReviewRecord {
  id: number;
  listing_id?: number;
  product_name?: string;
  rating: number;
  comment?: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  created_at: string;
  seller_reply?: string;
}

export interface WalletBalance {
  balance: number;
  currency?: string;
}

export interface WalletTransaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description?: string;
  reference?: string;
  status?: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  other_user_id: number;
  other_user_name?: string;
  other_user_avatar?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read?: boolean;
  created_at: string;
  attachment_url?: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

// Dashboard
export const sellerDashboardService = {
  // Stats & Profile
  async getDashboardStats(): Promise<SellerDashboardStats> {
    try {
      const res = await api.get('/sellers/me/dashboard');
      return res.data;
    } catch {
      return {};
    }
  },

  async getSellerMe(): Promise<SellerProfile | null> {
    try {
      const res = await api.get('/sellers/me');
      return res.data;
    } catch {
      return null;
    }
  },

  async getSellerProfile(): Promise<SellerProfile | null> {
    try {
      const res = await api.get('/sellers/me/profile');
      return res.data;
    } catch {
      return null;
    }
  },

  async updateSellerSettings(data: Partial<SellerProfile>): Promise<void> {
    await api.put('/users/me/seller-settings', data);
  },

  async updateUserMe(data: Record<string, any>): Promise<void> {
    await api.patch('/users/me', data);
  },

  // Products / Listings
  async getMyListings(params?: { skip?: number; limit?: number; search?: string; status?: string }): Promise<any[]> {
    const res = await api.get('/listings/me', { params: { ...params, limit: params?.limit ?? 50 } });
    return res.data;
  },

  async createListing(data: FormData): Promise<any> {
    const res = await api.post('/listings/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },

  async updateListing(id: number, data: Record<string, any>): Promise<any> {
    const res = await api.put(`/listings/${id}`, data);
    return res.data;
  },

  async patchListing(id: number, data: Record<string, any>): Promise<any> {
    const res = await api.patch(`/listings/${id}`, data);
    return res.data;
  },

  async deleteListing(id: number): Promise<void> {
    await api.delete(`/listings/${id}`);
  },

  async uploadListingImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/listings/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.url || res.data;
  },

  async uploadMultipleImages(files: File[]): Promise<string[]> {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    const token = useAuthStore.getState().token;
    const params = token ? { token } : {};
    const res = await api.post('/listings/upload-multiple', fd, { params, headers: { 'Content-Type': 'multipart/form-data' } });
    const data = Array.isArray(res.data) ? res.data : res.data.urls || [];
    return data.map((item: any) => item.url || item);
  },

  async getCategories(): Promise<any[]> {
    const res = await api.get('/listings/categories');
    return res.data;
  },

  // Orders
  async getSellerOrders(params?: { skip?: number; limit?: number; status?: string }): Promise<SellerOrder[]> {
    try {
      const res = await api.get('/sellers/me/orders', { params });
      return res.data;
    } catch {
      // fallback to user orders
      const res = await api.get('/orders', { params });
      return res.data;
    }
  },

  async getOrder(orderId: number): Promise<SellerOrder> {
    const res = await api.get(`/orders/${orderId}`);
    return res.data;
  },

  async updateDeliveryStatus(orderId: number, status: string, notes?: string): Promise<void> {
    await api.post(`/orders/${orderId}/delivery-status`, { status, notes });
  },

  async cancelOrder(orderId: number, reason?: string): Promise<void> {
    await api.post(`/orders/${orderId}/cancel`, { reason });
  },

  async processRefund(orderId: number, amount?: number, reason?: string): Promise<void> {
    await api.post(`/orders/${orderId}/process-refund`, { amount, reason });
  },

  // Customers
  async getCustomers(businessId?: string): Promise<CustomerRecord[]> {
    try {
      if (businessId) {
        const res = await api.get(`/businesses/${businessId}/customers`);
        return res.data;
      }
      return [];
    } catch {
      return [];
    }
  },

  // Messages / Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await api.get('/messages/conversations');
    return res.data;
  },

  async getMessages(otherUserId: number): Promise<ChatMessage[]> {
    const res = await api.get(`/messages/${otherUserId}`);
    return res.data;
  },

  async sendMessage(receiverId: number, content: string): Promise<void> {
    await api.post('/messages/', { receiver_id: receiverId, content });
  },

  async markRead(otherUserId: number): Promise<void> {
    await api.post(`/messages/${otherUserId}/read`);
  },

  // Reviews / Feedback
  async getListingFeedback(listingId: number): Promise<ReviewRecord[]> {
    try {
      const res = await api.get(`/feedback/listing/${listingId}`);
      return res.data;
    } catch {
      return [];
    }
  },

  async getAllMyReviews(): Promise<ReviewRecord[]> {
    try {
      // Get all my listings then fetch feedback for each
      const listings = await sellerDashboardService.getMyListings({ limit: 100 });
      const reviews: ReviewRecord[] = [];
      const topListings = listings.slice(0, 10); // avoid too many calls
      await Promise.all(topListings.map(async (l: any) => {
        const fb = await sellerDashboardService.getListingFeedback(l.id);
        fb.forEach(r => reviews.push({ ...r, product_name: l.title_en, listing_id: l.id }));
      }));
      return reviews;
    } catch {
      return [];
    }
  },

  // Finance / Wallet
  async getWalletBalance(): Promise<WalletBalance> {
    try {
      const res = await api.get('/wallet/balance');
      return res.data;
    } catch {
      return { balance: 0 };
    }
  },

  async getWalletTransactions(params?: { skip?: number; limit?: number }): Promise<WalletTransaction[]> {
    try {
      const res = await api.get('/wallet/transactions', { params });
      return res.data;
    } catch {
      return [];
    }
  },

  // Notifications
  async getNotifications(): Promise<any[]> {
    try {
      const res = await api.get('/notifications/');
      return res.data;
    } catch {
      return [];
    }
  },

  // Marketing codes
  async getMarketingCodes(): Promise<MarketingCode[]> {
    try {
      const res = await api.get('/marketing/codes');
      return res.data;
    } catch {
      return [];
    }
  },

  async createMarketingCode(data: Partial<MarketingCode>): Promise<MarketingCode> {
    const res = await api.post('/marketing/codes', data);
    return res.data;
  },

  async updateMarketingCode(id: string, data: Partial<MarketingCode>): Promise<MarketingCode> {
    const res = await api.patch(`/marketing/codes/${id}`, data);
    return res.data;
  },

  async deactivateMarketingCode(id: string): Promise<void> {
    await api.delete(`/marketing/codes/${id}`);
  },

  // Riders / Delivery
  async getAvailableRiders(): Promise<any[]> {
    try {
      const res = await api.get('/riders/available');
      return res.data;
    } catch {
      return [];
    }
  },

  async assignDelivery(orderId: number, riderId: number): Promise<any> {
    const res = await api.post('/riders/assignments/assign', { order_id: orderId, rider_id: riderId });
    return res.data;
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/users/me/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  // Avatar upload
  async uploadAvatar(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.avatar_url || res.data;
  },

  // Analytics
  async getAnalyticsSessions(): Promise<any> {
    try {
      const res = await api.get('/analytics/sessions/active');
      return res.data;
    } catch { return null; }
  },

  async getActivityFeed(): Promise<any[]> {
    try {
      const res = await api.get('/analytics/activities/feed');
      return res.data;
    } catch { return []; }
  },

  // AI
  async generateListingText(data: { title?: string; category?: string }): Promise<any> {
    const res = await api.post('/ai/listings/generate', data);
    return res.data;
  },

  async getPriceRecommendation(data: { title: string; category?: string; condition?: string }): Promise<any> {
    try {
      const res = await api.post('/ai/listings/price-recommendation', data);
      return res.data;
    } catch { return null; }
  },
};

// ── Local state helpers ───────────────────────────────────────────────────────
export const DELIVERY_ZONES_KEY = 'sqf_delivery_zones';
export const DELIVERY_SETTINGS_KEY = 'sqf_delivery_settings';

export const getLocalDeliveryZones = (): DeliveryZone[] => {
  try {
    return JSON.parse(localStorage.getItem(DELIVERY_ZONES_KEY) || '[]');
  } catch { return []; }
};

export const saveLocalDeliveryZones = (zones: DeliveryZone[]): void => {
  localStorage.setItem(DELIVERY_ZONES_KEY, JSON.stringify(zones));
};

export const getLocalDeliverySettings = () => {
  try {
    return JSON.parse(localStorage.getItem(DELIVERY_SETTINGS_KEY) || '{}');
  } catch { return {}; }
};

export const saveLocalDeliverySettings = (settings: Record<string, any>): void => {
  localStorage.setItem(DELIVERY_SETTINGS_KEY, JSON.stringify(settings));
};

// ── CSV export ────────────────────────────────────────────────────────────────
export const exportToCSV = (data: Record<string, any>[], filename: string): void => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToPDF = (title: string): void => {
  const printContent = document.getElementById('printable-section');
  if (!printContent) { window.print(); return; }
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`
    <html><head><title>${title}</title>
    <style>body{font-family:sans-serif;padding:24px;}table{width:100%;border-collapse:collapse;}
    th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f5f5f5;}</style>
    </head><body>${printContent.innerHTML}</body></html>`);
  w.document.close();
  w.print();
};
