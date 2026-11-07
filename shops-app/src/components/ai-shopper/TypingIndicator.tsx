import React from 'react';
import { Sparkles } from 'lucide-react';

interface TypingIndicatorProps {
  label?: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  label = "Searching verified listings...",
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-7 h-7 rounded-full bg-white dark:bg-neutral-800 border border-[#00BFFF]/30 flex items-center justify-center overflow-hidden shrink-0 shadow-xs p-0.5">
        <img
          src="/ai-shopper-icon.png"
          alt="Suqafuran AI"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#00BFFF] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-[#00BFFF] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-[#00BFFF] animate-bounce" />
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
          {label}
        </span>
      </div>
    </div>
  );
};

