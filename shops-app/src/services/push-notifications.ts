import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import api from './api';
import { useAuthStore } from '@/store/useAuth';

class PushNotificationsService {
  private isInitialized = false;
  private currentToken: string | null = null;
  private navigateHandler: ((path: string) => void) | null = null;

  setNavigateHandler(navigate: (path: string) => void) {
    this.navigateHandler = navigate;
  }

  async initialize(navigate?: (path: string) => void) {
    if (navigate) {
      this.navigateHandler = navigate;
    }

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    if (this.isInitialized) {
      if (useAuthStore.getState().isAuthenticated) {
        this.registerDeviceToken();
      }
      return;
    }

    try {
      let permission = await PushNotifications.checkPermissions();

      if (permission.receive === 'prompt') {
        permission = await PushNotifications.requestPermissions();
      }

      if (permission.receive !== 'granted') {
        console.log('[Push] Notification permission not granted:', permission.receive);
        return;
      }

      // Register with Apple (APNs) or Google (FCM)
      await PushNotifications.register();

      // Listen for registration token
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('[Push] Device registration token:', token.value);
        this.currentToken = token.value;
        try {
          localStorage.setItem('device_push_token', token.value);
        } catch {}
        await this.registerDeviceToken(token.value);
      });

      // Listen for foreground push notifications
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('[Push] Foreground notification received:', notification);
      });

      // Handle notification tap / action
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('[Push] Notification tapped:', action);
        this.handleNotificationTap(action.notification);
      });

      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('[Push] Registration error:', error);
      });

      this.isInitialized = true;
      console.log('[Push] Push notification service initialized');
    } catch (error) {
      console.error('[Push] Failed to initialize push notifications:', error);
    }
  }

  async registerDeviceToken(token?: string) {
    let deviceToken = token || this.currentToken;
    if (!deviceToken) {
      try {
        deviceToken = localStorage.getItem('device_push_token') || undefined;
      } catch {}
    }

    if (!deviceToken) return;

    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) return;

    try {
      await api.put('/users/me/device-token', { device_token: deviceToken }).catch(() => null);
      await api.post('/notifications/device-token', { device_token: deviceToken, token: deviceToken }).catch(() => null);
      console.log('[Push] Device token registered with backend');
    } catch (error) {
      console.error('[Push] Failed to register device token with backend:', error);
    }
  }

  async unregisterDeviceToken() {
    try {
      await api.delete('/users/me/device-token').catch(() => null);
      this.currentToken = null;
      try {
        localStorage.removeItem('device_push_token');
      } catch {}
      console.log('[Push] Device token unregistered');
    } catch (e) {
      console.warn('[Push] Error unregistering token:', e);
    }
  }

  handleNotificationTap(notification: any) {
    const data = notification?.data || {};
    const path = data.path || data.action_url || data.url;

    if (path) {
      if (this.navigateHandler) {
        this.navigateHandler(path);
      } else {
        window.location.href = path;
      }
      return;
    }

    if (data.type === 'message' || data.sender_id) {
      const target = data.sender_id ? `/messages?userId=${data.sender_id}` : '/messages';
      if (this.navigateHandler) this.navigateHandler(target);
      else window.location.href = target;
    } else if (data.type === 'order' || data.order_id) {
      const target = data.order_id ? `/orders?orderId=${data.order_id}` : '/orders';
      if (this.navigateHandler) this.navigateHandler(target);
      else window.location.href = target;
    } else if (data.type === 'listing' || data.listing_id) {
      const target = `/listing/${data.listing_id}`;
      if (this.navigateHandler) this.navigateHandler(target);
      else window.location.href = target;
    }
  }
}

export const pushNotificationsService = new PushNotificationsService();
