import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Smartphone, Footprints, Laptop, Home } from 'lucide-react';
import { AIShopperInput } from './AIShopperInput';

interface AIShopperWelcomeProps {
  onSelectPrompt: (promptText: string) => void;
  onSendMessage: (query: string) => void;
  onPhotoUpload?: (file: File) => void;
  loading?: boolean;
  className?: string;
}

const QUICK_CHIPS = [
  { icon: Gift, label: "Best gift ideas", query: "Best birthday gift ideas under 5000 KSh" },
  { icon: Smartphone, label: "Phones under 25k", query: "Find a smartphone under 25000 KSh" },
  { icon: Footprints, label: "Trending Shoes", query: "Show me trending sneakers and shoes" },
  { icon: Laptop, label: "Laptops for work", query: "Recommend laptops for work and programming" },
  { icon: Home, label: "Home & living", query: "Affordable home and living items" },
];

export const AIShopperWelcome: React.FC<AIShopperWelcomeProps> = ({
  onSelectPrompt,
  onSendMessage,
  onPhotoUpload,
  loading = false,
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center px-1 sm:px-4 py-4 sm:py-16 min-w-0 ${className}`}
    >
      {/* Brand Icon illustration */}
      <div className="relative mb-3 sm:mb-6 shrink-0">
        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs flex items-center justify-center p-2 overflow-hidden hover:scale-105 transition-transform duration-300">
          <img
            src="/ai-shopper-icon.png"
            alt="Suqafuran AI Shopper"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Main Title & Subtitle exactly matching mock */}
      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
        Need anything?
      </h1>
      <p className="mt-1.5 sm:mt-3 text-xs sm:text-base text-slate-500 dark:text-neutral-400 font-normal max-w-xs sm:max-w-xl leading-relaxed">
        Our smart AI assistant helps you find exactly what you need—faster and easier than ever.
      </p>

      {/* Main Pill Search Input */}
      <div className="w-full max-w-2xl sm:max-w-3xl mt-4 sm:mt-8 min-w-0 px-1 sm:px-0">
        <AIShopperInput
          onSendMessage={onSendMessage}
          onPhotoUpload={onPhotoUpload}
          disabled={loading}
          placeholder="Ask Anything..."
        />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="w-full mt-3.5 sm:mt-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {QUICK_CHIPS.map((chip, idx) => {
          const Icon = chip.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(chip.query)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-[#00BFFF] hover:text-[#00BFFF] dark:hover:border-[#00BFFF] text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-neutral-200 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
