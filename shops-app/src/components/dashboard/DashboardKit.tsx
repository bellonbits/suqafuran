import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

/* ==========================================================================
   Dashboard Design Kit (Adhering to dashboard-design skill standards)
   - Quiet, calm, wordless, honest, tabular figures, goal beside the number
   ========================================================================== */

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: {
    percent: number;
    baseline?: string; // e.g. "vs prev 7d"
    isGood?: boolean; // defaults to percent >= 0, can be inverted for cost/churn
  };
  icon?: React.ReactNode;
  entityType?: 'money' | 'traffic' | 'volume' | 'neutral';
  goal?: {
    current: number;
    target: number;
    unit?: string;
  };
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  delta,
  icon,
  entityType = 'neutral',
  goal,
  onClick,
}) => {
  const isPositive = delta ? (delta.isGood ?? delta.percent >= 0) : true;
  const isZeroDelta = delta && delta.percent === 0;

  const entityIconColor = {
    money: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50',
    traffic: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-100 dark:border-sky-900/50',
    volume: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
    neutral: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/60',
  }[entityType];

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {label}
        </span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border text-sm shrink-0 ${entityIconColor}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
          {value}
        </div>
      </div>

      {/* Delta and Baseline */}
      {delta && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
              isZeroDelta
                ? 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                : isPositive
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50'
            }`}
          >
            {!isZeroDelta && (
              isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
            )}
            {delta.percent > 0 ? `+${delta.percent}%` : `${delta.percent}%`}
          </span>
          <span className="text-slate-400 dark:text-slate-400 text-[11px]">
            {delta.baseline || 'vs prev period'}
          </span>
        </div>
      )}

      {/* Goal bullet bar if applicable */}
      {goal && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] mb-1 tabular-nums text-slate-500 dark:text-slate-400">
            <span>Goal: {goal.target.toLocaleString()}{goal.unit ? ` ${goal.unit}` : ''}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(100, Math.round((goal.current / goal.target) * 100))}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(2, (goal.current / goal.target) * 100))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   Attention Banner (Monitor First — Salience on what needs action)
   ========================================================================== */

export interface AttentionItem {
  id: string | number;
  label: string;
  count: number;
  actionText: string;
  onAction: () => void;
  severity?: 'critical' | 'warning' | 'info';
}

export const AttentionBanner: React.FC<{ items: AttentionItem[] }> = ({ items }) => {
  const activeItems = items.filter((i) => i.count > 0);
  if (activeItems.length === 0) return null;

  return (
    <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
            Requires Attention ({activeItems.reduce((acc, i) => acc + i.count, 0)})
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {activeItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-800/40 shadow-xs"
          >
            <div>
              <div className="text-lg font-black tabular-nums text-slate-900 dark:text-white leading-none">
                {item.count}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                {item.label}
              </div>
            </div>
            <button
              onClick={item.onAction}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs active:scale-95"
            >
              {item.actionText}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================================================================
   Calm Pill Range Selector
   ========================================================================== */

export const PeriodSelector: React.FC<{
  selected: string;
  onChange: (period: string) => void;
  options?: Array<{ key: string; label: string }>;
}> = ({
  selected,
  onChange,
  options = [
    { key: '7d', label: '7D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: 'ytd', label: 'YTD' },
  ],
}) => {
  return (
    <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            selected === opt.key
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

/* ==========================================================================
   Live Sync Status Indicator
   ========================================================================== */

export const LiveIndicator: React.FC<{ label?: string }> = ({ label = 'Live' }) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span>{label}</span>
    </div>
  );
};

/* ==========================================================================
   Slim Share Bar (3px track along row edge)
   ========================================================================== */

export const SlimShareBar: React.FC<{ percent: number; color?: string }> = ({
  percent,
  color = 'bg-slate-900 dark:bg-white',
}) => {
  return (
    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
};
