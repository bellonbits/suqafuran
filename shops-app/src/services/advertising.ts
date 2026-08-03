import api from './api';

export interface HomepageBanner {
  id: number;
  seller_id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  button_text: string;
  button_link: string;
  start_date: string;
  end_date: string;
  priority: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface HomepageBannerDetail extends HomepageBanner {
  stats: {
    impressions: number;
    clicks: number;
    ctr: number;
  } | null;
}

export interface CreateBannerPayload {
  seller_id: number;
  title: string;
  subtitle?: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  button_text?: string;
  button_link: string;
  start_date: string;
  end_date: string;
  priority?: number;
}

export interface UpdateBannerPayload {
  title?: string;
  subtitle?: string | null;
  image_url?: string;
  mobile_image_url?: string | null;
  button_text?: string;
  button_link?: string;
  start_date?: string;
  end_date?: string;
  priority?: number;
  status?: string;
}

export const advertisingService = {
  /**
   * Get active homepage banners for rotation
   */
  async getActiveBanners(): Promise<HomepageBanner[]> {
    try {
      const response = await api.get('/advertising/active-banners');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch homepage banners:', error);
      return [];
    }
  },

  /**
   * Track impression for a banner (call on page load)
   */
  async trackBannerImpression(bannerId: number): Promise<void> {
    try {
      await api.post(`/advertising/banners/${bannerId}/impression`);
    } catch (error) {
      console.error('Failed to track banner impression:', error);
    }
  },

  /**
   * Track click for a banner (call on button click)
   */
  async trackBannerClick(bannerId: number): Promise<void> {
    try {
      await api.post(`/advertising/banners/${bannerId}/click`);
    } catch (error) {
      console.error('Failed to track banner click:', error);
    }
  },

  /**
   * Check if a product is featured
   */
  async isListingFeatured(listingId: number): Promise<boolean> {
    try {
      const response = await api.get(`/advertising/listing/${listingId}/is-featured`);
      return response.data?.is_featured || false;
    } catch (error) {
      return false;
    }
  },

  /**
   * Check if a seller's shop is featured
   */
  async isShopFeatured(sellerId: number): Promise<boolean> {
    try {
      const response = await api.get(`/advertising/seller/${sellerId}/is-featured-shop`);
      return response.data?.is_featured || false;
    } catch (error) {
      return false;
    }
  },

  /**
   * Track impression for a featured listing
   */
  async trackListingImpression(listingId: number): Promise<void> {
    try {
      await api.post(`/advertising/listings/${listingId}/impression`);
    } catch (error) {
      console.error('Failed to track listing impression:', error);
    }
  },

  /**
   * Track click for a featured listing
   */
  async trackListingClick(listingId: number): Promise<void> {
    try {
      await api.post(`/advertising/listings/${listingId}/click`);
    } catch (error) {
      console.error('Failed to track listing click:', error);
    }
  },

  // ── Admin: Homepage Banner Management ──────────────────────────────────

  /**
   * List all homepage banners (admin only), optionally filtered by status
   */
  async listBanners(status?: string): Promise<HomepageBannerDetail[]> {
    const response = await api.get('/admin/advertising/banners', {
      params: status ? { status } : undefined,
    });
    return response.data || [];
  },

  /**
   * Get a single homepage banner's details (admin only)
   */
  async getBanner(bannerId: number): Promise<HomepageBannerDetail> {
    const response = await api.get(`/admin/advertising/banners/${bannerId}`);
    return response.data;
  },

  /**
   * Create a new homepage banner (admin only)
   */
  async createBanner(payload: CreateBannerPayload): Promise<HomepageBanner> {
    const response = await api.post('/admin/advertising/banners', payload);
    return response.data;
  },

  /**
   * Update a homepage banner (admin only). Active banners can't be edited.
   */
  async updateBanner(bannerId: number, payload: UpdateBannerPayload): Promise<HomepageBanner> {
    const response = await api.patch(`/admin/advertising/banners/${bannerId}`, payload);
    return response.data;
  },

  /**
   * Publish a banner — moves it to scheduled or active based on its dates
   */
  async publishBanner(bannerId: number): Promise<{ status: string; banner_id: number; banner_status: string }> {
    const response = await api.post(`/admin/advertising/banners/${bannerId}/publish`);
    return response.data;
  },

  /**
   * Pause an active banner
   */
  async pauseBanner(bannerId: number): Promise<{ status: string; banner_id: number }> {
    const response = await api.post(`/admin/advertising/banners/${bannerId}/pause`);
    return response.data;
  },

  /**
   * Delete a banner (draft/expired only, admin only)
   */
  async deleteBanner(bannerId: number): Promise<void> {
    await api.delete(`/admin/advertising/banners/${bannerId}`);
  },

  /**
   * Zero out a banner's impression/click counters (e.g. after test traffic)
   */
  async resetBannerStats(bannerId: number): Promise<void> {
    await api.post(`/admin/advertising/banners/${bannerId}/reset-stats`);
  },

  /**
   * Upload a banner image, returns the hosted URL to use as image_url/mobile_image_url
   */
  async uploadBannerImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/listings/upload', formData);
    return response.data.url;
  },
};
