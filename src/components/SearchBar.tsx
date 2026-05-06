import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageField } from '../hooks/useLanguageField';
import { listingService } from '../services/listingService';
import { aiService } from '../services/aiService';
import { Search, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

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
    const [aiParsing, setAiParsing] = useState(false);

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

    const handleAiSearch = useCallback(async () => {
        const trimmed = query.trim();
        if (!trimmed) return;
        setAiParsing(true);
        setOpen(false);
        try {
            const res = await aiService.parseSearch(trimmed);
            const params = new URLSearchParams();
            if (res.q) params.set('q', res.q);
            if (res.location) params.set('location', res.location);
            if (res.min_price != null) params.set('minPrice', String(res.min_price));
            if (res.max_price != null) params.set('maxPrice', String(res.max_price));
            if (res.category_id) params.set('category', res.category_id);
            navigate(`/search?${params.toString()}`);
        } catch {
            handleSubmit(trimmed);
        } finally {
            setAiParsing(false);
        }
    }, [query, navigate, handleSubmit]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSubmit(query);
        if (e.key === 'Escape') setOpen(false);
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
                    {query && (
                        <button onClick={clear} className="shrink-0 text-gray-400 active:text-gray-600">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {query && (
                        <button
                            onClick={handleAiSearch}
                            disabled={aiParsing}
                            title="AI Smart Search"
                            className="shrink-0 text-primary-400 active:text-primary-600"
                        >
                            {aiParsing
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Sparkles className="h-3.5 w-3.5" />
                            }
                        </button>
                    )}
                    {query && (
                        <button
                            onClick={() => handleSubmit(query)}
                            className="shrink-0 bg-primary-500 text-white rounded-xl px-2.5 py-1 text-xs font-bold active:bg-primary-600"
                        >
                            {t('nav.search')}
                        </button>
                    )}
                </div>

                {showDropdown && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
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
                {query && (
                    <button
                        onClick={handleAiSearch}
                        disabled={aiParsing}
                        title="AI Smart Search — understands natural language"
                        className="h-full px-3 text-primary-400 hover:text-primary-600 border-r border-gray-100 transition-colors"
                    >
                        {aiParsing
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Sparkles className="h-4 w-4" />
                        }
                    </button>
                )}
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
