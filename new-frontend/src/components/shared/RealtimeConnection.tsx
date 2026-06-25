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

    useEffect(() => {
        if (!isAuthenticated || !token) {
            socketRef.current?.close();
            return;
        }

        let cancelled = false;

        function connect() {
            if (cancelled) return;
            const ws = new WebSocket(buildSocketUrl(token as string));
            socketRef.current = ws;

            ws.onopen = () => useRealtimeStore.getState().setConnected(true);

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

            ws.onclose = () => {
                useRealtimeStore.getState().setConnected(false);
                if (!cancelled) {
                    reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
                }
            };

            ws.onerror = () => ws.close();
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
