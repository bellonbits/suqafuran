import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageField } from '../hooks/useLanguageField';
import { listingService } from '../services/listingService';
import { Search, X, ArrowRight, Loader2, Sparkles, Mic, TrendingUp } from 'lucide-react';
import { aiService } from '../services/aiService';
import { getImageUrl } from '../utils/imageUtils';
import { cn } from '../utils/cn';

interface SearchBarProps {
    /** 'desktop' = full bar with dropdown panel; 'mobile' = compact inline input */
    variant?: 'desktop' | 'mobile';
    placeholder?: string;
    className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    variant = 'desktop',
    placeholder,
    className = '',
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { getField } = useLanguageField();

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce the query by 300 ms
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Fetch suggestions whenever debouncedQuery changes
    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setSuggestions([]);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        listingService
            .getListings({ q: debouncedQuery, limit: 6 })
            .then((data) => {
                if (!cancelled) setSuggestions(data || []);
            })
            .catch(() => {
                if (!cancelled) setSuggestions([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [debouncedQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSubmit = useCallback((q: string) => {
        const trimmed = q.trim();
        if (!trimmed) return;
        setOpen(false);
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }, [navigate]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSubmit(query);
        if (e.key === 'Escape') setOpen(false);
    };

    const [isListening, setIsListening] = useState(false);

    const handleVoiceSearch = () => {
        setIsListening(true);
        // Simulate speech recognition
        setTimeout(() => {
            const results = ["Toyota Vitz", "iPhone 13", "Gaming Laptop", "Furniture in Nairobi"];
            const random = results[Math.floor(Math.random() * results.length)];
            setQuery(random);
            setIsListening(false);
            // Auto-trigger search after 500ms
            setTimeout(() => handleSubmit(random), 500);
        }, 2000);
    };

    const handleAISmartSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const filters = await aiService.parseSearch(query);
            let url = `/search?q=${encodeURIComponent(filters.q || query)}`;
            if (filters.location) url += `&location=${encodeURIComponent(filters.location)}`;
            if (filters.category_id) url += `&category=${encodeURIComponent(filters.category_id)}`;
            if (filters.min_price) url += `&min_price=${filters.min_price}`;
            if (filters.max_price) url += `&max_price=${filters.max_price}`;
            setOpen(false);
            navigate(url);
        } catch (err) {
            console.error("Smart search failed", err);
            handleSubmit(query);
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        setQuery('');
        setSuggestions([]);
        setOpen(false);
        inputRef.current?.focus();
    };

    const showDropdown = open && query.trim().length >= 2;

    // ── MOBILE VARIANT ──────────────────────────────────────────────────────
    if (variant === 'mobile') {
        return (
            <div ref={containerRef} className={`relative ${className}`}>
                <div className="flex items-center gap-2 bg-white/95 rounded-2xl px-4 h-11 shadow-md">
                    <Search className="h-4 w-4 shrink-0 text-primary-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder || t('nav.search')}
                        className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none min-w-0"
                    />
                    {!query && (
                         <button
                            type="button"
                            onClick={handleVoiceSearch}
                            className={cn(
                                "shrink-0 p-1.5 rounded-lg transition-all",
                                isListening ? "bg-red-50 text-red-500 animate-pulse" : "text-gray-400 hover:text-primary-500"
                            )}
                        >
                            <Mic className="h-4 w-4" />
                        </button>
                    )}
                    {query && (
                        <button onClick={clear} className="shrink-0 text-gray-400 active:text-gray-600">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {query && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleAISmartSearch}
                                disabled={loading}
                                className="shrink-0 bg-primary-50 text-primary-600 rounded-xl px-2.5 py-1 text-xs font-bold active:scale-95 transition-all border border-primary-100 flex items-center gap-1"
                            >
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                ✨ Smart
                            </button>
                            <button
                                onClick={() => handleSubmit(query)}
                                className="shrink-0 bg-primary-500 text-white rounded-xl px-2.5 py-1 text-xs font-bold active:bg-primary-600"
                            >
                                {t('nav.search')}
                            </button>
                        </div>
                    )}
                </div>

                {showDropdown && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        {/* Trending Keywords Section */}
                        <div className="p-3 bg-gray-50/50 border-b border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <TrendingUp size={10} className="text-primary-500" />
                                Trending Now
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {['iPhone', 'Toyota', 'Mogadishu', 'Laptops'].map(kw => (
                                    <button
                                        key={kw}
                                        onClick={() => { setQuery(kw); handleSubmit(kw); }}
                                        className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-all shadow-sm"
                                    >
                                        {kw}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {loading && (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-primary-400" />
                            </div>
                        )}
                        {!loading && suggestions.length === 0 && (
                            <p className="text-center text-xs text-gray-400 py-4">
                                {t('search.noResults', 'No results found')}
                            </p>
                        )}
                        {!loading && suggestions.map((item) => (
                            <SuggestionRow
                                key={item.id}
                                item={item}
                                getField={getField}
                                onSelect={() => { setOpen(false); navigate(`/listing/${item.id}`); }}
                            />
                        ))}
                        <button
                            onClick={() => handleSubmit(query)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-primary-50 hover:bg-primary-100 transition-colors border-t border-gray-100"
                        >
                            <span className="text-xs font-bold text-primary-700">
                                {t('search.seeAllFor', 'See all results for')} &ldquo;{query}&rdquo;
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-primary-500" />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ── DESKTOP VARIANT ─────────────────────────────────────────────────────
    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="flex h-14 bg-white rounded-r-2xl overflow-visible">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder || t('landing.searchPlaceholder')}
                    className="flex-1 h-full pl-4 pr-2 text-gray-900 focus:outline-none placeholder:text-gray-400 font-medium bg-transparent"
                />
                {query && (
                    <button onClick={clear} className="px-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                )}
                <div className="h-full flex items-center bg-gray-50 border-l border-gray-100 px-2 group">
                    <button
                        type="button"
                        onClick={handleVoiceSearch}
                        className={cn(
                            "p-2 rounded-xl transition-all active:scale-95",
                            isListening ? "bg-red-100 text-red-500 animate-pulse" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        )}
                    >
                        <Mic className="h-4 w-4" />
                    </button>
                </div>
                <div className="h-full flex items-center bg-gray-50 border-l border-gray-100 px-2 group">
                    <button
                        onClick={handleAISmartSearch}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-600 font-bold text-xs rounded-xl transition-all border border-primary-100 active:scale-95"
                    >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        <span className="hidden lg:inline">✨ Smart Shop Search</span>
                        <span className="lg:hidden">✨ Smart</span>
                    </button>
                </div>
                <button
                    onClick={() => handleSubmit(query)}
                    className="h-full px-5 bg-primary-500 hover:bg-primary-600 transition-colors flex items-center gap-2 text-white font-semibold text-sm rounded-r-2xl"
                >
                    {loading
                        ? <Loader2 className="h-5 w-5 animate-spin" />
                        : <Search className="h-5 w-5" />
                    }
                    <span className="hidden sm:inline">{t('nav.search')}</span>
                </button>
            </div>

            {showDropdown && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {loading && (
                        <div className="flex items-center gap-2 px-4 py-3 text-gray-400 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('search.searching', 'Searching...')}
                        </div>
                    )}
                    {!loading && suggestions.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-5">
                            {t('search.noResults', 'No results found')}
                        </p>
                    )}
                    {!loading && suggestions.map((item) => (
                        <SuggestionRow
                            key={item.id}
                            item={item}
                            getField={getField}
                            onSelect={() => { setOpen(false); navigate(`/listing/${item.id}`); }}
                        />
                    ))}
                    <button
                        onClick={() => handleSubmit(query)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-primary-50 hover:bg-primary-100 transition-colors border-t border-gray-100"
                    >
                        <span className="text-sm font-bold text-primary-700">
                            {t('search.seeAllFor', 'See all results for')} &ldquo;{query}&rdquo;
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary-500" />
                    </button>
                </div>
            )}
        </div>
    );
};

// ── Shared suggestion row ────────────────────────────────────────────────────
const SuggestionRow: React.FC<{
    item: any;
    getField: (obj: any, field: string) => string;
    onSelect: () => void;
}> = ({ item, getField, onSelect }) => {
    const title = getField(item, 'title') || item.title_en || item.title_so || '';
    const thumb = item.images?.[0];
    const price = item.price != null
        ? `${item.currency || 'USD'} ${Number(item.price).toLocaleString()}`
        : '';

    return (
        <button
            onClick={onSelect}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
        >
            <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                {thumb
                    ? <img src={getImageUrl(thumb)} alt="" className="w-full h-full object-cover" />
                    : <Search className="h-4 w-4 text-gray-300" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
                {item.location && (
                    <p className="text-xs text-gray-400 truncate">{item.location}</p>
                )}
            </div>
            {price && (
                <span className="text-xs font-bold text-primary-600 shrink-0">{price}</span>
            )}
        </button>
    );
};
