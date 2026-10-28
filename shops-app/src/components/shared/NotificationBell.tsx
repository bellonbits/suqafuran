"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useRealtimeStore } from '../../store/useRealtime';
import { useAuthStore } from '../../store/useAuth';
import { API_BASE_URL } from '../../services/api';

function formatEventTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [hasPushPermission, setHasPushPermission] = useState<boolean>(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            return Notification.permission === 'granted';
        }
        return false;
    });

    const { events } = useRealtimeStore();
    const unreadCount = events.length;

    const handleClearAll = async () => {
        setIsClearing(true);
        try {
            const token = useAuthStore.getState().token;
            if (token) {
                // 1. Permanently delete from database so refresh never restores them
                await fetch(`${API_BASE_URL}/notifications/clear-all`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                // 2. Mark all as read as compatibility fallback
                await fetch(`${API_BASE_URL}/notifications/read-all`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }
            useRealtimeStore.getState().setEvents([]);
        } catch (error) {
            console.error('[Notifications] Failed to clear all:', error);
        } finally {
            setIsClearing(false);
        }
    };

    const handleEnablePush = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            try {
                const res = await Notification.requestPermission();
                setHasPushPermission(res === 'granted');
            } catch {
                // Ignore
            }
        }
    };

    const handleNotificationClick = (event: any) => {
        setIsOpen(false);
        const payload = (event.payload || {}) as Record<string, any>;
        const actionUrl = payload.action_url || payload.actionUrl;
        if (actionUrl) {
            router.push(actionUrl);
        } else if (event.type === 'message' && payload.sender_id) {
            router.push(`/messages?userId=${payload.sender_id}`);
        } else if (payload.listing_id) {
            router.push(`/listings/${payload.listing_id}`);
        } else if (payload.order_id) {
            router.push(`/orders`);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                title="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {Math.min(unreadCount, 9)}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-950 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 z-50 max-h-96 overflow-y-auto">
                        <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {events.length > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        disabled={isClearing}
                                        className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                        title="Clear all notifications"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        {isClearing ? 'Clearing...' : 'Clear all'}
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 p-0.5"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {!hasPushPermission && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
                            <div className="p-3 bg-orange-50/80 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-900/50 flex items-center justify-between text-xs">
                                <span className="text-orange-900 dark:text-orange-200 font-medium text-[11px]">
                                    Enable push notifications
                                </span>
                                <button
                                    onClick={handleEnablePush}
                                    className="px-2.5 py-1 bg-orange-600 text-white text-[11px] font-bold rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Enable
                                </button>
                            </div>
                        )}

                        {events.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-8 h-8 text-gray-300 dark:text-neutral-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-neutral-300">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                                {events.slice(0, 15).map((event, idx) => {
                                    const payload = (event.payload || {}) as Record<string, any>;
                                    const displayTitle = payload.title || event.type.replace(/_/g, ' ');
                                    const displayMsg = payload.message || payload.content || 'New update received';
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleNotificationClick(event)}
                                            className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer"
                                        >
                                            <p className="text-xs font-bold text-gray-900 dark:text-white capitalize">
                                                {displayTitle}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-neutral-300 mt-1 line-clamp-2">
                                                {displayMsg}
                                            </p>
                                            <p className="text-[10px] text-gray-400 dark:text-neutral-400 mt-2 font-medium">
                                                {formatEventTime(event.timestamp)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
