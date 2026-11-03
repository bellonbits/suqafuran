import React from 'react';
import { cn } from '../../utils/cn';

export type MarketplaceStatus =
  | 'active'
  | 'live'
  | 'approved'
  | 'pending'
  | 'under_review'
  | 'rejected'
  | 'needs_changes'
  | 'inactive'
  | 'paused'
  | 'sold'
  | 'verified'
  | 'fraud'
  | 'banned'
  | 'suspended'
  | string;

export interface StatusBadgeProps {
  status: MarketplaceStatus;
  label?: string;
  className?: string;
}

interface StatusConfig {
  label: string;
  dotColor: string;
  badgeStyle: string;
}

const STATUS_DICTIONARY: Record<string, StatusConfig> = {
  active: { label: 'Live', dotColor: 'bg-emerald-500', badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  live: { label: 'Live', dotColor: 'bg-emerald-500', badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  approved: { label: 'Approved', dotColor: 'bg-emerald-500', badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  verified: { label: 'Verified', dotColor: 'bg-sky-500', badgeStyle: 'bg-sky-50 text-sky-800 border-sky-200' },

  pending: { label: 'Under Review', dotColor: 'bg-amber-500', badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200' },
  under_review: { label: 'Under Review', dotColor: 'bg-amber-500', badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200' },

  rejected: { label: 'Needs Changes', dotColor: 'bg-rose-500', badgeStyle: 'bg-rose-50 text-rose-800 border-rose-200' },
  needs_changes: { label: 'Needs Changes', dotColor: 'bg-rose-500', badgeStyle: 'bg-rose-50 text-rose-800 border-rose-200' },
  fraud: { label: 'High Risk', dotColor: 'bg-rose-600', badgeStyle: 'bg-rose-100 text-rose-900 border-rose-300' },
  banned: { label: 'Banned', dotColor: 'bg-rose-600', badgeStyle: 'bg-rose-100 text-rose-900 border-rose-300' },
  suspended: { label: 'Suspended', dotColor: 'bg-rose-600', badgeStyle: 'bg-rose-100 text-rose-900 border-rose-300' },

  inactive: { label: 'Paused', dotColor: 'bg-slate-400', badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200' },
  paused: { label: 'Paused', dotColor: 'bg-slate-400', badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200' },

  sold: { label: 'Sold', dotColor: 'bg-purple-500', badgeStyle: 'bg-purple-50 text-purple-800 border-purple-200' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => {
  const normalized = (status || '').toLowerCase().replace(/\s+/g, '_');
  const config = STATUS_DICTIONARY[normalized] || {
    label: label || status || 'Unknown',
    dotColor: 'bg-slate-400',
    badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
        config.badgeStyle,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotColor)} />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
};

export default StatusBadge;

