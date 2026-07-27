import React from 'react';
import { ShieldCheck, Shield, Star, Award } from 'lucide-react';
import { cn } from '../utils/cn';

export type TrustTier = 'NEW' | 'ESTABLISHED' | 'VERIFIED' | 'TRUSTED';

interface VerifiedBadgeProps {
    tier: TrustTier;
    score?: number;
    showScore?: boolean;
    className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ 
    tier, 
    score, 
    showScore = false,
    className 
}) => {
    const config = {
        TRUSTED: {
            label: 'Platinum Seller',
            icon: Award,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
            iconColor: 'text-indigo-500',
            desc: 'Highly Trusted'
        },
        VERIFIED: {
            label: 'Gold Seller',
            icon: Star,
            color: 'text-amber-600 bg-amber-50 border-amber-100',
            iconColor: 'text-amber-500',
            desc: 'Verified'
        },
        ESTABLISHED: {
            label: 'Silver Seller',
            icon: ShieldCheck,
            color: 'text-blue-600 bg-blue-50 border-blue-100',
            iconColor: 'text-blue-500',
            desc: 'Established'
        },
        NEW: {
            label: 'Bronze',
            icon: Shield,
            color: 'text-gray-600 bg-gray-50 border-gray-100',
            iconColor: 'text-gray-400',
            desc: 'New Seller'
        }
    };

    const active = config[tier] || config.NEW;
    const Icon = active.icon;

    return (
        <div className={cn("inline-flex flex-col gap-1", className)}>
            <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
                active.color
            )}>
                <Icon size={12} className={active.iconColor} />
                {active.label}
                {showScore && score !== undefined && (
                    <span className="ml-1 opacity-60 border-l border-current pl-1">{score}</span>
                )}
            </div>
        </div>
    );
};
