/**Analytics service for tracking user engagement with items and shops.*/

import api from './api';

interface TrackItemViewParams {
  listing_id: number;
  time_spent_seconds?: number;
  device_type?: string;
  referrer?: string;
}

interface TrackShopViewParams {
  shop_owner_id: number;
  time_spent_seconds?: number;
  device_type?: string;
  referrer?: string;
}

class AnalyticsService {
  async trackItemView(params: TrackItemViewParams) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('listing_id', params.listing_id.toString());
      if (params.time_spent_seconds) {
        queryParams.append('time_spent_seconds', params.time_spent_seconds.toString());
      }
      if (params.device_type) {
        queryParams.append('device_type', params.device_type);
      }
      if (params.referrer) {
        queryParams.append('referrer', params.referrer);
      }

      return await api.post(`/analytics/track/item-view?${queryParams.toString()}`);
    } catch (error) {
      console.error('Failed to track item view:', error);
    }
  }

  async trackShopView(params: TrackShopViewParams) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('shop_owner_id', params.shop_owner_id.toString());
      if (params.time_spent_seconds) {
        queryParams.append('time_spent_seconds', params.time_spent_seconds.toString());
      }
      if (params.device_type) {
        queryParams.append('device_type', params.device_type);
      }
      if (params.referrer) {
        queryParams.append('referrer', params.referrer);
      }

      return await api.post(`/analytics/track/shop-view?${queryParams.toString()}`);
    } catch (error) {
      console.error('Failed to track shop view:', error);
    }
  }

  async getTopItems(days = 7, limit = 20) {
    try {
      return await api.get(`/analytics/admin/top-items?days=${days}&limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch top items:', error);
      throw error;
    }
  }

  async getTopShops(days = 7, limit = 20) {
    try {
      return await api.get(`/analytics/admin/top-shops?days=${days}&limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch top shops:', error);
      throw error;
    }
  }

  async getLiveViews(minutes = 5) {
    try {
      return await api.get(`/analytics/admin/live-views?minutes=${minutes}`);
    } catch (error) {
      console.error('Failed to fetch live views:', error);
      throw error;
    }
  }

  async getItemStats(listingId: number, days = 30) {
    try {
      return await api.get(`/analytics/admin/item-stats/${listingId}?days=${days}`);
    } catch (error) {
      console.error('Failed to fetch item stats:', error);
      throw error;
    }
  }

  async getShopStats(shopOwnerId: number, days = 30) {
    try {
      return await api.get(`/analytics/admin/shop-stats/${shopOwnerId}?days=${days}`);
    } catch (error) {
      console.error('Failed to fetch shop stats:', error);
      throw error;
    }
  }

  getDeviceType(): string {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    }
    return 'unknown';
  }
}

export const analyticsService = new AnalyticsService();
