"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, CheckCircle2, ShoppingBag, Loader2, MapPin, Navigation, Search } from 'lucide-react';
import { loadGoogleMapsScript } from '../../lib/googleMaps';
import { useLocationStore } from '../../store/useLocation';
import { useCurrencyStore } from '../../store/useCurrency';
import { formatConvertedPrice } from '../../lib/currency';
import type { Listing } from '../../types';

interface OrderModalProps {
    listing: Listing;
    isOpen: boolean;
    onClose: () => void;
    onSubmitOrder: (orderDetails: { quantity: number; location: string; notes: string }) => Promise<void>;
}

export const OrderModal: React.FC<OrderModalProps> = ({ listing, isOpen, onClose, onSubmitOrder }) => {
    const savedCity = useLocationStore((s) => s.city);
    const displayCurrency = useCurrencyStore((s) => s.currency);
    const [quantity, setQuantity] = useState(1);
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [geoError, setGeoError] = useState('');
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const geocoder = useRef<google.maps.Geocoder | null>(null);
    const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        loadGoogleMapsScript().then(() => {
            autocompleteService.current = new google.maps.places.AutocompleteService();
            geocoder.current = new google.maps.Geocoder();
            sessionToken.current = new google.maps.places.AutocompleteSessionToken();
        });
        // Prefill from the user's already-set location, if they haven't typed anything yet.
        setLocation((prev) => prev || savedCity || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const fetchSuggestions = useCallback((input: string) => {
        if (!input.trim() || !autocompleteService.current) {
            setSuggestions([]);
            return;
        }
        autocompleteService.current.getPlacePredictions(
            { input, sessionToken: sessionToken.current ?? undefined },
            (results, status) => {
                setSuggestions(status === google.maps.places.PlacesServiceStatus.OK && results ? results : []);
            }
        );
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchSuggestions(location), 300);
        return () => clearTimeout(timer);
    }, [location, fetchSuggestions]);

    const handleSelectSuggestion = (suggestion: google.maps.places.AutocompletePrediction) => {
        setLocation(suggestion.description);
        setSuggestions([]);
        setShowSuggestions(false);
        sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation is not supported by your browser.');
            return;
        }
        setDetecting(true);
        setGeoError('');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                if (!geocoder.current) await loadGoogleMapsScript();
                geocoder.current = geocoder.current || new google.maps.Geocoder();

                geocoder.current.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                    setDetecting(false);
                    if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                        setLocation(results[0].formatted_address);
                        setShowSuggestions(false);
                        setSuggestions([]);
                    } else {
                        setGeoError('Could not determine your address from this location.');
                    }
                });
            },
            (err) => {
                setDetecting(false);
                setGeoError(err.code === err.PERMISSION_DENIED ? 'Location permission denied.' : `Error getting location: ${err.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmitOrder({ quantity, location, notes });
            setIsSuccess(true);
        } catch (err) {
            console.error('Order placement failed', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div 
                className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 animate-scale-in border border-gray-100 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-black text-gray-900 dark:text-slate-100">
                            {isSuccess ? 'Order Placed!' : 'Place Your Order'}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-400 hover:bg-slate-50 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {isSuccess ? (
                    /* Success Layout */
                    <div className="p-8 text-center flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-accent/10 text-accent flex items-center justify-center animate-bounce">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                                Order Successfully Created!
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium px-4">
                                Your order for <strong className="text-gray-900 dark:text-slate-100">{listing.title_en}</strong> has been shared with the seller. They will contact you shortly to coordinate delivery.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setIsSuccess(false);
                                onClose();
                            }}
                            className="btn-premium w-full mt-4 bg-primary text-white py-3 shadow-lg shadow-primary/20 hover:bg-primary-dark"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    /* Order Details Form */
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Summary */}
                        <div className="flex gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                            <img 
                                src={listing.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop'} 
                                alt={listing.title_en} 
                                className="h-16 w-16 rounded-xl object-cover shrink-0"
                            />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 line-clamp-1">{listing.title_en}</h4>
                                <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold">{listing.condition || 'New'}</p>
                                <p className="text-sm font-black text-primary dark:text-sky-400">
                                    {formatConvertedPrice(listing.price, listing.currency || 'USD', displayCurrency)}
                                </p>
                            </div>
                        </div>

                        {/* Quantity inputs */}
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-bold text-gray-700 dark:text-slate-300">Quantity</span>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">Select items to buy</p>
                            </div>
                            <div className="flex items-center gap-3 border border-gray-200 dark:border-slate-800 rounded-2xl p-1 bg-slate-50 dark:bg-slate-950">
                                <button
                                    type="button"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="h-8 w-8 rounded-xl bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 shadow-sm flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer"
                                >
                                    -
                                </button>
                                <span className="w-6 text-center text-sm font-black text-gray-900 dark:text-slate-100">{quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="h-8 w-8 rounded-xl bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 shadow-sm flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Location details */}
                        <div className="space-y-1.5 relative">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>Delivery Location</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter street name, building, apartment or city..."
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                    className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 pr-11 text-sm font-medium text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                />
                                <button
                                    type="button"
                                    onClick={handleUseCurrentLocation}
                                    disabled={detecting}
                                    title="Use current location"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/15 disabled:opacity-50 cursor-pointer"
                                >
                                    {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                                </button>
                            </div>

                            {geoError && <p className="text-xs font-semibold text-red-500">{geoError}</p>}

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s.place_id}
                                            type="button"
                                            onClick={() => handleSelectSuggestion(s)}
                                            className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                                        >
                                            <Search className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{s.structured_formatting?.main_text || s.description}</p>
                                                {s.structured_formatting?.secondary_text && (
                                                    <p className="text-[11px] text-gray-400 truncate">{s.structured_formatting.secondary_text}</p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">
                                Notes (Optional)
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Enter any instructions for delivery or contact details..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 resize-none"
                            />
                        </div>

                        {/* Submit Action buttons */}
                        <div className="pt-2 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-premium flex-1 bg-slate-50 border border-gray-200 text-gray-600 py-3 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !location.trim()}
                                className="btn-premium flex-1 bg-accent text-white py-3 shadow-lg shadow-accent/20 hover:bg-green-600 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <span>Submit Order</span>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
