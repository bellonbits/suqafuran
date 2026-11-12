"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ShoppingBag, ShieldCheck, Bell, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useRealtimeStore } from '../../store/useRealtime';
import { parseServerDate } from '../../utils/date';

interface ToastItem {
    id: string;
    type: string;
    senderName: string;
    avatar?: string | null;
    tag?: string | null;
    message: string;
    actionUrl?: string;
    icon: React.ReactNode;
    avatarBg: string;
}

export function NotificationToast() {
    const router = useRouter();
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const lastEvent = useRealtimeStore((s) => s.lastEvent);

    useEffect(() => {
        if (!lastEvent) return;

        const payload = (lastEvent.payload || {}) as Record<string, any>;
        const eventType = (lastEvent.type || '').toLowerCase();
        const isMessage = eventType.includes('message') || Boolean(payload.sender_id);

        // Smart check: If user is actively chatting with this sender in /messages,
        // don't show a blocking toast banner over their conversation.
        if (typeof window !== 'undefined' && isMessage && payload.sender_id) {
            const isMessagesPath = window.location.pathname.startsWith('/messages');
            const searchParams = new URLSearchParams(window.location.search);
            const activeChatUserId = searchParams.get('userId');
            if (isMessagesPath && activeChatUserId && String(activeChatUserId) === String(payload.sender_id)) {
                return;
            }
        }

        const id = `${lastEvent.type}-${Date.now()}`;
        let senderName = payload.sender_name || payload.sender || payload.from_name || payload.from_user_name || 'Suqafuran';
        let avatar = payload.sender_avatar || payload.avatar || null;
        let tag: string | null = null;
        let message = '';
        let actionUrl = payload.action_url || payload.actionUrl;
        let icon: React.ReactNode = <Bell className="w-5 h-5 text-sky-500" />;
        let avatarBg = 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400';

        if (isMessage) {
            icon = <MessageSquare className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
            avatarBg = 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300';
            tag = 'Chat';

            let rawMsg = payload.content || payload.message || payload.text || 'Sent you a message';
            if (typeof rawMsg === 'string') {
                // Strip redundant "New message from <Name>:" prefix if present
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
                    message = '📷 Sent a photo';
                } else if (rawMsg.includes('[PRODUCT_IMAGE]:') || rawMsg.includes('🛍️ INQUIRY:') || /#ORD-/i.test(rawMsg)) {
                    message = '🛍️ Sent a product inquiry';
                    tag = 'Inquiry';
                } else if (rawMsg.includes('[VOICE')) {
                    message = '🎤 Sent a voice message';
                } else {
                    message = rawMsg || 'Sent you a message';
                }
            } else {
                message = 'Sent you a message';
            }

            if (!actionUrl && payload.sender_id) {
                actionUrl = `/messages?userId=${payload.sender_id}`;
            }
        } else if (eventType.includes('order') || eventType.includes('deal') || payload.order_id) {
            senderName = payload.title || 'Order Update';
            message = payload.message || 'Your order has been updated';
            tag = 'Order';
            icon = <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
            avatarBg = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300';
            if (!actionUrl) actionUrl = '/orders';
        } else if (eventType.includes('verify') || eventType.includes('security')) {
            senderName = payload.title || 'Account Notice';
            message = payload.message || 'Account status updated';
            tag = 'Security';
            icon = <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
            avatarBg = 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300';
        } else {
            senderName = payload.title || eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            message = payload.message || (typeof payload === 'string' ? payload : 'You have a new notification');
        }

        const newToast: ToastItem = {
            id,
            type: lastEvent.type,
            senderName,
            avatar,
            tag,
            message,
            actionUrl,
            icon,
            avatarBg,
        };

        setToasts((prev) => [newToast, ...prev].slice(0, 3));

        const timer = setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5500);

        return () => clearTimeout(timer);
    }, [lastEvent]);

    const handleToastClick = (toast: ToastItem) => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        if (toast.actionUrl) {
            router.push(toast.actionUrl);
        }
    };

    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed inset-x-3 top-3 sm:inset-x-auto sm:right-6 sm:top-4 sm:w-[410px] z-[99999] space-y-2.5 pointer-events-none"
            style={{
                top: 'max(14px, env(safe-area-inset-top, 14px))',
            }}
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    onClick={() => handleToastClick(toast)}
                    className="pointer-events-auto w-full bg-white/98 dark:bg-[#111827]/98 backdrop-blur-xl rounded-2xl p-3 sm:p-3.5 border border-gray-100 dark:border-neutral-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex items-center gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all animate-in slide-in-from-top-4 duration-300 ease-out group"
                >
                    {/* Left: Avatar */}
                    {toast.avatar ? (
                        <img
                            src={toast.avatar}
                            alt={toast.senderName}
                            className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-gray-200 dark:ring-neutral-700"
                        />
                    ) : (
                        <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ring-1 ring-black/5 dark:ring-white/10 ${toast.avatarBg}`}>
                            {toast.senderName.slice(0, 2).toUpperCase()}
                        </div>
                    )}

                    {/* Center: Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                                    {toast.senderName}
                                </span>
                                {toast.tag && (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-300 text-[10px] font-semibold shrink-0">
                                        {toast.tag}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-1">
                                Just now
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                            {toast.message}
                        </p>
                    </div>

                    {/* Right: Unread Cyan Dot & Close Button */}
                    <div className="flex items-center gap-1.5 shrink-0 pl-0.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" title="Unread" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                            }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
