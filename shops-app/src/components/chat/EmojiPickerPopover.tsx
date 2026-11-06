"use client";

import React, { useState } from 'react';
import { X, Smile, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';

interface EmojiPickerPopoverProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    id: 'popular',
    name: 'Top',
    emojis: ['😊', '👍', '👋', '🙏', '❤️', '🔥', '🙌', '🤝', '👏', '💯', '😂', '😎', '🤩', '🤔', '👌'],
  },
  {
    id: 'commerce',
    name: 'Shop',
    emojis: ['🛍️', '💰', '📦', '🏷️', '💳', '🧾', '💵', '🏬', '🛒', '🎁', '✨', '💎', '🚚', '📦'],
  },
  {
    id: 'trust',
    name: 'Trust',
    emojis: ['✅', '❌', '⚠️', '🛡️', '📍', '📞', '💬', '🕒', '🔒', '⏳', '📢', '🌟', '⭐'],
  },
  {
    id: 'items',
    name: 'Items',
    emojis: ['📱', '💻', '👗', '👟', '💄', '🚗', '⌚', '🎧', '📷', '🏠', '🛋️', '👓', '👜'],
  },
];

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({ onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="absolute bottom-14 left-0 sm:left-4 z-50 w-72 sm:w-80 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-1">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === i
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200"
          aria-label="Close emoji picker"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Emojis */}
      <div className="grid grid-cols-7 gap-1.5 max-h-40 overflow-y-auto p-1">
        {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-neutral-800 hover:scale-125 active:scale-95 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

