import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import api from './api';

type NavigateFn = (path: string) => void;

let _initialized = false;

export const pushNotificationService = {
    async setup(navigate: NavigateFn): Promise<void> {
        // Only runs on real Android/iOS devices
        if (!Capacitor.isNativePlatform()) return;
        if (_initialized) return;
        _initialized = true;

        try {
            // 1. Request permission
            const permission = await PushNotifications.requestPermissions();
            if (permission.receive !== 'granted') {
                console.warn('[Push] Permission denied by user');
                return;
            }

            // 2. Register with FCM / APNs
            await PushNotifications.register();

            // 3. Save token to backend when FCM assigns one
            PushNotifications.addListener('registration', async ({ value: token }) => {
                console.log('[Push] FCM token received:', token.slice(0, 20) + '…');
                try {
                    await api.put('/users/me/device-token', { device_token: token });
                } catch (e) {
                    console.warn('[Push] Failed to save token to backend', e);
                }
            });

            // 4. Registration error
            PushNotifications.addListener('registrationError', (err) => {
                console.error('[Push] Registration error:', err);
            });

            // 5. Foreground notification — show a toast-style banner
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('[Push] Foreground notification:', notification.title);
                // Show native-style in-app banner using the notification data
                // The app's existing toast system can be used here
                const event = new CustomEvent('suqafuran:push', { detail: notification });
                window.dispatchEvent(event);
            });

            // 6. User tapped a notification (app was in background or killed)
            PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                const data = action.notification.data as Record<string, string>;
                console.log('[Push] Notification tapped:', data);
                const path = data?.path;
                if (path) {
                    // Small delay so app has time to fully mount if it was killed
                    setTimeout(() => navigate(path), 500);
                }
            });

        } catch (err) {
            console.error('[Push] Setup failed:', err);
        }
    },

    async clearToken(): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await api.delete('/users/me/device-token');
            await PushNotifications.removeAllListeners();
            _initialized = false;
        } catch {
            // best effort
        }
    },
};
