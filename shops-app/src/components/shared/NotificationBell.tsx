"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, CheckCheck, Settings, ShoppingBag, MessageSquare, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useRealtimeStore } from '../../store/useRealtime';
import { useAuthStore } from '../../store/useAuth';
import { API_BASE_URL } from '../../services/api';

function formatEventTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getEventIconAndBadge(event: any) {
    const type = (event.type || '').toLowerCase();
    const payload = (event.payload || {}) as Record<string, any>;

    if (payload.avatar || payload.sender_avatar) {
        return {
            avatar: payload.avatar || payload.sender_avatar,
            badge: null
        };
    }

    if (type.includes('order') || type.includes('deal') || payload.order_id) {
        return {
            icon: ShoppingBag,
            bgColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
            badge: 'Completed',
            badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
        };
    }
    if (type.includes('message') || payload.sender_id) {
        return {
            icon: MessageSquare,
            bgColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
            badge: 'Message',
            badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200'
        };
    }
    if (type.includes('verify') || type.includes('security')) {
        return {
            icon: ShieldCheck,
            bgColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
            badge: 'Account',
            badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200'
        };
    }
    return {
        icon: Bell,
        bgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        badge: 'Notice',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
    };
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
                className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors relative flex items-center justify-center"
                title="Notifications"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Clean backdrop conforming to Part 2 specifications: rgba(15, 23, 42, 0.35) with 8px blur */}
                    <div
                        className="fixed inset-0 z-40 transition-opacity"
                        style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.35)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                        }}
                        onClick={() => setIsOpen(false)}
                    />
                    {/* Clean solid modal panel without pseudo-elements or nested blurry overlays */}
                    <div 
                        className="fixed inset-x-3 top-14 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-[420px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#0B132B] rounded-[24px] border border-[#E5E7EB] dark:border-[#1E293B] z-50 max-h-[80vh] sm:max-h-[520px] overflow-hidden flex flex-col"
                        style={{
                            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.16)',
                            opacity: 1,
                        }}
                    >
                        {/* Header */}
                        <div className="px-5 py-3.5 border-b border-[#E5E7EB] dark:border-[#1E293B] flex justify-between items-center bg-white dark:bg-[#0B132B] shrink-0 gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white whitespace-nowrap">
                                    Notifications
                                </h3>
                                {unreadCount > 0 && (
                                    <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 shrink-0">
                                        ({unreadCount})
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {events.length > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        disabled={isClearing}
                                        className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap px-1.5 py-0.5 rounded-md hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                        title="Clear all notifications"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                                        <span className="whitespace-nowrap">{isClearing ? 'Clearing...' : 'Mark all'}</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => { setIsOpen(false); router.push('/settings/notifications'); }}
                                    className="text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors shrink-0"
                                    title="Notification settings"
                                    aria-label="Settings"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors shrink-0"
                                    aria-label="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Push Permission Prompt if default */}
                        {!hasPushPermission && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
                            <div className="px-4 py-2.5 bg-orange-50/80 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-900/50 flex items-center justify-between text-xs shrink-0">
                                <span className="text-orange-900 dark:text-orange-200 font-semibold text-[11px]">
                                    Enable push alerts for deals &amp; chats
                                </span>
                                <button
                                    onClick={handleEnablePush}
                                    className="px-2.5 py-1 bg-orange-600 text-white text-[11px] font-bold rounded-full hover:bg-orange-700 transition-colors shadow-sm"
                                >
                                    Enable
                                </button>
                            </div>
                        )}

                        {/* Section Header */}
                        {events.length > 0 && (
                            <div className="px-5 py-2 bg-slate-50/70 dark:bg-neutral-900/40 border-b border-gray-100 dark:border-neutral-800 text-[11px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider shrink-0">
                                Today
                            </div>
                        )}

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto">
                            {events.length === 0 ? (
                                <div className="p-10 text-center space-y-2">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center mx-auto text-gray-400">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-800 dark:text-neutral-200">No notifications yet</p>
                                    <p className="text-[11px] text-gray-400 dark:text-neutral-400">We'll alert you here when deals or messages arrive.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-neutral-800/60">
                                    {events.slice(0, 15).map((event, idx) => {
                                        const payload = (event.payload || {}) as Record<string, any>;
                                        const displayTitle = payload.title || event.type.replace(/_/g, ' ');
                                        const rawMsg = payload.message || payload.content || 'New update received';
                                        let displayMsg = typeof rawMsg === 'string' ? rawMsg : String(rawMsg || '');
                                        if (displayMsg) {
                                            displayMsg = displayMsg
                                                .replace(/\[IMAGE\]:[^\s"']+/gi, '📷 Sent a photo')
                                                .replace(/\[PRODUCT_IMAGE\]:[^\s"']+/gi, '🛍️ Product Inquiry')
                                                .replace(/🛍️\s*INQUIRY:[^\n\r]+/gi, '🛍️ Product Inquiry')
                                                .replace(/:\s*["'\s\r\n]*📷 Sent a photo["'\s\r\n]*/gi, ': 📷 Sent a photo')
                                                .replace(/:\s*["'\s\r\n]*🛍️ Product Inquiry["'\s\r\n]*/gi, ': 🛍️ Product Inquiry')
                                                .replace(/:\s*["'\s\r\n]*""?/gi, '')
                                                .replace(/:\s*["']\s*$/, '')
                                                .trim();
                                            // If the message is just a photo or inquiry, simplify it cleanly
                                            if (displayMsg.includes('📷 Sent a photo')) {
                                                displayMsg = '📷 Sent a photo';
                                            } else if (displayMsg.includes('🛍️ Product Inquiry')) {
                                                displayMsg = '🛍️ Product inquiry';
                                            }
                                        }
                                        const { icon: EventIcon, bgColor, badge, badgeColor, avatar } = getEventIconAndBadge(event);

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => handleNotificationClick(event)}
                                                className="px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-neutral-900/60 transition-colors cursor-pointer flex items-start gap-3"
                                            >
                                                {/* Left Icon / Avatar */}
                                                <div className="shrink-0 mt-0.5">
                                                    {avatar ? (
                                                        <img
                                                            src={avatar}
                                                            alt=""
                                                            className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-neutral-800"
                                                        />
                                                    ) : (
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${bgColor}`}>
                                                            {EventIcon && <EventIcon className="w-4 h-4" />}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Main Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-xs font-bold text-gray-900 dark:text-white capitalize leading-snug">
                                                            {displayTitle}
                                                        </p>
                                                        <span className="text-[10px] text-gray-400 dark:text-neutral-400 font-semibold whitespace-nowrap shrink-0">
                                                            {formatEventTime(event.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-600 dark:text-neutral-300 mt-0.5 line-clamp-2 leading-relaxed">
                                                        {displayMsg}
                                                    </p>
                                                    {badge && (
                                                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${badgeColor}`}>
                                                            {badge}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
