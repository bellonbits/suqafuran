"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, ShoppingCart, Heart, ArrowLeft, RotateCcw, 
  ChevronRight, Scale, X, MapPin, Store, ShieldCheck, 
  MessageSquare, SlidersHorizontal, Check, ExternalLink
} from 'lucide-react';
import { 
  AIShopperWelcome,
  SuggestedPrompts,
  AIShopperChat,
  ProductResultsGrid,
  ProductComparisonTable,
  SellerRecommendationCard,
  ShoppingFilters,
  AIShopperInput,
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
import { optimizeCloudinaryUrl } from '@/services/api';

export default function AiShopperPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

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

  // Filters
  const [filters, setFilters] = useState<{
    maxPrice?: number;
    location?: string;
    condition?: string;
    verifiedOnly?: boolean;
  }>({});

  // Product Comparison state
  const [comparingIds, setComparingIds] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Selected Product for Quick Inspection Modal
  const [selectedProduct, setSelectedProduct] = useState<ShopperProduct | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Record<number, boolean>>({});

  // Mobile active tab ('results' or 'chat')
  const [mobileTab, setMobileTab] = useState<'results' | 'chat'>('results');

  // Trigger search on mount if url query is present
  useEffect(() => {
    if (urlQuery.trim()) {
      handleUserQuery(urlQuery.trim(), true);
    }
  }, [urlQuery]);

  // Execute Search / Chat
  const handleUserQuery = async (queryText: string, isFromUrl = false) => {
    const cleanQ = queryText.trim();
    if (!cleanQ) return;

    setCurrentQuery(cleanQ);
    if (!isFromUrl) {
      setSearchParams({ q: cleanQ });
    }

    // Add user message to chat
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: cleanQ,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
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
        setShowCompareModal(true);
      }

      // Add agent reply to chat
      const agentMsg: ChatMsg = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followups: response.suggested_followups || [],
        products: response.products || [],
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error("AI Shopper Chat error:", err);
      // Fallback response
      const fallbackMsg: ChatMsg = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: "Here are top recommended verified listings currently available on Suqafuran.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Prompt Selection from Welcome Screen or Followups
  const handleSelectPrompt = (promptText: string) => {
    handleUserQuery(promptText);
  };

  // Reset Session
  const handleResetSession = () => {
    setSearchParams({});
    setCurrentQuery("");
    setMessages([]);
    setProducts([]);
    setSellers([]);
    setComparingIds([]);
    setComparisonData(null);
    setSelectedProduct(null);
    setConversationId('session-' + Date.now());
  };

  // Add to cart
  const handleAddToCart = (product: ShopperProduct) => {
    addItem({
      id: String(product.id),
      title: product.title,
      price: product.price,
      image: product.image || '',
      seller_id: String(product.seller_id),
      seller_name: product.seller_name,
      quantity: 1,
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

  // Launch comparison modal
  const handleOpenCompareModal = async () => {
    if (comparingIds.length < 2) return;
    setLoading(true);
    try {
      const comp = await aiShopperService.compare(comparingIds, currentQuery);
      if (comp) {
        setComparisonData(comp);
        setShowCompareModal(true);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  // Photo upload
  const handlePhotoUpload = (file: File) => {
    const promptFromFilename = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    const q = promptFromFilename && promptFromFilename.length > 3 ? promptFromFilename : "fashion deals";
    handleUserQuery(q);
  };

  // Filtered products
  const displayProducts = products.filter(p => {
    if (filters.maxPrice && p.price > filters.maxPrice) return false;
    if (filters.location && !p.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.condition && !p.condition.toLowerCase().includes(filters.condition.toLowerCase())) return false;
    if (filters.verifiedOnly && !p.is_verified) return false;
    return true;
  });

  const isInitialWelcome = messages.length === 0 && !currentQuery;

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white flex flex-col">
      {/* ─── Top Header Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-slate-200 dark:border-neutral-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Return to marketplace"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00BFFF] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Suqafuran AI Shopper
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Personal Marketplace Concierge
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isInitialWelcome && (
            <button
              type="button"
              onClick={handleResetSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Session</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="relative w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-200 hover:bg-[#00BFFF] hover:text-white transition-colors cursor-pointer"
            title="View Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00BFFF] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ─── Main Content Body ────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col">
        {isInitialWelcome ? (
          /* ══ SCREEN 1: WELCOME SCREEN ═══════════════════════════════ */
          <div className="my-auto flex flex-col items-center justify-center py-10">
            <AIShopperWelcome onSelectPrompt={handleSelectPrompt} />

            {/* Main Natural Language Search Input */}
            <div className="w-full max-w-2xl mt-4 px-2">
              <AIShopperInput
                onSendMessage={handleUserQuery}
                onPhotoUpload={handlePhotoUpload}
                disabled={loading}
                placeholder="What are you shopping for? (e.g. laptop for coding under 60k)..."
              />
            </div>
          </div>
        ) : (
          /* ══ SCREEN 2: DUAL PANE AI SHOPPER INTERFACE (Desktop / Mobile) ══ */
          <div className="flex-1 flex flex-col lg:flex-row gap-5 items-stretch">
            
            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex rounded-xl bg-slate-200 dark:bg-neutral-800 p-1 mb-2">
              <button
                type="button"
                onClick={() => setMobileTab('results')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mobileTab === 'results'
                    ? 'bg-white dark:bg-neutral-900 text-[#00BFFF] shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400'
                }`}
              >
                Products ({displayProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('chat')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mobileTab === 'chat'
                    ? 'bg-white dark:bg-neutral-900 text-[#00BFFF] shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400'
                }`}
              >
                AI Assistant
              </button>
            </div>

            {/* ─── LEFT COLUMN: AI Agent Conversation Sidebar ───── */}
            <div className={`w-full lg:w-[400px] shrink-0 h-[calc(100vh-9.5rem)] ${
              mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
            }`}>
              <AIShopperChat
                messages={messages}
                loading={loading}
                onSendMessage={handleUserQuery}
                onSelectFollowup={handleSelectPrompt}
                onResetSession={handleResetSession}
                className="w-full h-full"
              />
            </div>

            {/* ─── RIGHT COLUMN: Results, Filters & Product Grid ─── */}
            <div className={`flex-1 flex flex-col space-y-4 overflow-y-auto max-h-[calc(100vh-9.5rem)] hide-scrollbar ${
              mobileTab === 'results' ? 'flex' : 'hidden lg:flex'
            }`}>
              
              {/* Results Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-neutral-800">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Showing search results for &quot;{currentQuery}&quot;
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    {displayProducts.length} verified recommendation{displayProducts.length !== 1 ? 's' : ''} across Kenya • Safe in-app communication
                  </p>
                </div>

                {comparingIds.length >= 2 && (
                  <button
                    type="button"
                    onClick={handleOpenCompareModal}
                    className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-[#00BFFF] hover:bg-[#02CCFE] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Compare ({comparingIds.length})</span>
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <ShoppingFilters
                activeFilters={filters}
                onFilterChange={setFilters}
              />

              {/* Verified Sellers Carousel if applicable */}
              {sellers && sellers.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                    Recommended Shops
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sellers.slice(0, 2).map((s) => (
                      <SellerRecommendationCard key={s.id} seller={s} />
                    ))}
                  </div>
                </div>
              )}

              {/* Product Grid */}
              <div className="flex-1">
                <ProductResultsGrid
                  products={displayProducts}
                  loading={loading}
                  query={currentQuery}
                  isFallback={isFallback}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToCart={handleAddToCart}
                  onDirectChat={handleDirectChat}
                  onToggleCompare={handleToggleCompare}
                  comparingIds={comparingIds}
                  onOpenCompareModal={handleOpenCompareModal}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                />
              </div>
            </div>

          </div>
        )}
      </main>

      {/* ─── Side-by-Side Product Comparison Modal ────────────────── */}
      {showCompareModal && comparisonData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <ProductComparisonTable
            comparison={comparisonData}
            onClose={() => setShowCompareModal(false)}
            onAddToCart={handleAddToCart}
            onDirectChat={handleDirectChat}
          />
        </div>
      )}

      {/* ─── Product Details Modal ─────────────────────────────────── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 p-5 sm:p-6 shadow-2xl max-w-xl w-full">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Product Image */}
            <div className="aspect-square w-full rounded-2xl bg-slate-50 dark:bg-neutral-800 p-4 flex items-center justify-center overflow-hidden mb-4 border border-slate-100 dark:border-neutral-800">
              <img
                src={optimizeCloudinaryUrl(selectedProduct.image, { width: 600 }) || selectedProduct.image || '/icon1.png'}
                alt={selectedProduct.title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-[#00BFFF]">
                  KSh {selectedProduct.price.toLocaleString()}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  {selectedProduct.condition}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedProduct.title}
              </h2>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400">
                <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-neutral-200">
                  <Store className="w-3.5 h-3.5 text-[#00BFFF]" />
                  {selectedProduct.seller_name}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedProduct.location}
                </span>
              </div>

              {/* Attributes / Specs if available */}
              {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/50 space-y-1 text-xs">
                  <span className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                    Specifications:
                  </span>
                  {Object.entries(selectedProduct.attributes).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-slate-600 dark:text-neutral-400">
                      <span className="capitalize">{k.replace(/_/g, ' ')}:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="py-2.5 rounded-xl bg-[#00BFFF] hover:bg-[#02CCFE] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDirectChat(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-neutral-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-[#00BFFF]" />
                  <span>Chat with Seller</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <Link
                  to={selectedProduct.listing_url}
                  className="text-xs font-semibold text-[#00BFFF] hover:underline inline-flex items-center gap-1"
                >
                  <span>View full listing page</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
