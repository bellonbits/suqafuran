"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingBag, ArrowLeft, RotateCcw, Scale, X, User as UserIcon
} from 'lucide-react';
import { 
  AIShopperWelcome,
  AIShopperInput,
  AIResponse,
  TypingIndicator,
  AIProductDetailModal,
  ProductComparisonTable,
  type ChatMsg
} from '@/components/ai-shopper';
import { 
  aiShopperService, 
  type ShopperProduct, 
  type ShopperSeller, 
  type ComparisonData 
} from '@/services/aiShopperService';
import { messageService } from '@/services/messageService';
import { useCart } from '@/store/useCart';
import { useAuthStore } from '@/store/useAuth';
import { CheckCheck } from 'lucide-react';

export default function AiShopperPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const { user, isAuthenticated } = useAuthStore();
  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // User Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning,' : hour < 17 ? 'Good Afternoon,' : 'Good Evening,';
  const userName = user?.full_name || user?.name || (isAuthenticated ? 'Shopper' : 'Welcome to Suqafuran');

  // URL Query
  const urlQuery = searchParams.get('q') || '';

  // State
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [currentQuery, setCurrentQuery] = useState(urlQuery);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('session-' + Date.now());

  // Product Inspection Modal (Screen 3)
  const [selectedProduct, setSelectedProduct] = useState<ShopperProduct | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Record<number, boolean>>({});

  // Product Comparison state
  const [comparingIds, setComparingIds] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Execution guards to prevent duplicate queries / double texting
  const lastProcessedQueryRef = useRef<string>('');
  const isQueryRunningRef = useRef<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Trigger search on mount if url query is present
  useEffect(() => {
    const q = urlQuery.trim();
    if (q && q !== lastProcessedQueryRef.current) {
      handleUserQuery(q, true);
    }
  }, [urlQuery]);

  // Execute Search / Chat
  const handleUserQuery = async (queryText: string, isFromUrl = false) => {
    const cleanQ = queryText.trim();
    if (!cleanQ) return;

    // Prevent duplicate concurrent requests
    if (isQueryRunningRef.current) return;
    if (cleanQ === lastProcessedQueryRef.current && messages.length > 0) return;

    isQueryRunningRef.current = true;
    lastProcessedQueryRef.current = cleanQ;
    setCurrentQuery(cleanQ);

    if (!isFromUrl && searchParams.get('q') !== cleanQ) {
      setSearchParams({ q: cleanQ }, { replace: true });
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message to chat with deduplication guard
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'user',
      text: cleanQ,
      timestamp: timeStr,
    };

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.sender === 'user' && last.text === cleanQ) {
        return prev;
      }
      return [...prev, userMsg];
    });
    setLoading(true);

    try {
      const response = await aiShopperService.chat(cleanQ, conversationId);
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      if (response.comparison) {
        setComparisonData(response.comparison);
      }

      // Add agent reply with product recommendations right inside the message
      const agentMsg: ChatMsg = {
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'agent',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followups: response.suggested_followups || [],
        products: response.products || [],
      };

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === 'agent' && last.text === response.message) {
          return prev;
        }
        return [...prev, agentMsg];
      });
    } catch (err) {
      console.error("AI Shopper Chat error:", err);
      const fallbackMsg: ChatMsg = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: "Here are top recommended verified listings currently available on Suqafuran.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
      isQueryRunningRef.current = false;
    }
  };

  // Reset Session
  const handleResetSession = () => {
    lastProcessedQueryRef.current = '';
    isQueryRunningRef.current = false;
    setSearchParams({}, { replace: true });
    setCurrentQuery("");
    setMessages([]);
    setComparingIds([]);
    setComparisonData(null);
    setSelectedProduct(null);
    setConversationId('session-' + Date.now());
  };

  // Add to cart from Product Details modal
  const handleAddToCart = (product: ShopperProduct, quantity: number = 1) => {
    addItem({
      id: String(product.id),
      title: product.title,
      price: product.price,
      image: product.image || '',
      seller_id: String(product.seller_id),
      seller_name: product.seller_name,
      quantity,
    });
  };

  // Direct chat inquiry to seller
  const handleDirectChat = async (product: ShopperProduct) => {
    try {
      await messageService.sendMessage({
        receiver_id: product.seller_id,
        content: product.directed_message,
        listing_id: product.id,
      });
      navigate(`/messages?userId=${product.seller_id}&productId=${product.id}`);
    } catch {
      navigate(`/messages?userId=${product.seller_id}&productId=${product.id}`);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (productId: number) => {
    setFavoriteIds((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const isInitialWelcome = messages.length === 0 && !currentQuery;

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white flex flex-col items-center">
      
      {/* ─── Fixed Header Bar matching Mockups 1, 2, 3 ──────────────── */}
      <header className="sticky top-0 z-30 w-full max-w-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-neutral-800 px-4 py-3 flex items-center justify-between">
        
        {/* User Profile Info on Left */}
        <div className="flex items-center gap-3">
          <Link to="/account" className="relative group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden shadow-xs">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-400 group-hover:text-[#00BFFF] transition-colors" />
              )}
            </div>
          </Link>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-400 leading-none">
              {greeting}
            </span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              {userName}
            </span>
          </div>
        </div>

        {/* Right Header Actions: Reset Session + Shopping Bag */}
        <div className="flex items-center gap-2">
          {!isInitialWelcome && (
            <button
              type="button"
              onClick={handleResetSession}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              title="Start New Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-200 hover:bg-[#00BFFF] hover:text-white transition-colors cursor-pointer"
            title="Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00BFFF] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ─── Main Content Area: Centered Phone/Tablet Experience ─────── */}
      <main className="flex-1 w-full max-w-xl flex flex-col justify-between bg-white dark:bg-neutral-900 border-x border-slate-200/60 dark:border-neutral-800 shadow-sm relative">
        
        {isInitialWelcome ? (
          /* ══ SCREEN 1: WELCOME SCREEN ("Need anything?") ═══════════════ */
          <div className="flex-1 flex flex-col justify-center items-center py-10 px-2">
            <AIShopperWelcome
              onSelectPrompt={(prompt) => handleUserQuery(prompt)}
              onSendMessage={(query) => handleUserQuery(query)}
              loading={loading}
            />
          </div>
        ) : (
          /* ══ SCREEN 2: ACTIVE CONVERSATION STREAM ═════════════════════ */
          <div className="flex-1 flex flex-col h-[calc(100vh-8.5rem)]">
            
            {/* Messages Scroll Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 hide-scrollbar">
              
              {/* Initial Assistant Greeting */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border border-[#00BFFF]/30 flex items-center justify-center overflow-hidden shrink-0 mt-0.5 shadow-xs p-0.5">
                  <img src="/ai-shopper-icon.png" alt="" className="w-full h-full object-contain" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 px-4 py-2.5 shadow-xs text-sm">
                  Hi! I'm your Suqafuran shopping assistant. How can I help you today?
                </div>
              </div>

              {/* Message List */}
              {messages.map((m) => (
                <div key={m.id}>
                  {m.sender === 'user' ? (
                    /* User Bubble: Solid Suqafuran Cyan #00BFFF */
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
                    /* Agent Bubble + Direct Product Recommendations Carousel */
                    <AIResponse
                      message={m.text}
                      timestamp={m.timestamp}
                      products={m.products}
                      followups={m.followups}
                      onSelectProduct={(prod) => setSelectedProduct(prod)}
                      onSelectFollowup={(f) => handleUserQuery(f)}
                      onToggleFavorite={handleToggleFavorite}
                      favoriteIds={favoriteIds}
                    />
                  )}
                </div>
              ))}

              {loading && (
                <div className="py-2">
                  <TypingIndicator label="Finding best verified listings..." />
                </div>
              )}
            </div>

            {/* Bottom Floating Comparison Pill if products selected */}
            {comparingIds.length >= 2 && (
              <div className="px-4 pb-2">
                <button
                  type="button"
                  onClick={() => setShowCompareModal(true)}
                  className="w-full py-2 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare {comparingIds.length} Products Side-by-Side</span>
                </button>
              </div>
            )}

            {/* Bottom Anchored Pill Search Input matching Mockup 2 */}
            <div className="sticky bottom-0 z-20 p-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-slate-100 dark:border-neutral-800">
              <AIShopperInput
                onSendMessage={handleUserQuery}
                disabled={loading}
                placeholder="Ask Anything..."
              />
            </div>
          </div>
        )}
      </main>

      {/* ─── SCREEN 3: PRODUCT DETAILS MODAL / DRAWER ────────────────── */}
      <AIProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onDirectChat={handleDirectChat}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedProduct ? !!favoriteIds[selectedProduct.id] : false}
      />

      {/* ─── Comparison Modal ────────────────────────────────────────── */}
      {showCompareModal && comparisonData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#00BFFF]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Product Comparison
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-4">
              <ProductComparisonTable
                comparison={comparisonData}
                onSelectProduct={(p) => {
                  setShowCompareModal(false);
                  setSelectedProduct(p);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
