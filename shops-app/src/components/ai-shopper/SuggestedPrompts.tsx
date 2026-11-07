import React from 'react';
import { Smartphone, Laptop, Sparkles, Home, Scale, Search } from 'lucide-react';

interface SuggestedPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  prompts?: string[];
  className?: string;
}

const DEFAULT_PROMPTS = [
  { text: "Find a smartphone within my budget", icon: Smartphone },
  { text: "Help me choose a laptop", icon: Laptop },
  { text: "Discover fashion deals", icon: Sparkles },
  { text: "Find home appliances", icon: Home },
  { text: "Compare popular products", icon: Scale },
];

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  onSelectPrompt,
  prompts,
  className = "",
}) => {
  const displayPrompts = prompts && prompts.length > 0
    ? prompts.map((p) => ({
        text: p,
        icon: DEFAULT_PROMPTS.find(dp => dp.text === p)?.icon || Search,
      }))
    : DEFAULT_PROMPTS;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2.5 ${className}`}>
      {displayPrompts.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.text)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-800 hover:border-[#00BFFF] hover:text-[#00BFFF] dark:hover:border-[#00BFFF] dark:hover:text-[#00BFFF] shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <IconComponent className="w-3.5 h-3.5 text-[#00BFFF] shrink-0" />
            <span>{item.text}</span>
          </button>
        );
      })}
    </div>
  );
};
