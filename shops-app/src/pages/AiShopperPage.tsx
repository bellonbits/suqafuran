"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, Send, Search, MessageSquare, ShoppingCart, 
  ShieldCheck, Heart, MapPin, ChevronRight, Loader2, 
  RotateCcw, SlidersHorizontal, CheckCircle2, MoreVertical,
  Paperclip, ArrowRight, ExternalLink, Star
} from 'lucide-react';
import { searchService, type AiShopperResult, type AiShopperProduct, type UniversalSearchShop } from '@/services/searchService';
import { messageService } from '@/services/messageService';
import { useCart } from '@/store/useCart';
import { optimizeCloudinaryUrl } from '@/services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  suggestions?: string[];
  buyer_question?: string;
  timestamp: string;
}

export default function AiShopperPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const initialQuery = searchParams.get('q') || 'adidas adizero';
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'agent' | 'results'>('results');
  const [favoriteIds, setFavoriteIds] = useState<Record<number, boolean>>({});
  const [addedCartIds, setAddedCartIds] = useState<Record<number, boolean>>({});
  const [sendingChatId, setSendingChatId] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Conversation history
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiResult, setAiResult] = useState<AiShopperResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial execution on mount or query change
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery, true);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSearch = async (queryText: string, isInitial: boolean = false) => {
    const q = queryText.trim();
    if (!q) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => isInitial ? [userMsg] : [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const res = await searchService.aiShop(q);
      setAiResult(res);

      // Generate context-aware suggestions
      const kw = res.understood.keywords || q;
      const suggestions = [
        `Find verified suppliers for ${kw}`,
        `Market pricing & trends for ${kw}`,
        `Source ${kw} in Nairobi CBD`,
        `Compare ${kw} with warranty`,
        `Ask seller for best cash discount`,
      ];

      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        text: `I'll look up verified marketplace sourcing options and best deals for ${kw}. Here is what I found across active shops.`,
        suggestions,
        buyer_question: res.understood.buyer_question,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      console.error('AI Shopper error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: `I couldn't fetch live results right now. Please try another search or check back shortly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;
    setSearchParams({ q: inputVal.trim() });
    handleSearch(inputVal.trim());
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchParams({ q: suggestion });
    handleSearch(suggestion);
  };

  const toggleFavorite = (productId: number) => {
    setFavoriteIds(prev => ({ ...prev, [productId]: !prev[productId] }));
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
      await messageService.sendMessage({
        receiver_id: product.seller_id,
        content: product.directed_message,
        listing_id: product.id,
      });
      navigate(`/messages?userId=${product.seller_id}&productId=${product.id}`);
    } catch (err: any) {
      console.error('Failed to send direct chat inquiry:', err);
      navigate(`/messages?userId=${product.seller_id}&productId=${product.id}`);
    } finally {
      setSendingChatId(null);
    }
  };

  // Filter pills based on AI assessment
  const kw = aiResult?.understood.keywords || initialQuery;
  const filterPills = [
    `Under KSh 50,000`,
    `In Nairobi`,
    `Verified Shops Only`,
    `Brand New`,
    `Top Rated`,
    `Free Delivery`,
    `Negotiable`,
  ];

  const currentQueryDisplay = aiResult?.query || initialQuery;
  const displayedProducts = (aiResult?.products || []).filter(p => {
    if (!selectedTag) return true;
    if (selectedTag.includes('50,000') && p.price > 50000) return false;
    if (selectedTag.includes('Verified') && !p.is_verified) return false;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white dark:bg-neutral-950 flex flex-col">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-12 z-20 px-3 py-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('agent')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'agent' 
              ? 'bg-[#0078E8] text-white shadow-xs' 
              : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Suqafuran AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'results' 
              ? 'bg-[#0078E8] text-white shadow-xs' 
              : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
          }`}
        >
          <span>Products</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {displayedProducts.length}
          </span>
        </button>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        
        {/* ── Left Column: Suqafuran AI Agent Pane ── */}
        <aside className={`w-full lg:w-[390px] xl:w-[420px] lg:shrink-0 border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col ${
          activeTab === 'agent' ? 'flex' : 'hidden lg:flex'
        } lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16`}>
          
          {/* Agent Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-pink-50/50 dark:from-neutral-900 dark:to-neutral-900">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
                  <img
                    src="/icon1.png"
                    alt="Suqafuran AI"
                    className="w-full h-full object-contain rounded-2xl bg-white p-1"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <Sparkles className="w-5 h-5 text-amber-200" />
                </div>
                {/* Active green status indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900 animate-pulse" />
              </div>

              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Suqafuran AI</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#0078E8]/10 text-[#0078E8] dark:text-sky-400">
                    Agent
                  </span>
                </h2>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>Online · Sourcing Concierge</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMessages([]);
                handleSearch('trending products in Nairobi', true);
              }}
              title="Reset conversation"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {msg.sender === 'user' ? (
                  /* User Bubble */
                  <div className="flex items-start justify-end gap-2.5">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-900 text-white dark:bg-[#0078E8] px-4 py-2.5 shadow-xs">
                      <p className="text-xs sm:text-sm font-semibold">{msg.text}</p>
                      <span className="text-[10px] text-slate-300 dark:text-sky-200 block text-right mt-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Agent Bubble */
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Sparkles className="w-4 h-4 text-amber-200" />
                      </div>
                      <div className="flex-1 rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-neutral-700 px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            Suqafuran AI
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-slate-700 dark:text-neutral-200 leading-relaxed font-medium">
                          {msg.text}
                        </p>
                      </div>
                    </div>

                    {/* AI Suggestions Card */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="ml-10 p-3.5 rounded-2xl bg-gradient-to-br from-sky-50/60 to-indigo-50/40 dark:from-neutral-850 dark:to-neutral-800/60 border border-sky-100 dark:border-neutral-700/80 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                          <Sparkles className="w-3.5 h-3.5 text-[#0078E8]" />
                          <span>AI Suggestions</span>
                        </div>

                        <p className="text-[11px] text-gray-500 dark:text-neutral-400 leading-normal">
                          I have displayed the sourcing options for <strong>{kw}</strong>. If you have any questions or need direct shop contacts, select an option:
                        </p>

                        <div className="space-y-1.5">
                          {msg.suggestions.map((sug, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSuggestionClick(sug)}
                              className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700/80 border border-slate-200/60 dark:border-neutral-700 flex items-center justify-between gap-2 text-xs font-semibold text-slate-800 dark:text-neutral-200 shadow-2xs transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0078E8] shrink-0" />
                                <span className="truncate">{sug}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#0078E8] shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 ml-10 p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-200/60 dark:border-neutral-700">
                <Loader2 className="w-4 h-4 animate-spin text-[#0078E8]" />
                <span className="text-xs font-semibold text-gray-500 dark:text-neutral-300">
                  Suqafuran AI is searching verified sellers & analyzing pricing...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
            <form onSubmit={onSubmitMessage} className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Describe your needs (e.g. adidas adizero under 10k)..."
                className="w-full h-12 pl-4 pr-20 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0078E8] transition-all"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="submit"
                  disabled={loading || !inputVal.trim()}
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#0078E8] to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-md disabled:opacity-40 transition-all cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </aside>

        {/* ── Right Column: Search Results & Marketplace Grid ── */}
        <main className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 bg-slate-50/70 dark:bg-neutral-950/80 overflow-y-auto ${
          activeTab === 'results' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Header Title & Subtitle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Showing search results for "{currentQueryDisplay}"
                </h1>
                <span className="text-xs font-bold text-gray-500 dark:text-neutral-400">
                  Results from <strong>71000+</strong> products and <strong>4900+</strong> suppliers
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
                AI verified recommendations across Kenya • Fast delivery • Safe in-app communication
              </p>
            </div>

            {/* AI Suggestion Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 text-xs">
              <span className="text-xs font-bold text-gray-400 shrink-0">AI Suggestions:</span>
              {filterPills.map((pill, idx) => {
                const isSelected = selectedTag === pill;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? null : pill)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-[#0078E8] text-white border-[#0078E8] shadow-xs' 
                        : 'bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-200 border-slate-200/90 dark:border-neutral-800 hover:border-slate-300'
                    }`}
                  >
                    {pill}
                  </button>
                );
              })}
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="text-xs font-bold text-rose-500 hover:underline shrink-0 ml-1 cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Products Grid */}
            {displayedProducts.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-8 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-neutral-800 text-[#0078E8] flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  No direct products found for "{currentQueryDisplay}"
                </h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Try asking Suqafuran AI in the chat to recommend related products, broad categories, or alternative brands.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => handleSearch('smart TVs')}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-xs font-bold text-slate-700 dark:text-neutral-300"
                  >
                    Smart TVs
                  </button>
                  <button
                    onClick={() => handleSearch('sneakers')}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-xs font-bold text-slate-700 dark:text-neutral-300"
                  >
                    Sneakers
                  </button>
                  <button
                    onClick={() => handleSearch('smartphones')}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-xs font-bold text-slate-700 dark:text-neutral-300"
                  >
                    Smartphones
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5">
                {displayedProducts.map((prod) => {
                  const isFav = !!favoriteIds[prod.id];
                  return (
                    <div
                      key={prod.id}
                      className="group bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      <div>
                        {/* Top Product Image Container */}
                        <div className="relative aspect-square w-full rounded-2xl bg-slate-50 dark:bg-neutral-850 overflow-hidden flex items-center justify-center p-3 mb-3 border border-slate-100 dark:border-neutral-800/80">
                          <img
                            src={optimizeCloudinaryUrl(prod.image, { width: 400 }) || prod.image || '/icon1.png'}
                            alt={prod.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 select-none"
                            loading="lazy"
                          />

                          {/* Top-Right Favorite Heart */}
                          <button
                            type="button"
                            onClick={() => toggleFavorite(prod.id)}
                            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-xs transition-colors cursor-pointer"
                            aria-label="Add to favorites"
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>

                          {/* Verification badge */}
                          {prod.is_verified && (
                            <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>Verified</span>
                            </div>
                          )}
                        </div>

                        {/* Star Ratings */}
                        <div className="flex items-center gap-1 mb-1.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                          <span className="text-[11px] font-bold text-gray-400 ml-1">5.0</span>
                        </div>

                        {/* Product Title */}
                        <Link 
                          to={`/listing/${prod.id}`}
                          className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-2 hover:text-[#0078E8] transition-colors leading-snug"
                        >
                          {prod.title}
                        </Link>

                        {/* Price */}
                        <p className="mt-2 text-base sm:text-lg font-black text-[#0078E8] dark:text-sky-400">
                          KSh {prod.price.toLocaleString()}
                        </p>

                        {/* Seller Name and Location */}
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-neutral-400 truncate">
                          <span className="font-semibold truncate">{prod.seller_name}</span>
                          <span>•</span>
                          <span className="truncate">{prod.location}</span>
                        </div>
                      </div>

                      {/* Direct Card Actions: Direct Chat & Add to Cart */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800">
                        <button
                          type="button"
                          onClick={() => handleDirectChat(prod)}
                          disabled={sendingChatId === prod.id}
                          className="px-2.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-[#0078E8] dark:text-sky-300 text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {sendingChatId === prod.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Direct Chat</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(prod)}
                          className="px-2.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {addedCartIds[prod.id] ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Verified Shops Section */}
            {aiResult?.shops && aiResult.shops.length > 0 && (
              <div className="pt-6 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                  Verified Specialized Shops for "{kw}"
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {aiResult.shops.map((shop) => (
                    <Link
                      key={shop.id}
                      to={`/shop/${shop.slug}`}
                      className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 hover:border-slate-300 flex items-center justify-between group shadow-xs transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {shop.avatar_url ? (
                          <img
                            src={shop.avatar_url}
                            alt={shop.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {shop.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate flex items-center gap-1">
                            <span>{shop.name}</span>
                            {shop.is_verified && (
                              <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                            )}
                          </h4>
                          <p className="text-[10px] text-gray-400 truncate">
                            {shop.location}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0078E8] shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
