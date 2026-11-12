"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, CheckCheck, Settings, ShoppingBag, MessageSquare, ShieldCheck } from 'lucide-react';
import { useRealtimeStore, RealtimeEvent } from '../../store/useRealtime';
import { useAuthStore } from '../../store/useAuth';
import { API_BASE_URL } from '../../services/api';
import { parseServerDate } from '../../utils/date';
import { SenderAvatar, VerifiedBadge } from './SenderAvatar';

function formatRelativeTime(isoString?: string | null): string {
    if (!isoString) return '';
    const date = parseServerDate(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) {
        const mins = Math.max(1, Math.floor(diffSec / 60));
        return `${mins} ${mins === 1 ? 'Minute' : 'Minutes'} Ago`;
    }
    if (diffSec < 86400) {
        const hrs = Math.floor(diffSec / 3600);
        return `${hrs} ${hrs === 1 ? 'Hour' : 'Hours'} Ago`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return `${date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

interface ProcessedNotification {
    id: string | number;
    senderName: string;
    actionText: string;
    tag?: string | null;
    avatar?: string | null;
    avatarBg: string;
    avatarInitials: string;
    time: string;
    isUnread: boolean;
    isVerified?: boolean;
    senderId?: number | null;
    type: string;
    actionUrl?: string;
    rawEvent: RealtimeEvent;
}

function processNotificationEvent(event: RealtimeEvent, idx: number): ProcessedNotification {
    const payload = (event.payload || {}) as Record<string, any>;
    const eventType = (event.type || '').toLowerCase();
    const isMessage = eventType.includes('message') || Boolean(payload.sender_id);

    let senderName = payload.sender_name || payload.sender || payload.from_user_name || payload.from_name || 'Suqafuran';
    let actionText = '';
    let tag: string | null = null;
    let avatar = payload.avatar || payload.sender_avatar || payload.profile_image || payload.sender_profile || null;
    let isVerified = Boolean(payload.sender_verified || payload.is_verified);
    let senderId = payload.sender_id ? Number(payload.sender_id) : null;
    let avatarBg = 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300';
    let actionUrl = payload.action_url || payload.actionUrl;

    if (isMessage) {
        let rawMsg = payload.content || payload.message || payload.text || 'sent you a message';
        if (typeof rawMsg === 'string') {
            if (senderName) {
                const senderPattern = new RegExp(`^New message from\\s*${senderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[:\\s"']*`, 'i');
                rawMsg = rawMsg.replace(senderPattern, '');
            }
            rawMsg = rawMsg
                .replace(/^New message from [^:\n\r"]+:\s*["']?/i, '')
                .replace(/^New message from [^:\n\r"]+["']?/i, '')
                .replace(/^[:\s"'\-]+/, '')
                .replace(/["']\s*$/, '')
                .trim();

            if (rawMsg.includes('[IMAGE]:') || /res\.cloudinary\.com/i.test(rawMsg)) {
                actionText = 'sent a photo';
            } else if (rawMsg.includes('[PRODUCT_IMAGE]:') || rawMsg.includes('🛍️ INQUIRY:') || /#ORD-/i.test(rawMsg)) {
                actionText = 'sent a product inquiry';
                tag = '🛍️ Inquiry';
            } else if (rawMsg.includes('[VOICE')) {
                actionText = 'sent a voice note';
            } else {
                actionText = `sent a message: "${rawMsg.slice(0, 70)}${rawMsg.length > 70 ? '...' : ''}"`;
            }
        } else {
            actionText = 'sent you a message';
        }

        avatarBg = 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200';
        if (!actionUrl && payload.sender_id) {
            actionUrl = `/messages?userId=${payload.sender_id}`;
        }
    } else if (eventType.includes('order') || eventType.includes('deal') || payload.order_id) {
        senderName = payload.title || 'Order Update';
        actionText = payload.message || 'has updated order status';
        tag = 'Order';
        avatarBg = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200';
        if (!actionUrl) actionUrl = '/orders';
    } else if (eventType.includes('verify') || eventType.includes('security')) {
        senderName = 'Suqafuran Security';
        actionText = payload.message || 'has updated your account verification';
        tag = 'Account';
        avatarBg = 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200';
    } else {
        senderName = payload.title || eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        actionText = payload.message || 'has sent an update';
    }

    const initials = senderName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'SQ';
    const time = formatRelativeTime(event.timestamp || payload.created_at);

    return {
        id: payload.id || `notif-${idx}-${event.timestamp || Date.now()}`,
        senderName,
        actionText,
        tag,
        avatar,
        avatarBg,
        avatarInitials: initials,
        time,
        isUnread: payload.is_read !== true && payload.status !== 'read',
        isVerified,
        senderId,
        type: eventType,
        actionUrl,
        rawEvent: event,
    };
}

export function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const { events } = useRealtimeStore();
    const unreadCount = events.length;

    const handleClearAll = async () => {
        setIsClearing(true);
        try {
            const token = useAuthStore.getState().token;
            if (token) {
                // Permanently delete from database so refresh never restores them
                await fetch(`${API_BASE_URL}/notifications/clear-all`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }).catch(() => null);

                // Compatibility fallback
                await fetch(`${API_BASE_URL}/notifications/read-all`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }).catch(() => null);
            }
            useRealtimeStore.getState().setEvents([]);
        } catch (error) {
            console.error('[Notifications] Failed to clear all:', error);
        } finally {
            setIsClearing(false);
        }
    };

    const handleNotificationClick = (item: ProcessedNotification) => {
        setIsOpen(false);
        if (item.actionUrl) {
            router.push(item.actionUrl);
        } else {
            const payload = (item.rawEvent.payload || {}) as Record<string, any>;
            if (payload.sender_id) {
                router.push(`/messages?userId=${payload.sender_id}`);
            } else if (payload.listing_id) {
                router.push(`/listings/${payload.listing_id}`);
            } else if (payload.order_id) {
                router.push('/orders');
            }
        }
    };

    const handleAvatarClick = (e: React.MouseEvent, item: ProcessedNotification) => {
        e.stopPropagation();
        setIsOpen(false);
        if (item.senderId) {
            router.push(`/messages?userId=${item.senderId}`);
        } else if (item.actionUrl) {
            router.push(item.actionUrl);
        }
    };

    // Group notifications into Today, Yesterday, and Earlier
    const now = new Date();
    const todayStr = now.toDateString();
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toDateString();

    const todayItems: ProcessedNotification[] = [];
    const yesterdayItems: ProcessedNotification[] = [];
    const earlierItems: ProcessedNotification[] = [];

    events.forEach((ev, idx) => {
        const item = processNotificationEvent(ev, idx);
        const payload = (ev.payload || {}) as Record<string, any>;
        const d = parseServerDate(ev.timestamp || payload.created_at);
        const dStr = d.toDateString();

        if (dStr === todayStr) {
            todayItems.push(item);
        } else if (dStr === yestStr) {
            yesterdayItems.push(item);
        } else {
            earlierItems.push(item);
        }
    });

    return (
        <div className="relative">
            {/* Bell Trigger Button */}
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

            {/* Modal / Card Over Header */}
            {isOpen && (
                <>
                    {/* Backdrop strictly on top of header (z-[999998]) */}
                    <div
                        className="fixed inset-0 z-[999998] transition-opacity bg-slate-900/40 backdrop-blur-xs"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Notification Card Container strictly on top (z-[999999]) */}
                    <div
                        className="fixed inset-x-3 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2.5 w-[calc(100vw-1.5rem)] sm:w-[450px] max-w-[460px] bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-neutral-800 z-[999999] max-h-[82vh] sm:max-h-[560px] overflow-hidden flex flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            top: typeof window !== 'undefined' && window.innerWidth < 640 ? 'calc(env(safe-area-inset-top, 0px) + 60px)' : undefined,
                        }}
                    >
                        {/* 1. Header (Notification title + close button) */}
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-[#111827] shrink-0">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                Notification
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 2. Sub-header ({count} Unread + Mark as Read) */}
                        <div className="px-5 py-3 border-b border-gray-100/80 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-[#111827] shrink-0 text-xs">
                            <span className="text-gray-500 dark:text-neutral-400 font-medium">
                                {unreadCount > 0 ? `${unreadCount} Unread` : 'All read'}
                            </span>
                            {events.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    disabled={isClearing}
                                    className="text-[#0284c7] hover:text-[#0369a1] font-semibold hover:underline cursor-pointer disabled:opacity-50 transition-colors"
                                >
                                    {isClearing ? 'Marking...' : 'Mark as Read'}
                                </button>
                            )}
                        </div>

                        {/* 3. Notification List grouped by date */}
                        <div className="flex-1 overflow-y-auto px-2 py-2">
                            {events.length === 0 ? (
                                <div className="py-14 text-center space-y-2">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-neutral-900 flex items-center justify-center mx-auto text-gray-400">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-neutral-200">No notifications yet</p>
                                    <p className="text-xs text-gray-400">We'll alert you here when deals, orders, or messages arrive.</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {/* Section: Today */}
                                    {todayItems.length > 0 && (
                                        <div>
                                            <div className="relative my-2.5 flex items-center justify-center">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-gray-100 dark:border-neutral-800" />
                                                </div>
                                                <span className="relative bg-white dark:bg-[#111827] px-3 text-[11px] font-medium text-gray-400">
                                                    Today
                                                </span>
                                            </div>
                                            <div className="space-y-0.5">
                                                {todayItems.map((item) => renderNotificationRow(item, handleNotificationClick, handleAvatarClick))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Section: Yesterday */}
                                    {yesterdayItems.length > 0 && (
                                        <div>
                                            <div className="relative my-2.5 flex items-center justify-center">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-gray-100 dark:border-neutral-800" />
                                                </div>
                                                <span className="relative bg-white dark:bg-[#111827] px-3 text-[11px] font-medium text-gray-400">
                                                    Yesterday
                                                </span>
                                            </div>
                                            <div className="space-y-0.5">
                                                {yesterdayItems.map((item) => renderNotificationRow(item, handleNotificationClick, handleAvatarClick))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Section: Earlier */}
                                    {earlierItems.length > 0 && (
                                        <div>
                                            <div className="relative my-2.5 flex items-center justify-center">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-gray-100 dark:border-neutral-800" />
                                                </div>
                                                <span className="relative bg-white dark:bg-[#111827] px-3 text-[11px] font-medium text-gray-400">
                                                    Earlier
                                                </span>
                                            </div>
                                            <div className="space-y-0.5">
                                                {earlierItems.map((item) => renderNotificationRow(item, handleNotificationClick, handleAvatarClick))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function renderNotificationRow(
    item: ProcessedNotification,
    onClick: (item: ProcessedNotification) => void,
    onAvatarClick?: (e: React.MouseEvent, item: ProcessedNotification) => void
) {
    return (
        <div
            key={item.id}
            onClick={() => onClick(item)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50/90 dark:hover:bg-neutral-800/60 transition-all cursor-pointer group active:scale-[0.99]"
        >
            {/* Left: Creative Profile Avatar with Corner Badge & Fallback */}
            <SenderAvatar
                avatar={item.avatar}
                name={item.senderName}
                type={item.type}
                isVerified={item.isVerified}
                size="md"
                onClick={onAvatarClick ? (e) => onAvatarClick(e, item) : undefined}
            />

            {/* Middle: Content */}
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-neutral-300 leading-snug">
                    <span className="font-bold text-gray-900 dark:text-white mr-1 inline-flex items-center gap-1">
                        {item.senderName}
                        {item.isVerified && <VerifiedBadge />}
                    </span>
                    <span className="text-gray-600 dark:text-neutral-300">
                        {item.actionText}
                    </span>
                    {item.tag && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-[10px] font-medium ml-1.5 align-middle">
                            {item.tag}
                        </span>
                    )}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-neutral-400 mt-0.5">
                    {item.time}
                </p>
            </div>

            {/* Right: Unread Cyan Dot indicator */}
            {item.isUnread && (
                <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 shadow-xs" title="Unread" />
            )}
        </div>
    );
}
