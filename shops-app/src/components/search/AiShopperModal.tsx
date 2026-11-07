"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Search, MessageSquare, ShoppingCart, Store, MapPin, 
  ShieldCheck, ArrowRight, X, Loader2, CheckCircle2, ChevronRight, Tag, ExternalLink
} from 'lucide-react';
import { searchService, type AiShopperResult, type AiShopperProduct } from '@/services/searchService';
import { messageService } from '@/services/messageService';
import { useCart } from '@/store/useCart';
import { optimizeCloudinaryUrl } from '@/services/api';

interface AiShopperModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const POPULAR_AI_PROMPTS = [
  "Find smart TVs under 35k in Nairobi and ask if they deliver",
  "I need a wedding outfit under 15k and check availability",
  "Looking for iPhone 13 under 55k with good battery health",
  "Recommend laptops for work under 40,000 KSh with warranty",
];

export const AiShopperModal: React.FC<AiShopperModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiShopperResult | null>(null);
  const [addedCartIds, setAddedCartIds] = useState<Record<number, boolean>>({});
  const [sendingChatId, setSendingChatId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialQuery) {
        setPrompt(initialQuery);
        handleExecute(initialQuery);
      } else {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialQuery]);

  const handleExecute = async (queryToRun: string) => {
    const q = queryToRun.trim();
    if (!q) return;

    try {
      setLoading(true);
      const res = await searchService.aiShop(q);
      setResult(res);
    } catch (err) {
      console.error('AI Shopper error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: AiShopperProduct) => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image || '',
      sellerId: String(product.seller_id),
      sellerName: product.seller_name,
    });
    setAddedCartIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedCartIds(prev => ({ ...prev, [product.id]: false }));
    }, 2500);
  };

  const handleDirectChat = async (product: AiShopperProduct) => {
    setSendingChatId(product.id);
    try {
      // Send the directed message directly so it creates the chat thread with the white receipt card
      await messageService.sendMessage({
        receiver_id: product.seller_id,
        content: product.directed_message,
        listing_id: product.id,
      });

      onClose();
      navigate(`/messages?userId=${product.seller_id}&productId=${product.id}`);
    } catch (err: any) {
      console.error('Failed to send direct chat inquiry:', err);
      onClose();
      navigate(`/messages?userId=${product.seller_id}&productId=${product.id}`);
    } finally {
      setSendingChatId(null);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
      style={{ minHeight: '100vh' }}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[88vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-neutral-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-neutral-800 border border-[#00BFFF]/30 flex items-center justify-center overflow-hidden shadow-xs shrink-0 p-0.5">
              <img
                src="/ai-shopper-icon.png"
                alt="Suqafuran AI Shopper"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Suqafuran AI Shopper</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#00BFFF]/10 text-[#00BFFF]">
                  Intelligent
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Type what you want to buy, budget, and custom questions for sellers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                navigate(`/ai-shopper${prompt ? `?q=${encodeURIComponent(prompt)}` : ''}`);
              }}
              className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-neutral-800 text-[#0078E8] dark:text-sky-300 text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-white transition-all cursor-pointer border border-sky-100 dark:border-neutral-700"
              title="Open full AI shopping workspace"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Workspace</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-neutral-800 space-y-3 shrink-0 bg-white dark:bg-neutral-900">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleExecute(prompt);
            }}
            className="relative flex items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Find smart TV under 35k in Nairobi and ask if they deliver"
                className="w-full h-12 pl-11 pr-24 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0078E8] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 h-9 rounded-xl bg-[#00BFFF] hover:bg-[#02CCFE] text-white text-xs font-black flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Prompts Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar text-xs">
            <span className="text-[11px] font-bold text-gray-400 shrink-0">Try:</span>
            {POPULAR_AI_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(p);
                  handleExecute(p);
                }}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Results */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#00BFFF] flex items-center justify-center text-white">
                <Sparkles className="w-6 h-6 animate-spin text-white" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                AI Shopper is searching products & verified sellers...
              </p>
              <p className="text-xs text-gray-400 max-w-sm">
                Analyzing keywords, budget limits, location, and pre-formatting seller inquiries.
              </p>
            </div>
          ) : result ? (
            <div className="space-y-5">
              {/* AI Understanding Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                    <Sparkles className="w-4 h-4 text-[#0078E8]" />
                    <span>AI Shopping Assessment</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {result.understood.budget && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                        {result.understood.budget}
                      </span>
                    )}
                    {result.understood.location && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {result.understood.location}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-700 dark:text-neutral-300 leading-relaxed">
                  {result.ai_advice}
                </p>

                {result.understood.buyer_question && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-neutral-800 flex items-start gap-1.5 text-[11px] text-indigo-900 dark:text-indigo-300">
                    <MessageSquare className="w-3.5 h-3.5 text-[#0078E8] shrink-0 mt-0.5" />
                    <span>
                      <strong>Directed Question:</strong> "{result.understood.buyer_question}"
                    </span>
                  </div>
                )}
              </div>

              {/* Recommended Products Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                    Recommended Products ({result.products.length})
                  </h4>
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/search?q=${encodeURIComponent(result.understood.keywords || prompt)}`);
                    }}
                    className="text-xs font-bold text-[#0078E8] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>View all in search</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {result.products.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 bg-slate-50 dark:bg-neutral-850 rounded-2xl">
                    No matching products found. Try adjusting your search or budget.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.products.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 rounded-2xl bg-white dark:bg-neutral-850 border border-slate-200/80 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 shadow-xs flex flex-col justify-between gap-3 group transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={optimizeCloudinaryUrl(prod.image, { width: 120 }) || prod.image || '/icon1.png'}
                            alt={prod.title}
                            className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-neutral-800 shrink-0 border border-slate-100 dark:border-neutral-700"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {prod.title}
                            </h5>
                            <p className="text-sm font-black text-[#0078E8] dark:text-sky-400">
                              KSh {prod.price.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-neutral-400 truncate">
                              <span className="font-bold truncate">{prod.seller_name}</span>
                              {prod.is_verified && (
                                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Direct Actions: Chat with Seller & Add to Cart */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
                          <button
                            type="button"
                            onClick={() => handleDirectChat(prod)}
                            disabled={sendingChatId === prod.id}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-[#0078E8] dark:text-sky-300 text-[11px] font-black flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            {sendingChatId === prod.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <MessageSquare className="w-3 h-3" />
                                <span>Direct Chat</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(prod)}
                            className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-[11px] font-black flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            {addedCartIds[prod.id] ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Added!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3 h-3" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matching Verified Shops */}
              {result.shops && result.shops.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                    Verified Shops & Dealers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.shops.map((shop) => (
                      <div
                        key={shop.id}
                        onClick={() => {
                          onClose();
                          navigate(`/shop/${shop.slug}`);
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200/60 dark:border-neutral-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {shop.avatar_url ? (
                            <img
                              src={shop.avatar_url}
                              alt={shop.name}
                              className="w-9 h-9 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {shop.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h6 className="text-xs font-black text-slate-900 dark:text-white truncate flex items-center gap-1">
                              <span>{shop.name}</span>
                              {shop.is_verified && (
                                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                              )}
                            </h6>
                            <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              <span className="truncate">{shop.location}</span>
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-neutral-850 text-[#0078E8] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-[#0078E8]" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                Your Personal Marketplace Concierge
              </h4>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Type what you need in plain English or Swahili (e.g. "iPhone 13 under 50k", "wedding suit in Eastleigh"). We'll find verified items and prepare directed inquiries ready for chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
