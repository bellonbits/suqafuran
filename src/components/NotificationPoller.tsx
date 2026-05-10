import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { notificationService, Notification } from '../services/notificationService';

export const NotificationPoller: React.FC = () => {
    const { isAuthenticated } = useAuthStore();
    const lastNotificationIdRef = useRef<number | null>(null);

    useEffect(() => {
        // Only run if authenticated
        if (!isAuthenticated) return;

        // Request notification permission if not already granted
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const fetchNotifications = async () => {
            try {
                const notifications = await notificationService.getMyNotifications();
                
                if (notifications.length > 0) {
                    // Sort notifications to get the latest
                    const sorted = [...notifications].sort((a, b) => b.id - a.id);
                    const latest = sorted[0];

                    // If we have a new notification that we haven't seen yet in this session
                    if (lastNotificationIdRef.current !== null && latest.id > lastNotificationIdRef.current) {
                        // Find all new notifications since last check
                        const newNotifications = sorted.filter(n => n.id > lastNotificationIdRef.current!);
                        
                        // Show push notifications for the new ones
                        if ('Notification' in window && Notification.permission === 'granted') {
                            newNotifications.forEach(notif => {
                                if (!notif.is_read) {
                                    const title = 'Suqafuran Notification';
                                    let body = 'You have a new update.';
                                    
                                    // Try to extract a meaningful body from data
                                    if (notif.data && typeof notif.data === 'object') {
                                        body = notif.data.message || notif.data.title || body;
                                    }

                                    const push = new Notification(title, {
                                        body,
                                        icon: '/icon.png',
                                    });

                                    push.onclick = () => {
                                        window.focus();
                                        push.close();
                                    };
                                }
                            });
                        }
                    }

                    lastNotificationIdRef.current = latest.id;
                }
            } catch (error) {
                console.error("Failed to poll notifications:", error);
            }
        };

        // Initial fetch
        fetchNotifications();

        // Poll every 10 seconds for more active real-time feel
        const interval = setInterval(fetchNotifications, 10000);

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    return null; // This is a logic-only component
};
