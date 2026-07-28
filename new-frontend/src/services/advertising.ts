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
};
