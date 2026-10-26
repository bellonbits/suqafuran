"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuth';
import { useRealtimeStore } from '../../store/useRealtime';
import { API_BASE_URL } from '../../services/api';

const RECONNECT_DELAY_MS = 4000;

function buildSocketUrl(token: string): string {
    try {
        const apiUrl = API_BASE_URL;
        const wsBase = apiUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
        return `${wsBase}/notifications/ws?token=${encodeURIComponent(token)}`;
    } catch (error) {
        return '';
    }
}

/**
 * Mounted once at the app root. Keeps a personal WebSocket connection
 * open for the lifetime of the session. If WebSocket connections are blocked
 * locally (e.g. by extensions or browser sandboxes), it automatically falls back
 * to HTTP polling so real-time notifications, unread counts, and toasts
 * continue working seamlessly.
 */
export function RealtimeConnection() {
    const token = useAuthStore((s) => s.token);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectAttempt = useRef(0);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            socketRef.current?.close();
            if (pollTimer.current) clearInterval(pollTimer.current);
            return;
        }

        let cancelled = false;

        async function fetchNotifications() {
            try {
                const res = await fetch(`${API_BASE_URL}/notifications/`, {
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

        function startPollingFallback() {
            if (pollTimer.current) return;
            fetchNotifications();
            pollTimer.current = setInterval(() => {
                if (!cancelled) fetchNotifications();
            }, FALLBACK_POLL_INTERVAL_MS);
        }

        function stopPollingFallback() {
            if (pollTimer.current) {
                clearInterval(pollTimer.current);
                pollTimer.current = null;
            }
        }

        // Fetch initial list of notifications on mount
        fetchNotifications();

        function connect() {
            if (cancelled) return;
            try {
                const socketUrl = buildSocketUrl(token as string);
                if (!socketUrl) {
                    startPollingFallback();
                    return;
                }

                const ws = new WebSocket(socketUrl);
                socketRef.current = ws;

                const connectionTimeout = setTimeout(() => {
                    if (ws.readyState === WebSocket.CONNECTING) {
                        ws.close();
                    }
                }, 8000);

                ws.onopen = () => {
                    clearTimeout(connectionTimeout);
                    console.log('[WebSocket] Connected successfully');
                    useRealtimeStore.getState().setConnected(true);
                    reconnectAttempt.current = 0;
                    stopPollingFallback();
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data?.type === 'notification' && data?.payload) {
                            useRealtimeStore.getState().pushEvent({
                                ...data,
                                timestamp: (data.payload as Record<string, unknown>).created_at as string || new Date().toISOString(),
                            });
                        }
                    } catch {
                        // Non-JSON frame ignored
                    }
                };

                ws.onclose = (event) => {
                    clearTimeout(connectionTimeout);
                    useRealtimeStore.getState().setConnected(false);

                    if (!cancelled) {
                        if (reconnectAttempt.current < 3) {
                            const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 10000);
                            reconnectAttempt.current++;
                            reconnectTimer.current = setTimeout(connect, delay);
                        } else {
                            // Fall back to polling silently when socket cannot connect
                            startPollingFallback();
                        }
                    }
                };

                ws.onerror = () => {
                    clearTimeout(connectionTimeout);
                    ws.close();
                };
            } catch {
                if (!cancelled) {
                    startPollingFallback();
                }
            }
        }

        connect();

        return () => {
            cancelled = true;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            stopPollingFallback();
            socketRef.current?.close();
        };
    }, [isAuthenticated, token]);

    return null;
}
