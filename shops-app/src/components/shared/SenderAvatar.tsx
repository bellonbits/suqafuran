"use client";

import React, { useState } from 'react';
import { MessageSquare, ShoppingBag, ShieldCheck, Bell, Check } from 'lucide-react';

const GRADIENTS = [
    'from-indigo-500 to-purple-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-violet-600 to-fuchsia-600',
    'from-teal-500 to-cyan-600',
    'from-blue-600 to-indigo-700',
];

function getGradientForName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % GRADIENTS.length;
    return GRADIENTS[idx];
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'SQ';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface SenderAvatarProps {
    avatar?: string | null;
    name: string;
    type?: string;
    isVerified?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showBadge?: boolean;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export function SenderAvatar({
    avatar,
    name,
    type = 'message',
    isVerified = false,
    size = 'md',
    showBadge = true,
    className = '',
    onClick,
}: SenderAvatarProps) {
    const [imgFailed, setImgFailed] = useState(false);

    const sizeClasses = {
        sm: 'w-8 h-8 text-[11px]',
        md: 'w-10 h-10 text-xs',
        lg: 'w-12 h-12 text-sm',
    }[size];

    const badgeSizes = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-4.5 h-4.5',
    }[size];

    const iconSizes = {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
    }[size];

    const gradient = getGradientForName(name);
    const initials = getInitials(name);
    const hasValidPhoto = Boolean(avatar && !imgFailed);

    const eventType = (type || '').toLowerCase();
    const isMsg = eventType.includes('message') || eventType.includes('chat');
    const isOrder = eventType.includes('order') || eventType.includes('deal');
    const isSecurity = eventType.includes('verify') || eventType.includes('security') || eventType.includes('account');

    let badgeBg = 'bg-sky-500';
    let badgeIcon = <MessageSquare className={iconSizes} />;

    if (isOrder) {
        badgeBg = 'bg-emerald-500';
        badgeIcon = <ShoppingBag className={iconSizes} />;
    } else if (isSecurity) {
        badgeBg = 'bg-purple-500';
        badgeIcon = <ShieldCheck className={iconSizes} />;
    } else if (!isMsg) {
        badgeBg = 'bg-amber-500';
        badgeIcon = <Bell className={iconSizes} />;
    }

    return (
        <div
            onClick={onClick}
            className={`relative shrink-0 select-none ${onClick ? 'cursor-pointer group/avatar' : ''} ${className}`}
            title={name}
        >
            {hasValidPhoto ? (
                <div className={`relative ${sizeClasses} rounded-full overflow-hidden ring-2 ring-white dark:ring-[#111827] shadow-sm bg-gray-100 dark:bg-neutral-800 transition-transform duration-200 group-hover/avatar:scale-105`}>
                    <img
                        src={avatar!}
                        alt={name}
                        onError={() => setImgFailed(true)}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>
            ) : (
                <div
                    className={`${sizeClasses} rounded-full bg-gradient-to-tr ${gradient} text-white font-bold flex items-center justify-center tracking-wider shadow-sm ring-2 ring-white dark:ring-[#111827] transition-transform duration-200 group-hover/avatar:scale-105`}
                >
                    {initials}
                </div>
            )}

            {/* Corner Type Indicator Badge */}
            {showBadge && (
                <span
                    className={`absolute -bottom-0.5 -right-0.5 ${badgeSizes} ${badgeBg} text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#111827] shadow-xs`}
                >
                    {badgeIcon}
                </span>
            )}
        </div>
    );
}

export function VerifiedBadge({ className = '' }: { className?: string }) {
    return (
        <span
            className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-sky-500 text-white shrink-0 shadow-xs align-middle ${className}`}
            title="Verified Member"
        >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
        </span>
    );
}

