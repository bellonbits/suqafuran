import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AIResponseProps {
  message: string;
  timestamp?: string;
  followups?: string[];
  onSelectFollowup?: (followup: string) => void;
  className?: string;
}

export const AIResponse: React.FC<AIResponseProps> = ({
  message,
  timestamp,
  followups = [],
  onSelectFollowup,
  className = "",
}) => {
  return (
    <div className={`flex items-start gap-2.5 max-w-full ${className}`}>
      {/* Suqafuran AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#00BFFF] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 space-y-2.5">
        <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-4 shadow-xs text-slate-800 dark:text-neutral-100">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
          {timestamp && (
            <span className="block mt-1.5 text-[10px] text-slate-400 text-right">
              {timestamp}
            </span>
          )}
        </div>

        {/* Followup suggestion buttons */}
        {followups && followups.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {followups.map((f, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectFollowup?.(f)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 dark:bg-neutral-800 hover:bg-[#00BFFF]/10 hover:text-[#00BFFF] text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 hover:border-[#00BFFF] transition-all cursor-pointer"
              >
                <span>{f}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
