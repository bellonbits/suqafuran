"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingBag, ArrowLeft, RotateCcw, Scale, X, User as UserIcon,
  Store, ShieldCheck, ChevronRight, CheckCheck, SlidersHorizontal, Sparkles, Info
} from 'lucide-react';
import { 
  AIShopperWelcome,
  AIShopperInput,
  AIResponse,
  TypingIndicator,
  AIProductDetailModal,
  ProductRecommendationCard,
  ShoppingFilters,
  SellerRecommendationCard,
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
  const [products, setProducts] = useState<ShopperProduct[]>([]);
  const [sellers, setSellers] = useState<ShopperSeller[]>([]);
  const [currentQuery, setCurrentQuery] = useState(urlQuery);
  const [isFallback, setIsFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('session-' + Date.now());

  // Filters for desktop right pane
  const [filters, setFilters] = useState<{
    maxPrice?: number;
    location?: string;
    condition?: string;
    verifiedOnly?: boolean;
  }>({});

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

      setProducts(response.products || []);
      setSellers(response.sellers || []);
      setIsFallback(response.is_fallback || false);

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
    setProducts([]);
    setSellers([]);
    setComparingIds([]);
    setComparisonData(null);
    setSelectedProduct(null);
    setConversationId('session-' + Date.now());
  };

  // Add to cart from Product Details modal or desktop card
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

  // Toggle product comparison
  const handleToggleCompare = (product: ShopperProduct) => {
    setComparingIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter(id => id !== product.id);
      }
      if (prev.length >= 4) {
        alert("You can compare up to 4 products at a time.");
        return prev;
      }
      return [...prev, product.id];
    });
  };

  // Filtered products for desktop right pane
  const displayProducts = products.filter((p) => {
    if (filters.maxPrice && p.price > filters.maxPrice) return false;
    if (filters.location && !p.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.condition && p.condition.toLowerCase() !== filters.condition.toLowerCase()) return false;
    if (filters.verifiedOnly && !p.is_verified) return false;
    return true;
  });

  const isInitialWelcome = messages.length === 0 && !currentQuery;

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white flex flex-col min-w-0 overflow-x-clip">
      
      {/* ─── Fixed Header Bar: Wide on Desktop ────────────────────────── */}
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-neutral-800">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
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

          {/* Center Brand Badge (Hidden on very small screens) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
              <img src="/ai-shopper-icon.png" alt="" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-200">
              Suqafuran AI Shopper
            </span>
          </div>

          {/* Right Header Actions: Reset Session + Shopping Bag */}
          <div className="flex items-center gap-2">
            {!isInitialWelcome && (
              <button
                type="button"
                onClick={handleResetSession}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                title="Start New Chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Session</span>
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
        </div>
      </header>

      {/* ─── Main Content Area: Wide Container on Desktop, Safe Fit on Mobile ───────────── */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 pb-20 lg:pb-6 flex flex-col min-w-0 box-border">
        
        {isInitialWelcome ? (
          /* ══ SCREEN 1: WELCOME SCREEN ("Need anything?") — Wide & Spacious ══ */
          <div className="my-auto flex flex-col justify-center items-center py-4 sm:py-12 px-0 w-full min-w-0">
            <AIShopperWelcome
              onSelectPrompt={(prompt) => handleUserQuery(prompt)}
              onSendMessage={(query) => handleUserQuery(query)}
              loading={loading}
              className="w-full max-w-3xl"
            />
          </div>
        ) : (
          /* ══ SCREEN 2: ACTIVE EXPERIENCE ═══════════════════════════════ */
          <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch w-full min-w-0">
            
            {/* ─── LEFT COLUMN: AI Conversational Assistant Stream ─── */}
            <div className="w-full lg:w-[380px] xl:w-[420px] 2xl:w-[460px] shrink-0 h-[calc(100dvh-12.5rem)] lg:h-[calc(100vh-8.5rem)] flex flex-col bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-xs min-w-0">
              
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
                      /* User Bubble: High-contrast Ocean Blue #0078E8 meeting WCAG AA */
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#0078E8] text-white px-4 py-2.5 shadow-xs">
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

              {/* Bottom Anchored Pill Search Input matching Mockup 2 */}
              <div className="p-2 sm:p-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-slate-100 dark:border-neutral-800 min-w-0">
                <AIShopperInput
                  onSendMessage={handleUserQuery}
                  disabled={loading}
                  placeholder="Ask Anything..."
                />
              </div>
            </div>

            {/* ─── RIGHT COLUMN (Desktop Only): Wide Live Product Showcase ── */}
            <div className="hidden lg:flex flex-1 min-w-0 h-[calc(100vh-8.5rem)] overflow-y-auto pl-1 pr-1 space-y-4 hide-scrollbar flex-col">
              
              {/* Desktop Header Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Recommended Products for &quot;{currentQuery}&quot;
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Showing {displayProducts.length} verified item{displayProducts.length !== 1 ? 's' : ''} across Kenya • Direct seller chat
                  </p>
                </div>

                {comparingIds.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => setShowCompareModal(true)}
                    className="px-4 py-2 rounded-full bg-[#00BFFF] hover:bg-[#00abeb] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Scale className="w-4 h-4" />
                    <span>Compare ({comparingIds.length})</span>
                  </button>
                )}
              </div>

              {/* Fallback Notice Banner */}
              {isFallback && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                  <Info className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    Exact match was not found in current inventory. Showing top recommended alternatives from verified sellers on Suqafuran.
                  </span>
                </div>
              )}

              {/* Shopping Filter Pills */}
              <ShoppingFilters
                activeFilters={filters}
                onFilterChange={setFilters}
              />

              {/* Verified Seller Shops if available */}
              {sellers && sellers.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                    Recommended Shops
                  </span>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {sellers.map((s) => (
                      <SellerRecommendationCard key={s.id} seller={s} />
                    ))}
                  </div>
                </div>
              )}

              {/* Live Product Cards Grid */}
              {displayProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 xl:gap-6 w-full min-w-0 pb-8">
                  {displayProducts.map((p) => (
                    <ProductRecommendationCard
                      key={p.id}
                      product={p}
                      isFavorite={!!favoriteIds[p.id]}
                      onToggleFavorite={handleToggleFavorite}
                      onAddToCart={(prod) => handleAddToCart(prod, 1)}
                      onDirectChat={handleDirectChat}
                      onToggleCompare={handleToggleCompare}
                      isComparing={comparingIds.includes(p.id)}
                      onSelectProduct={(prod) => setSelectedProduct(prod)}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-8 text-center my-auto">
                  <Sparkles className="w-10 h-10 text-[#00BFFF] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    No products match the selected filters
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Clear your filter selection or ask Suqafuran AI in the chat to expand search criteria.
                  </p>
                </div>
              )}
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
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
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
