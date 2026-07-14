"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuth';
import { useRealtimeStore } from '../../store/useRealtime';
import { API_BASE_URL } from '../../services/api';

const RECONNECT_DELAY_MS = 4000;

function buildSocketUrl(token: string): string {
    const wsBase = API_BASE_URL.replace(/^http/, 'ws');
    return `${wsBase}/notifications/ws?token=${encodeURIComponent(token)}`;
}

/**
 * Mounted once at the app root. Keeps a single personal WebSocket connection
 * open for the lifetime of the session and feeds incoming events into
 * useRealtimeStore — the one shared entry point any feature (order tracking,
 * future chat, notification bell) can subscribe to instead of polling.
 */
export function RealtimeConnection() {
    const token = useAuthStore((s) => s.token);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttempt = useRef(0);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            socketRef.current?.close();
            return;
        }

        let cancelled = false;

        function connect() {
            if (cancelled) return;
            try {
                const socketUrl = buildSocketUrl(token as string);
                console.log('[WebSocket] Connecting to:', socketUrl.replace(/token=[^&]*/g, 'token=***'));
                const ws = new WebSocket(socketUrl);
                socketRef.current = ws;

                ws.onopen = () => {
                    console.log('[WebSocket] ✅ Connected successfully');
                    useRealtimeStore.getState().setConnected(true);
                    reconnectAttempt.current = 0;
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data?.type && data?.payload) {
                            useRealtimeStore.getState().pushEvent(data);
                        }
                    } catch {
                        // Non-JSON frame (e.g. a stray ping) — ignore.
                    }
                };

                ws.onclose = (event) => {
                    const reason = event.reason || 'No reason provided';
                    console.log(`[WebSocket] ❌ Closed (code: ${event.code}, reason: ${reason})`);
                    useRealtimeStore.getState().setConnected(false);
                    if (!cancelled && event.code !== 4401) {
                        const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000);
                        reconnectAttempt.current++;
                        console.log(`[WebSocket] 🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempt.current})`);
                        reconnectTimer.current = setTimeout(connect, delay);
                    }
                };

                ws.onerror = (event) => {
                    console.error('[WebSocket] ⚠️ Error event fired');
                    console.error('[WebSocket] Event type:', event.type);
                    console.error('[WebSocket] WebSocket readyState:', ws.readyState, '(0=connecting, 1=open, 2=closing, 3=closed)');
                    ws.close();
                };
            } catch (error) {
                console.error('[WebSocket] ❌ Failed to create WebSocket:', error);
                if (!cancelled) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000);
                    reconnectAttempt.current++;
                    console.log(`[WebSocket] 🔄 Retrying in ${delay}ms`);
                    reconnectTimer.current = setTimeout(connect, delay);
                }
            }
        }

        connect();

        return () => {
            cancelled = true;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            socketRef.current?.close();
        };
    }, [isAuthenticated, token]);

    return null;
}
