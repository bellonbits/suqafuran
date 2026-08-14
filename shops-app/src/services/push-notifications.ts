import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import api from './api';

let listenersRegistered = false;

export const pushNotificationsService = {
  /** Call once the user is authenticated -- requests permission, registers for a
   *  real FCM token (works on both Android and iOS; this plugin handles the
   *  APNs<->FCM token exchange on iOS internally) and sends it to the backend. */
  async initialize() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      let permission = await FirebaseMessaging.checkPermissions();

      if (permission.receive === 'prompt') {
        permission = await FirebaseMessaging.requestPermissions();
      }

      if (permission.receive !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      if (!listenersRegistered) {
        listenersRegistered = true;

        FirebaseMessaging.addListener('tokenReceived', (event) => {
          this.registerDeviceToken(event.token);
        });

        FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
          const path = (event.notification.data as Record<string, string> | undefined)?.path;
          if (path) {
            window.dispatchEvent(new CustomEvent('push-notification-tap', { detail: { path } }));
          }
        });
      }

      const { token } = await FirebaseMessaging.getToken();
      await this.registerDeviceToken(token);
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  },

  async registerDeviceToken(token: string) {
    try {
      await api.put('/users/me/device-token', { device_token: token });
    } catch (error) {
      console.error('Failed to register device token:', error);
    }
  },

  /** Call on logout so this device stops receiving push for the signed-out account. */
  async unregister() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await api.delete('/users/me/device-token');
      await FirebaseMessaging.deleteToken();
    } catch (error) {
      console.error('Failed to unregister push notifications:', error);
    }
  },
};
