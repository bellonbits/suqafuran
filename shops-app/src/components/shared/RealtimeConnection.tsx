"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuth';
import { useRealtimeStore } from '../../store/useRealtime';
import { API_BASE_URL } from '../../services/api';
import { playNotificationSound, requestPushPermission, showPushNotification } from '../../utils/notificationAudioAndPush';

const FALLBACK_POLL_INTERVAL_MS = 30000;

function buildSseUrl(token: string): string {
    return `${API_BASE_URL}/notifications/sse?token=${encodeURIComponent(token)}`;
}

/**
 * Mounted once at the app root. Keeps a Server-Sent Events (SSE) connection
 * open for real-time notifications, unread counts, push alerts, and audio chimes.
 *
 * Uses browser-native EventSource over standard HTTPS, which is immune to
 * WebSocket restrictions, corporate proxies, and browser extension interference.
 * Also maintains a background HTTP polling sync every 30s.
 */
export function RealtimeConnection() {
    const token = useAuthStore((s) => s.token);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const eventSourceRef = useRef<EventSource | null>(null);
    const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            eventSourceRef.current?.close();
            eventSourceRef.current = null;
            if (pollTimer.current) {
                clearInterval(pollTimer.current);
                pollTimer.current = null;
            }
            useRealtimeStore.getState().setConnected(false);
            return;
        }

        let cancelled = false;

        // Request browser push notification permission if not yet decided
        requestPushPermission().catch(() => {});

        async function fetchNotifications() {
            try {
                // Fetch only unread notifications so cleared ones never reappear
                const res = await fetch(`${API_BASE_URL}/notifications/?unread_only=true`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                });
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data) && !cancelled) {
                    const formattedEvents = data.map((item: any) => ({
                        type: item.type || 'notification',
                        payload: item.data || { message: item.message || item.title },
                        timestamp: item.created_at || new Date().toISOString(),
                    }));
                    useRealtimeStore.getState().setEvents(formattedEvents);
                }
            } catch {
                // Ignore transient network errors
            }
        }

        function handleIncoming(raw: string) {
            try {
                const data = JSON.parse(raw);
                if (data && (data.type || data.payload)) {
                    const eventPayload = (data.payload || data) as Record<string, unknown>;
                    const eventType = data.type || 'notification';
                    const title = (eventPayload.title as string) || (eventType.replace(/_/g, ' ').toUpperCase());
                    const message = (eventPayload.message as string) || (eventPayload.content as string) || 'New notification on Suqafuran';

                    // 1. Play audio chime tone
                    playNotificationSound();

                    // 2. Deliver native browser desktop/mobile push notification
                    showPushNotification(title, message);

                    // 3. Store in realtime state for notification bell and in-app toast
                    useRealtimeStore.getState().pushEvent({
                        type: eventType,
                        payload: eventPayload,
                        timestamp: data.timestamp || (eventPayload.created_at as string) || new Date().toISOString(),
                    });
                }
            } catch {
                // Ignore non-json frames
            }
        }

        // 1. Initial notification fetch (unread only)
        fetchNotifications();

        // 2. Background polling fallback every 30 seconds
        pollTimer.current = setInterval(() => {
            if (!cancelled) fetchNotifications();
        }, FALLBACK_POLL_INTERVAL_MS);

        // 3. Connect Server-Sent Events (SSE)
        if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
            try {
                const sseUrl = buildSseUrl(token);
                const es = new EventSource(sseUrl);
                eventSourceRef.current = es;

                es.onopen = () => {
                    useRealtimeStore.getState().setConnected(true);
                };

                es.addEventListener('connection', () => {
                    useRealtimeStore.getState().setConnected(true);
                });

                es.addEventListener('notification', (e) => {
                    handleIncoming(e.data);
                });

                es.onmessage = (e) => {
                    handleIncoming(e.data);
                };

                es.onerror = () => {
                    // Browser native EventSource will automatically retry connecting
                    useRealtimeStore.getState().setConnected(false);
                };
            } catch (err) {
                console.warn('[SSE] Could not establish EventSource, relying on polling fallback:', err);
            }
        }

        return () => {
            cancelled = true;
            if (pollTimer.current) {
                clearInterval(pollTimer.current);
                pollTimer.current = null;
            }
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            useRealtimeStore.getState().setConnected(false);
        };
    }, [isAuthenticated, token]);

    return null;
}
