import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { SuggestedPrompts } from './SuggestedPrompts';

interface AIShopperWelcomeProps {
  onSelectPrompt: (promptText: string) => void;
  className?: string;
}

export const AIShopperWelcome: React.FC<AIShopperWelcomeProps> = ({
  onSelectPrompt,
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}
    >
      {/* Suqafuran AI Shopper Icon Illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-neutral-900 border-2 border-[#00BFFF]/30 shadow-lg flex items-center justify-center p-2 overflow-hidden hover:scale-105 transition-transform duration-300">
          <img
            src="/ai-shopper-icon.png"
            alt="Suqafuran AI Shopper"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#00BFFF] border-2 border-white dark:border-neutral-900 flex items-center justify-center text-white shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Welcome to Suqafuran AI Shopper
      </h1>
      <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal max-w-lg leading-relaxed">
        Tell me what you're looking for. I'll help you discover products, compare options, and find the right sellers.
      </p>

      {/* Suggested Prompts List */}
      <div className="w-full mt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-3">
          Suggested Requests
        </p>
        <SuggestedPrompts onSelectPrompt={onSelectPrompt} />
      </div>
    </motion.div>
  );
};

