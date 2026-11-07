import React, { useRef, useEffect } from 'react';
import { Sparkles, RotateCcw, ShieldCheck, CheckCheck } from 'lucide-react';
import { AIResponse } from './AIResponse';
import { TypingIndicator } from './TypingIndicator';
import { AIShopperInput } from './AIShopperInput';
import type { ShopperProduct } from '@/services/aiShopperService';

export interface ChatMsg {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  followups?: string[];
  products?: ShopperProduct[];
}

interface AIShopperChatProps {
  messages: ChatMsg[];
  loading: boolean;
  onSendMessage: (msg: string) => void;
  onSelectFollowup?: (followup: string) => void;
  onResetSession?: () => void;
  className?: string;
}

export const AIShopperChat: React.FC<AIShopperChatProps> = ({
  messages,
  loading,
  onSendMessage,
  onSelectFollowup,
  onResetSession,
  className = "",
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-xs ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 border border-[#00BFFF]/30 flex items-center justify-center overflow-hidden shadow-xs shrink-0 p-0.5">
            <img
              src="/ai-shopper-icon.png"
              alt="Suqafuran AI"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Suqafuran AI
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-[#00BFFF]/10 text-[#00BFFF]">
                AGENT
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Online • Personal Shopping Concierge</span>
            </div>
          </div>
        </div>

        {onResetSession && (
          <button
            type="button"
            onClick={onResetSession}
            className="p-2 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Start new conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
        {messages.map((m) => (
          <div key={m.id}>
            {m.sender === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#00BFFF] text-white px-4 py-2.5 shadow-xs">
                  <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-sky-100">
                    <span>{m.timestamp}</span>
                    <CheckCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ) : (
              <AIResponse
                message={m.text}
                timestamp={m.timestamp}
                followups={m.followups}
                onSelectFollowup={onSelectFollowup}
              />
            )}
          </div>
        ))}

        {loading && (
          <div className="py-2">
            <TypingIndicator label="Consulting marketplace inventory..." />
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
        <AIShopperInput
          onSendMessage={onSendMessage}
          disabled={loading}
          placeholder="Ask Suqafuran AI (e.g. phone under 20k)..."
        />
      </div>
    </div>
  );
};

