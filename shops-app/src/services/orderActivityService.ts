import api from './api';
import { orderService } from './orderService';
import dealsService from './deals';

export interface ActivityItemProduct {
  id?: number | string;
  title: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderDealActivity {
  id: string;
  orderNumber: string;
  type: 'inquiry' | 'platform_order' | 'deal';
  shopId: number | string;
  shopName: string;
  shopAvatar?: string;
  isVerifiedShop?: boolean;
  items: ActivityItemProduct[];
  totalAmount: number;
  deliveryLocation?: string;
  buyerNotes?: string;
  createdAt: string;
  hasFollowedUpInChat: boolean;
  isOrderMade: boolean; // whether the order was finalized / bought / confirmed
  dealStatus: 'inquired' | 'chat_active' | 'deal_confirmed' | 'order_completed' | 'cancelled';
  chatUrl: string;
  dealId?: number;
}

const STORAGE_KEY = 'suqafuran_order_activities';

export const orderActivityService = {
  // Retrieve saved local activities
  getLocalActivities(): OrderDealActivity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse local activities:', e);
    }
    return [];
  },

  // Save activities to localStorage
  saveLocalActivities(activities: OrderDealActivity[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch (e) {
      console.error('Failed to store local activities:', e);
    }
  },

  // Record a new cart inquiry
  async recordInquiry(params: {
    orderNumber: string;
    shopId: number | string;
    shopName: string;
    shopAvatar?: string;
    items: ActivityItemProduct[];
    totalAmount: number;
    deliveryLocation?: string;
    buyerNotes?: string;
  }): Promise<OrderDealActivity> {
    const newActivity: OrderDealActivity = {
      id: params.orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
      orderNumber: params.orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
      type: 'inquiry',
      shopId: params.shopId,
      shopName: params.shopName || 'Marketplace Seller',
      shopAvatar: params.shopAvatar,
      isVerifiedShop: true,
      items: params.items,
      totalAmount: params.totalAmount,
      deliveryLocation: params.deliveryLocation || 'Nairobi, Kenya',
      buyerNotes: params.buyerNotes,
      createdAt: new Date().toISOString(),
      hasFollowedUpInChat: true, // buyer was directed to chat
      isOrderMade: false,
      dealStatus: 'inquired',
      chatUrl: `/messages?user=${params.shopId}`,
    };

    // 1. Try to record backend checkout receipt if numeric seller ID
    const numericSellerId = parseInt(String(params.shopId), 10);
    if (!isNaN(numericSellerId)) {
      try {
        await api.post('/checkout-receipts/', {
          seller_id: numericSellerId,
          items: params.items.map(i => ({
            listing_id: typeof i.id === 'number' ? i.id : null,
            title: i.title,
            price: i.price,
            quantity: i.quantity || 1,
          })),
          total_amount: params.totalAmount,
        });
      } catch (err) {
        // Continue gracefully
      }
    }

    // 2. Prepend to local storage
    const current = this.getLocalActivities();
    const updated = [newActivity, ...current.filter(a => a.id !== newActivity.id)];
    this.saveLocalActivities(updated);

    return newActivity;
  },

  // Mark an order or inquiry as deal confirmed / purchased
  async confirmDealMade(activityId: string, listingId?: number): Promise<void> {
    const activities = this.getLocalActivities();
    const updated = activities.map(act => {
      if (act.id === activityId) {
        return {
          ...act,
          isOrderMade: true,
          dealStatus: 'deal_confirmed' as const,
        };
      }
      return act;
    });
    this.saveLocalActivities(updated);

    // If listing ID exists, notify backend deals API
    if (listingId) {
      try {
        await dealsService.markPurchased(listingId);
      } catch (e) {
        // ignore
      }
    }
  },

  // Mark chat follow-up as done
  markFollowedUp(activityId: string): void {
    const activities = this.getLocalActivities();
    const updated = activities.map(act => {
      if (act.id === activityId) {
        return {
          ...act,
          hasFollowedUpInChat: true,
          dealStatus: act.dealStatus === 'inquired' ? ('chat_active' as const) : act.dealStatus,
        };
      }
      return act;
    });
    this.saveLocalActivities(updated);
  },

  // Fetch full combined activity feed
  async getFullActivityFeed(): Promise<OrderDealActivity[]> {
    const local = this.getLocalActivities();

    // Try fetching platform orders
    let platformOrders: OrderDealActivity[] = [];
    try {
      const orders = await orderService.getOrders({ limit: 50 });
      if (Array.isArray(orders)) {
        platformOrders = orders.map(ord => ({
          id: ord.id,
          orderNumber: `ORD-${ord.id.slice(0, 6)}`,
          type: 'platform_order',
          shopId: 'platform',
          shopName: 'Suqafuran Verified Store',
          items: ord.items.map(it => ({
            id: it.product_id,
            title: it.title,
            quantity: it.quantity,
            price: it.price,
          })),
          totalAmount: ord.total_amount,
          deliveryLocation: ord.delivery_address || 'Delivery Address',
          createdAt: ord.created_at || new Date().toISOString(),
          hasFollowedUpInChat: true,
          isOrderMade: ord.status === 'confirmed' || ord.status === 'delivered' || ord.status === 'ready_for_pickup',
          dealStatus: (ord.status === 'delivered' ? 'order_completed' : ord.status === 'confirmed' ? 'deal_confirmed' : 'chat_active') as any,
          chatUrl: '/messages',
        }));
      }
    } catch {
      // ignore
    }

    // Try fetching checkout receipts from backend
    let receipts: OrderDealActivity[] = [];
    try {
      const res = await api.get('/checkout-receipts/');
      if (Array.isArray(res.data)) {
        receipts = res.data.map((rc: any) => ({
          id: `ORD-${rc.id}`,
          orderNumber: `ORD-${rc.id}`,
          type: 'inquiry',
          shopId: rc.seller_id,
          shopName: rc.seller_name || `Shop #${rc.seller_id}`,
          shopAvatar: rc.seller_avatar,
          isVerifiedShop: true,
          items: (rc.items || []).map((it: any) => ({
            id: it.listing_id,
            title: it.title,
            quantity: it.quantity || 1,
            price: it.price,
          })),
          totalAmount: rc.total_amount,
          createdAt: rc.created_at || new Date().toISOString(),
          hasFollowedUpInChat: true,
          isOrderMade: false,
          dealStatus: 'inquired',
          chatUrl: `/messages?user=${rc.seller_id}`,
        }));
      }
    } catch {
      // ignore
    }

    // Merge and deduplicate by ID
    const mergedMap = new Map<string, OrderDealActivity>();

    // Add seeded demo activities if feed is empty
    if (local.length === 0 && platformOrders.length === 0 && receipts.length === 0) {
      const demoActivities: OrderDealActivity[] = [
        {
          id: 'ORD-585840',
          orderNumber: 'ORD-585840',
          type: 'inquiry',
          shopId: 23,
          shopName: 'mohamud mohamed somo',
          isVerifiedShop: true,
          items: [
            {
              id: 112,
              title: 'suitcase set',
              quantity: 1,
              price: 22500,
            }
          ],
          totalAmount: 22500,
          deliveryLocation: 'Nairobi, Kenya',
          createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          hasFollowedUpInChat: true,
          isOrderMade: true,
          dealStatus: 'deal_confirmed',
          chatUrl: '/messages?user=23',
        },
        {
          id: 'ORD-449102',
          orderNumber: 'ORD-449102',
          type: 'inquiry',
          shopId: 19,
          shopName: 'Filsan shop',
          isVerifiedShop: true,
          items: [
            {
              id: 89,
              title: 'Cleanser and moisturizer',
              quantity: 1,
              price: 1850,
            },
            {
              id: 90,
              title: 'S&K Dr.Doven Vitamin C Shower Gel 1000ml',
              quantity: 1,
              price: 2200,
            }
          ],
          totalAmount: 4050,
          deliveryLocation: 'Eastleigh, Nairobi',
          createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
          hasFollowedUpInChat: true,
          isOrderMade: true,
          dealStatus: 'order_completed',
          chatUrl: '/messages?user=19',
        },
        {
          id: 'ORD-391820',
          orderNumber: 'ORD-391820',
          type: 'inquiry',
          shopId: 44,
          shopName: 'Al-Baraka Electronics',
          isVerifiedShop: true,
          items: [
            {
              id: 145,
              title: 'Oraimo FreePods 4 Active Noise Cancelling',
              quantity: 2,
              price: 3800,
            }
          ],
          totalAmount: 7600,
          deliveryLocation: 'CBD, Nairobi',
          createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
          hasFollowedUpInChat: false,
          isOrderMade: false,
          dealStatus: 'inquired',
          chatUrl: '/messages?user=44',
        }
      ];
      this.saveLocalActivities(demoActivities);
      return demoActivities;
    }

    [...local, ...receipts, ...platformOrders].forEach(act => {
      if (!mergedMap.has(act.id)) {
        mergedMap.set(act.id, act);
      }
    });

    return Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // Analytics computation
  computeAnalytics(activities: OrderDealActivity[]) {
    const totalCount = activities.length;
    const ordersMadeCount = activities.filter(a => a.isOrderMade || a.dealStatus === 'deal_confirmed' || a.dealStatus === 'order_completed').length;
    const inquiriesCount = totalCount;
    const followedUpCount = activities.filter(a => a.hasFollowedUpInChat).length;
    const totalPipelineValue = activities.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
    
    const followUpRate = totalCount > 0 ? Math.round((followedUpCount / totalCount) * 100) : 0;
    const conversionRate = totalCount > 0 ? Math.round((ordersMadeCount / totalCount) * 100) : 0;

    return {
      totalCount,
      inquiriesCount,
      ordersMadeCount,
      followedUpCount,
      totalPipelineValue,
      followUpRate,
      conversionRate,
    };
  }
};

export default orderActivityService;

