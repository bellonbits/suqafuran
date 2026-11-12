"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuth';
import { useRealtimeStore } from '../../store/useRealtime';
import { API_BASE_URL } from '../../services/api';
import { playNotificationSound, requestPushPermission, showPushNotification } from '../../utils/notificationAudioAndPush';

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL_MS = 30000;
const CONNECTION_TIMEOUT_MS = 10000;

function buildSocketUrl(token: string): string {
    try {
        const wsBase = API_BASE_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
        return `${wsBase}/notifications/ws?token=${encodeURIComponent(token)}`;
    } catch {
        return '';
    }
}

/**
 * Mounted once at the app root. Maintains a real-time WebSocket connection
 * to wss://app.suqafuran.com/api/v1/notifications/ws for live notifications,
 * unread counts, audio chimes, and browser push alerts.
 *
 * Implements:
 * - Capped exponential backoff with jitter
 * - Automatic attempt reset upon successful handshake
 * - Immediate cessation of reconnects upon logout or auth termination (code 1008 / 4401)
 * - Sanitized logging (never logs JWTs or tokens)
 * - Bidirectional ping/pong keepalives for proxy stability
 * - Notification event deduplication
 */
export function RealtimeConnection() {
    const token = useAuthStore((s) => s.token);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const connectionTimeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttempt = useRef(0);
    const processedEventIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!isAuthenticated || !token) {
            // Clean teardown when user is logged out or unauthenticated
            if (socketRef.current) {
                socketRef.current.close(1000, "User logged out");
                socketRef.current = null;
            }
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
                reconnectTimer.current = null;
            }
            if (pingTimer.current) {
                clearInterval(pingTimer.current);
                pingTimer.current = null;
            }
            if (connectionTimeoutTimer.current) {
                clearTimeout(connectionTimeoutTimer.current);
                connectionTimeoutTimer.current = null;
            }
            reconnectAttempt.current = 0;
            useRealtimeStore.getState().setConnected(false);
            return;
        }

        let cancelled = false;

        // Request browser push notification permission if not yet decided
        requestPushPermission().catch(() => {});

        // Fetch unread notifications on mount
        async function fetchInitialNotifications() {
            try {
                const res = await fetch(`${API_BASE_URL}/notifications/?unread_only=true`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                });
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data) && !cancelled) {
                    const formattedEvents = data.map((item: any) => {
                        const eventId = String(item.id || item._id || `${item.type}-${item.created_at}`);
                        processedEventIds.current.add(eventId);
                        const rawData = typeof item.data === 'object' && item.data ? item.data : {};
                        return {
                            type: item.type || 'notification',
                            payload: {
                                ...rawData,
                                id: item.id,
                                is_read: item.is_read,
                                created_at: item.created_at,
                            },
                            timestamp: item.created_at || new Date().toISOString(),
                        };
                    });
                    useRealtimeStore.getState().setEvents(formattedEvents);
                }
            } catch {
                // Ignore transient network errors on initial fetch
            }
        }

        fetchInitialNotifications();

        function connect() {
            if (cancelled || !token || !isAuthenticated) return;

            try {
                const socketUrl = buildSocketUrl(token);
                if (!socketUrl) return;

                // Sanitize URL for console diagnostics (never log JWT)
                const sanitizedUrl = socketUrl.replace(/token=[^&]*/, 'token=***');
                console.log(`[WebSocket] Connecting to ${sanitizedUrl}`);

                const ws = new WebSocket(socketUrl);
                socketRef.current = ws;

                // Connection timeout watchdog
                connectionTimeoutTimer.current = setTimeout(() => {
                    if (ws.readyState === WebSocket.CONNECTING) {
                        console.warn('[WebSocket] Connection handshake timed out, closing socket');
                        ws.close();
                    }
                }, CONNECTION_TIMEOUT_MS);

                ws.onopen = () => {
                    if (connectionTimeoutTimer.current) {
                        clearTimeout(connectionTimeoutTimer.current);
                        connectionTimeoutTimer.current = null;
                    }
                    console.log('[WebSocket] Connected successfully');
                    useRealtimeStore.getState().setConnected(true);
                    reconnectAttempt.current = 0;

                    // Periodic application ping keepalive to prevent proxy idle dropouts
                    if (pingTimer.current) clearInterval(pingTimer.current);
                    pingTimer.current = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            try {
                                ws.send(JSON.stringify({ type: 'ping' }));
                            } catch {
                                // Ignore send errors
                            }
                        }
                    }, PING_INTERVAL_MS);
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (!data) return;

                        // Respond to server keepalive pings
                        if (data.type === 'ping') {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: 'pong' }));
                            }
                            return;
                        }

                        // Ignore pong acks and connection welcome frames
                        if (data.type === 'pong' || data.type === 'connection') {
                            return;
                        }

                        // Handle auth errors returned in frame
                        if (data.error && data.error.includes('Unauthorized')) {
                            console.warn('[WebSocket] Server reported unauthorized token');
                            return;
                        }

                        // Process notification payload
                        const eventPayload = (data.payload || data) as Record<string, unknown>;
                        const eventType = data.type || 'notification';
                        const eventId = String(
                            data.id ||
                            eventPayload.id ||
                            `${eventType}-${eventPayload.created_at || Date.now()}`
                        );

                        // Deduplicate events to prevent double processing
                        if (processedEventIds.current.has(eventId)) {
                            return;
                        }
                        processedEventIds.current.add(eventId);

                        // Keep deduplication set bounded to recent 200 items
                        if (processedEventIds.current.size > 200) {
                            const firstItem = processedEventIds.current.values().next().value;
                            if (firstItem) processedEventIds.current.delete(firstItem);
                        }

                        const title = (eventPayload.title as string) || eventType.replace(/_/g, ' ').toUpperCase();
                        const message =
                            (eventPayload.message as string) ||
                            (eventPayload.content as string) ||
                            'New notification on Suqafuran';

                        // 1. Play audio chime tone
                        playNotificationSound();

                        // 2. Deliver browser native push notification
                        showPushNotification(title, message);

                        // 3. Update realtime Zustand store for in-app toasts & badge
                        useRealtimeStore.getState().pushEvent({
                            type: eventType,
                            payload: eventPayload,
                            timestamp: data.timestamp || (eventPayload.created_at as string) || new Date().toISOString(),
                        });
                    } catch {
                        // Ignore non-json frames
                    }
                };

                ws.onclose = (event) => {
                    if (connectionTimeoutTimer.current) {
                        clearTimeout(connectionTimeoutTimer.current);
                        connectionTimeoutTimer.current = null;
                    }
                    if (pingTimer.current) {
                        clearInterval(pingTimer.current);
                        pingTimer.current = null;
                    }

                    useRealtimeStore.getState().setConnected(false);
                    const reason = event.reason || 'No reason provided';
                    console.log(`[WebSocket] Closed (code: ${event.code}, reason: ${reason})`);

                    if (cancelled) return;

                    // Stop reconnecting on authentication failure (1008 Policy Violation or 4401 Unauthorized)
                    if (event.code === 1008 || event.code === 4401) {
                        console.warn('[WebSocket] Authentication rejected by server. Stopping reconnection.');
                        return;
                    }

                    // Capped exponential backoff with jitter
                    if (reconnectAttempt.current < MAX_RECONNECT_ATTEMPTS) {
                        const baseDelay = Math.min(
                            INITIAL_RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempt.current),
                            MAX_RECONNECT_DELAY_MS
                        );
                        const jitter = Math.floor(Math.random() * 500);
                        const delay = baseDelay + jitter;
                        reconnectAttempt.current++;
                        console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempt.current}/${MAX_RECONNECT_ATTEMPTS})`);
                        reconnectTimer.current = setTimeout(connect, delay);
                    } else {
                        console.warn('[WebSocket] Maximum reconnection attempts reached.');
                    }
                };

                ws.onerror = () => {
                    if (connectionTimeoutTimer.current) {
                        clearTimeout(connectionTimeoutTimer.current);
                        connectionTimeoutTimer.current = null;
                    }
                    // ws.onclose will be invoked immediately after onerror by the browser
                };
            } catch (err) {
                if (!cancelled && reconnectAttempt.current < MAX_RECONNECT_ATTEMPTS) {
                    const delay = Math.min(INITIAL_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempt.current), MAX_RECONNECT_DELAY_MS);
                    reconnectAttempt.current++;
                    reconnectTimer.current = setTimeout(connect, delay);
                }
            }
        }

        connect();

        return () => {
            cancelled = true;
            if (connectionTimeoutTimer.current) {
                clearTimeout(connectionTimeoutTimer.current);
                connectionTimeoutTimer.current = null;
            }
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
                reconnectTimer.current = null;
            }
            if (pingTimer.current) {
                clearInterval(pingTimer.current);
                pingTimer.current = null;
            }
            if (socketRef.current) {
                socketRef.current.close(1000, "Component unmounted");
                socketRef.current = null;
            }
            useRealtimeStore.getState().setConnected(false);
        };
    }, [isAuthenticated, token]);

    return null;
}
