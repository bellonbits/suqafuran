import React from 'react';
import { cn } from '../../utils/cn';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface BoardStatCardProps {
  label: string;
  value: string | number;
  delta?: string | number;
  deltaTone?: 'positive' | 'negative' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
  caption?: string;
  onClick?: () => void;
  className?: string;
}

export const BoardStatCard: React.FC<BoardStatCardProps> = ({
  label,
  value,
  delta,
  deltaTone = 'positive',
  icon: Icon,
  caption,
  onClick,
  className,
}) => {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all duration-200 flex flex-col justify-between",
        isClickable && "cursor-pointer hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 truncate max-w-[180px]">
          {label}
        </span>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {value}
        </div>

        {(delta !== undefined || caption) && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            {delta !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0",
                  deltaTone === 'positive' && "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
                  deltaTone === 'negative' && "bg-rose-50 text-rose-700 border border-rose-200/60",
                  deltaTone === 'neutral' && "bg-slate-100 text-slate-600"
                )}
              >
                {deltaTone === 'positive' && <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />}
                {deltaTone === 'negative' && <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />}
                {deltaTone === 'neutral' && <Minus className="w-3 h-3" />}
                <span>{delta}</span>
              </span>
            )}
            {caption && (
              <span className="text-slate-500 text-[11px] truncate">
                {caption}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardStatCard;

