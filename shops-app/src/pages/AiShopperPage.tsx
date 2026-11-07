"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, Send, Search, MessageSquare, ShoppingCart, 
  ShieldCheck, Heart, MapPin, ChevronRight, Loader2, 
  RotateCcw, Check, Star, ArrowLeft, Camera, Mic, 
  MicOff, Volume2, Share2, Tag, CheckCheck, SlidersHorizontal,
  Flame, Zap, Compass, Eye, ShoppingBag, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchService, type AiShopperResult, type AiShopperProduct } from '@/services/searchService';
import { messageService } from '@/services/messageService';
import { useCart } from '@/store/useCart';
import { optimizeCloudinaryUrl } from '@/services/api';

// ─── 3D Metallic AI Sphere Mascot Component ──────────────────────────────────
interface MascotProps {
  size?: number;
  isFloating?: boolean;
  isThinking?: boolean;
  className?: string;
}

const AiMascotOrb: React.FC<MascotProps> = ({ 
  size = 130, 
  isFloating = true, 
  isThinking = false,
  className = "" 
}) => {
  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Floating 3D Sphere */}
      <motion.div
        animate={isFloating ? { y: [-6, 6, -6] } : {}}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: size, height: size }}
        className="relative"
      >
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer Sphere Chrome / Metallic Gradient */}
            <radialGradient id="sphereGrad" cx="38%" cy="32%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="18%" stopColor="#E0E7FF" />
              <stop offset="45%" stopColor="#94A3B8" />
              <stop offset="72%" stopColor="#475569" />
              <stop offset="100%" stopColor="#0F172A" />
            </radialGradient>

            {/* Glowing Edge Rim Light */}
            <radialGradient id="rimGlow" cx="50%" cy="50%" r="50%">
              <stop offset="85%" stopColor="#38BDF8" stopOpacity="0" />
              <stop offset="97%" stopColor="#60A5FA" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.4" />
            </radialGradient>

            {/* Dark Curved Glass Visor Gradient */}
            <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#090D16" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            {/* Visor Glass Gloss Highlight */}
            <linearGradient id="glassGloss" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>

            {/* Cyan Eye Neon Glow Filter */}
            <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ambient Outer Halo */}
          <circle cx="80" cy="80" r="76" fill="url(#rimGlow)" />

          {/* Main Metallic Sphere Body */}
          <circle cx="80" cy="80" r="72" fill="url(#sphereGrad)" />

          {/* Curved Organic Visor Pocket */}
          <path
            d="M 32 75 C 32 50, 128 50, 128 75 C 128 106, 98 122, 80 122 C 62 122, 32 106, 32 75 Z"
            fill="url(#visorGrad)"
          />

          {/* Visor Curved Glass Sheen */}
          <path
            d="M 36 72 C 38 54, 122 54, 124 72 C 110 60, 50 60, 36 72 Z"
            fill="url(#glassGloss)"
          />

          {/* Glowing Visor Cyber Eyes */}
          <g filter="url(#cyanGlow)">
            {/* Left Cyan LED Pill Eye */}
            <motion.rect
              animate={
                isThinking
                  ? { scaleY: [1, 0.2, 1], scaleX: [1, 1.2, 1] }
                  : { scaleY: [1, 1, 0.1, 1, 1] }
              }
              transition={{
                duration: isThinking ? 0.8 : 3.8,
                repeat: Infinity,
                times: isThinking ? [0, 0.5, 1] : [0, 0.9, 0.93, 0.96, 1],
              }}
              x="58"
              y="74"
              width="9"
              height="20"
              rx="4.5"
              fill="#00F5FF"
            />

            {/* Right Cyan LED Pill Eye */}
            <motion.rect
              animate={
                isThinking
                  ? { scaleY: [1, 0.2, 1], scaleX: [1, 1.2, 1] }
                  : { scaleY: [1, 1, 0.1, 1, 1] }
              }
              transition={{
                duration: isThinking ? 0.8 : 3.8,
                repeat: Infinity,
                times: isThinking ? [0, 0.5, 1] : [0, 0.9, 0.93, 0.96, 1],
              }}
              x="93"
              y="74"
              width="9"
              height="20"
              rx="4.5"
              fill="#00F5FF"
            />
          </g>

          {/* Top Specular Chrome Arc Highlight */}
          <ellipse
            cx="64"
            cy="36"
            rx="24"
            ry="11"
            transform="rotate(-25 64 36)"
            fill="#FFFFFF"
            opacity="0.65"
          />
        </svg>
      </motion.div>

      {/* Floating Dynamic Shadow Underneath */}
      {isFloating && (
        <motion.div
          animate={{ scale: [1, 0.75, 1], opacity: [0.35, 0.18, 0.35] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: size * 0.75, height: 12 }}
          className="mt-2 rounded-full bg-slate-950/40 dark:bg-black/60 blur-md pointer-events-none"
        />
      )}
    </div>
  );
};

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  suggestions?: string[];
  products?: AiShopperProduct[];
  timestamp: string;
}

const QUICK_TRENDING_CHIPS = [
  { label: "AI Picks", icon: Sparkles, query: "curated top trending picks" },
  { label: "Discounted Combos", icon: Tag, query: "discounted fashion and outfit combos" },
  { label: "Flash Sales", icon: Zap, query: "flash deals under 20k" },
  { label: "Old Money Style", icon: Compass, query: "old money outfits in neutral colors" },
  { label: "Smart TVs under 35k", icon: Flame, query: "smart tv under 35k in Nairobi" },
  { label: "Sneakers & Kicks", icon: ShoppingBag, query: "sneakers and sports shoes" },
];

export default function AiShopperPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem, getTotalCount } = useCart();
  const cartCount = getTotalCount();

  // Navigation / Active View State: 'welcome' | 'chat' | 'details'
  const urlQuery = searchParams.get('q') || '';
  const [currentView, setCurrentView] = useState<'welcome' | 'chat' | 'details'>(
    urlQuery ? 'chat' : 'welcome'
  );

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Record<number, boolean>>({});
  const [addedCartIds, setAddedCartIds] = useState<Record<number, boolean>>({});
  const [sendingChatId, setSendingChatId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<AiShopperProduct | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Conversation history
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (urlQuery) {
      return [
        {
          id: 'initial-user',
          sender: 'user',
          text: urlQuery,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
    }
    return [];
  });

  const [aiResult, setAiResult] = useState<AiShopperResult | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // When URL query exists on load or changes
  useEffect(() => {
    if (urlQuery) {
      setCurrentView('chat');
      executeAiSearch(urlQuery, true);
    }
  }, [urlQuery]);

  // Keep chat pinned to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, loading, currentView]);

  // Execute Core Search
  const executeAiSearch = async (queryText: string, isInitialFromUrl = false) => {
    const cleanQ = queryText.trim();
    if (!cleanQ) return;

    if (!isInitialFromUrl) {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: cleanQ,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    setInputVal('');
    setLoading(true);
    setCurrentView('chat');

    try {
      const res = await searchService.aiShop(cleanQ);
      setAiResult(res);

      const items = res.products || [];
      const kw = res.understood?.keywords || cleanQ;

      const agentText = res.ai_advice || (
        items.length > 0
          ? `Great choice! Here are curated results and verified marketplace listings for "${kw}".`
          : `I couldn't find exact matches for "${kw}". Here are recommended verified listings currently available on Suqafuran.`
      );

      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        text: agentText,
        products: items,
        suggestions: items.length > 0 ? [
          `Show items under budget`,
          `Ask sellers about instant delivery`,
          `Explore verified shops`,
        ] : [
          `Smart TVs under 35k`,
          `Sneakers & Sports Shoes`,
          `Laptops & Tech`,
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);

      // Automatically select the first product for inspection
      if (items.length > 0 && !selectedProduct) {
        setSelectedProduct(items[0]);
      }
    } catch (err) {
      console.error('AI Shopper execution error:', err);
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: `Here are popular trending marketplace listings you can explore right now.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Form submission handler
  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || loading) return;
    setSearchParams({ q: inputVal.trim() });
    executeAiSearch(inputVal.trim());
  };

  // Quick chip click
  const handleChipClick = (queryText: string) => {
    setSearchParams({ q: queryText });
    executeAiSearch(queryText);
  };

  // Direct product card click -> opens Screen 3 (Details)
  const handleOpenProductDetails = (prod: AiShopperProduct) => {
    setSelectedProduct(prod);
    setActiveImageIdx(0);
    setShowFullAbout(false);
    setCurrentView('details');
  };

  // Toggle favorite
  const toggleFavorite = (productId: number) => {
    setFavoriteIds((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Add to cart with feedback
  const handleAddToCart = (product: AiShopperProduct) => {
    addItem({
      id: String(product.id),
      title: product.title,
      price: product.price,
      image: product.image || '',
      seller_id: String(product.seller_id),
      seller_name: product.seller_name,
      quantity: 1,
    });
    setAddedCartIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedCartIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2500);
  };

  // Direct chat inquiry
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

  // Interactive Speech Recognition (Mic)
  const toggleSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Voice input is supported in Chrome, Safari, and Edge. Type your request in the box!");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-KE';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputVal(transcript);
          setSearchParams({ q: transcript });
          executeAiSearch(transcript);
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  // Photo / Camera Upload trigger
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const promptFromFilename = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const q = promptFromFilename && promptFromFilename.length > 3 ? promptFromFilename : "fashion outfit combo";
      setInputVal(q);
      setSearchParams({ q });
      executeAiSearch(q);
    }
  };

  // Reset to initial screen
  const handleResetToWelcome = () => {
    setSearchParams({});
    setAiResult(null);
    setSelectedProduct(null);
    setMessages([]);
    setCurrentView('welcome');
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-gradient-to-b from-[#7B88FF]/35 via-[#38BDF8]/20 to-[#E0E7FF]/70 dark:from-[#0B0F19] dark:via-[#111827] dark:to-[#0A0D14] flex flex-col items-center justify-between transition-colors duration-300">
      
      {/* Hidden File Input for Visual Search */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handlePhotoUpload} 
      />

      {/* Ambient Aurora Glow Circles */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/30 via-sky-400/25 to-purple-500/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Top Universal Floating Header ──────────────────────────────────── */}
      <header className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {currentView !== 'welcome' ? (
            <button
              type="button"
              onClick={() => {
                if (currentView === 'details') {
                  setCurrentView('chat');
                } else {
                  handleResetToWelcome();
                }
              }}
              className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm flex items-center justify-center text-slate-700 dark:text-white hover:bg-white transition-all cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}

          {/* Title Branding */}
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{currentView === 'details' ? 'Product Details' : currentView === 'chat' ? 'AI Assistant' : 'Suqafuran AI'}</span>
              {currentView === 'welcome' && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#0078E8]/10 text-[#0078E8] dark:bg-sky-400/20 dark:text-sky-300">
                  Sora AI
                </span>
              )}
            </h1>
            {currentView === 'chat' && (
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Action Icons: Favorites, Cart Button */}
        <div className="flex items-center gap-2">
          {currentView === 'details' && selectedProduct && (
            <button
              type="button"
              onClick={() => toggleFavorite(selectedProduct.id)}
              className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-sm flex items-center justify-center text-slate-700 dark:text-white hover:bg-white transition-all cursor-pointer"
              title="Save to favorites"
            >
              <Heart className={`w-5 h-5 transition-colors ${favoriteIds[selectedProduct.id] ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-white'}`} />
            </button>
          )}

          {currentView !== 'welcome' && (
            <button
              type="button"
              onClick={handleResetToWelcome}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md text-xs font-bold text-slate-700 dark:text-neutral-200 hover:bg-white border border-white/80 dark:border-white/10 shadow-xs transition-all cursor-pointer"
              title="New AI Session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          )}

          {/* Cart Floating Circle Icon */}
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="relative w-10 h-10 rounded-full bg-white/90 dark:bg-white/15 backdrop-blur-xl border border-white/90 dark:border-white/15 shadow-sm flex items-center justify-center text-slate-800 dark:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="View Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0078E8] text-white text-[10px] font-black flex items-center justify-center shadow-md animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ─── Main Content Container ────────────────────────────────────────── */}
      <main className="relative z-20 w-full flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto px-3 sm:px-6 pb-6 pt-2">
        <AnimatePresence mode="wait">

          {/* ════════════════════════════════════════════════════════════════════
              SCREEN 1: WELCOME SCREEN ("Shop with AI" - Center Phone)
             ════════════════════════════════════════════════════════════════════ */}
          {currentView === 'welcome' && (
            <motion.div
              key="welcome-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full max-w-xl mx-auto flex flex-col items-center justify-center text-center py-6 sm:py-12 my-auto"
            >
              {/* 3D Floating Mascot Robot */}
              <div className="mb-6">
                <AiMascotOrb size={140} isFloating={true} isThinking={loading} />
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Shop with AI
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-md mx-auto">
                Find the perfect product with AI-powered recommendations.
              </p>

              {/* Iridescent Frosted Glass Capsule Search Input */}
              <div className="w-full mt-7">
                <form
                  onSubmit={handleFormSubmit}
                  className="relative group w-full rounded-full p-[2px] bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 shadow-xl shadow-indigo-500/15"
                >
                  <div className="relative w-full h-14 sm:h-16 rounded-full bg-white/85 dark:bg-neutral-900/90 backdrop-blur-2xl flex items-center px-3 sm:px-4 gap-2 transition-all group-focus-within:bg-white dark:group-focus-within:bg-neutral-900">
                    
                    {/* Visual Search / Camera Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                      title="Upload photo / Visual search"
                    >
                      <Camera className="w-5 h-5" />
                    </button>

                    {/* Text Input */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      placeholder="Ask anything"
                      className="flex-1 h-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none"
                    />

                    {/* Voice Mic Input */}
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800'
                      }`}
                      title="Voice search"
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={loading || !inputVal.trim()}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0078E8] to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-md disabled:opacity-40 transition-all cursor-pointer shrink-0"
                      title="Search with AI"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Quick Prompt Pill Chips */}
              <div className="w-full mt-6 flex items-center justify-center gap-2 flex-wrap">
                {QUICK_TRENDING_CHIPS.map((chip, idx) => {
                  const ChipIcon = chip.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(chip.query)}
                      className="px-3.5 py-2 rounded-full text-xs font-bold bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 backdrop-blur-md text-slate-700 dark:text-neutral-200 border border-white/80 dark:border-white/10 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <ChipIcon className="w-3.5 h-3.5 text-[#0078E8] dark:text-sky-300" />
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              SCREEN 2: CONVERSATION & CARD CAROUSEL (Left Phone)
             ════════════════════════════════════════════════════════════════════ */}
          {currentView === 'chat' && (
            <motion.div
              key="chat-screen"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl flex-1 flex flex-col justify-between h-[calc(100vh-8.5rem)]"
            >
              {/* Chat Messages Feed Container */}
              <div 
                ref={chatScrollRef} 
                className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 space-y-6 hide-scrollbar"
              >
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-4">
                    {msg.sender === 'user' ? (
                      /* User Bubble (Right Aligned Frosted Glass Pill) */
                      <div className="flex justify-end">
                        <div className="max-w-[85%] sm:max-w-md rounded-3xl rounded-tr-md bg-white/90 dark:bg-white/20 backdrop-blur-xl border border-white/90 dark:border-white/10 px-5 py-3.5 shadow-sm text-slate-800 dark:text-white">
                          <p className="text-sm font-semibold leading-relaxed">{msg.text}</p>
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400 dark:text-slate-300 font-medium">
                            <span>{msg.timestamp}</span>
                            <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Agent Bubble & In-Chat Carousel (Left Aligned) */
                      <div className="space-y-3.5">
                        <div className="flex items-start gap-2.5 max-w-[92%] sm:max-w-xl">
                          {/* Mini AI Orb Avatar */}
                          <div className="w-8 h-8 rounded-full shrink-0 mt-0.5 overflow-hidden flex items-center justify-center bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-sm p-0.5">
                            <AiMascotOrb size={30} isFloating={false} />
                          </div>

                          <div className="flex-1 rounded-3xl rounded-tl-md bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/80 dark:border-white/10 px-5 py-3.5 shadow-sm text-slate-800 dark:text-neutral-100">
                            <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                            <span className="mt-1 block text-right text-[10px] text-slate-400">
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>

                        {/* ── Product Carousel Embedded In-Chat ── */}
                        {msg.products && msg.products.length > 0 && (
                          <div className="w-full pl-10">
                            <div className="flex items-center gap-3.5 overflow-x-auto hide-scrollbar py-2 px-1">
                              {msg.products.map((prod) => (
                                <motion.div
                                  key={prod.id}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleOpenProductDetails(prod)}
                                  className="shrink-0 w-[190px] sm:w-[220px] rounded-3xl bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl border border-white/90 dark:border-white/10 p-3 shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
                                >
                                  <div>
                                    {/* Product Image Container */}
                                    <div className="relative aspect-square w-full rounded-2xl bg-slate-100/80 dark:bg-neutral-800/80 overflow-hidden flex items-center justify-center p-2 mb-2.5">
                                      <img
                                        src={optimizeCloudinaryUrl(prod.image, { width: 400 }) || prod.image || '/icon1.png'}
                                        alt={prod.title}
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                      />
                                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md text-[9px] font-black uppercase text-slate-800 dark:text-neutral-200 shadow-2xs">
                                        Best Overall
                                      </span>
                                    </div>

                                    {/* Product Title */}
                                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#0078E8] transition-colors">
                                      {prod.title}
                                    </h4>

                                    {/* Rating */}
                                    <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-500">
                                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                      <span>4.8</span>
                                      <span className="text-gray-400 font-medium">(196)</span>
                                    </div>
                                  </div>

                                  {/* Price & Inspect CTA */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                      KSh {prod.price.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#0078E8] dark:text-sky-400 flex items-center">
                                      View <ChevronRight className="w-3 h-3" />
                                    </span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>

                            {/* Carousel Indicator Dots */}
                            <div className="flex items-center justify-center gap-1.5 mt-2">
                              <span className="w-6 h-1.5 rounded-full bg-[#0078E8]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-neutral-700" />
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-neutral-700" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading Typing Indicator */}
                {loading && (
                  <div className="flex items-center gap-3 pl-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-sm p-0.5">
                      <AiMascotOrb size={30} isFloating={false} isThinking={true} />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border border-white/60 dark:border-white/10 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0078E8] animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-[#0078E8] animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-[#0078E8] animate-bounce" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">
                        Curating marketplace looks...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Glass Capsule Bottom Input */}
              <div className="w-full pt-3 shrink-0">
                <form
                  onSubmit={handleFormSubmit}
                  className="relative group w-full rounded-full p-[1.5px] bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 shadow-lg shadow-indigo-500/10"
                >
                  <div className="relative w-full h-13 sm:h-14 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl flex items-center px-3 sm:px-4 gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                      title="Upload photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      placeholder="Ask anything..."
                      className="flex-1 h-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400'
                      }`}
                      title="Voice search"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !inputVal.trim()}
                      className="w-9 h-9 rounded-full bg-[#0078E8] text-white flex items-center justify-center shadow-md disabled:opacity-40 transition-all cursor-pointer shrink-0"
                      title="Send message"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              SCREEN 3: PRODUCT DETAILS SHEET (Right Phone)
             ════════════════════════════════════════════════════════════════════ */}
          {currentView === 'details' && selectedProduct && (
            <motion.div
              key="details-screen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl mx-auto flex flex-col justify-between bg-white/85 dark:bg-neutral-900/90 backdrop-blur-2xl border border-white/90 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[calc(100vh-8.5rem)]"
            >
              <div className="space-y-5">
                {/* Dual Image / Carousel Preview Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative aspect-square rounded-2xl bg-slate-100/90 dark:bg-neutral-800/90 border border-slate-200/60 dark:border-neutral-700/60 p-4 flex items-center justify-center overflow-hidden">
                    <img
                      src={optimizeCloudinaryUrl(selectedProduct.image, { width: 500 }) || selectedProduct.image || '/icon1.png'}
                      alt={selectedProduct.title}
                      className="w-full h-full object-contain select-none"
                    />
                  </div>

                  <div className="relative aspect-square rounded-2xl bg-slate-100/90 dark:bg-neutral-800/90 border border-slate-200/60 dark:border-neutral-700/60 p-4 flex items-center justify-center overflow-hidden">
                    <img
                      src={optimizeCloudinaryUrl(selectedProduct.image, { width: 500 }) || selectedProduct.image || '/icon1.png'}
                      alt={selectedProduct.title}
                      className="w-full h-full object-contain select-none opacity-90 scale-105"
                    />
                  </div>
                </div>

                {/* Pagination Dots */}
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-5 h-1.5 rounded-full bg-[#0078E8]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-neutral-700" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-neutral-700" />
                </div>

                {/* Title, Rating, Price */}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {selectedProduct.title}
                    </h3>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        KSh {selectedProduct.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 line-through">
                        KSh {Math.round(selectedProduct.price * 1.15).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">4.9</span>
                    <span className="text-xs text-slate-400">(256 verified reviews)</span>
                  </div>
                </div>

                <hr className="border-slate-200/80 dark:border-neutral-800" />

                {/* About Product Section */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">About</h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed font-medium">
                    {showFullAbout
                      ? `Verified marketplace item from ${selectedProduct.seller_name}. Located in ${selectedProduct.location || 'Kenya'}. Carefully checked for authenticity and quality. You can chat directly with the shop owner to inspect details, negotiate pricing, or arrange same-day delivery.`
                      : `Upgrade your purchase with this verified item, combining modern quality, trusted seller support, and versatile convenience...`}
                    <button
                      type="button"
                      onClick={() => setShowFullAbout(!showFullAbout)}
                      className="ml-1 text-xs font-bold text-[#0078E8] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {showFullAbout ? 'Show less' : 'See all'}
                    </button>
                  </p>
                </div>

                {/* Seller Badge & Store Info */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200/60 dark:border-neutral-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center">
                      {selectedProduct.seller_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                        <span>{selectedProduct.seller_name}</span>
                        {selectedProduct.is_verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </h5>
                      <p className="text-[11px] text-gray-500 dark:text-neutral-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{selectedProduct.location || 'Kenya'}</span>
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/listing/${selectedProduct.id}`}
                    className="text-xs font-bold text-[#0078E8] dark:text-sky-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Full Listing</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Action Buttons: Direct Chat & Add to Cart */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-200/80 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleDirectChat(selectedProduct)}
                  disabled={sendingChatId === selectedProduct.id}
                  className="h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-[#0078E8] dark:text-sky-300 text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {sendingChatId === selectedProduct.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>Direct Chat</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleAddToCart(selectedProduct)}
                  className="h-12 rounded-2xl bg-gradient-to-r from-[#0078E8] to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {addedCartIds[selectedProduct.id] ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}
