"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Navigation, Loader2, Bookmark, Trash2, LogIn, Star } from 'lucide-react';
import { loadGoogleMapsScript } from '../../lib/googleMaps';
import { useLocationStore } from '../../store/useLocation';
import { useAuthStore } from '../../store/useAuth';
import { useAuthModal } from '../../store/useAuthModal';
import { addressesService } from '../../services/addresses';
import type { SavedAddress } from '../../types';

type PlaceSuggestion = google.maps.places.AutocompletePrediction;

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_KENYA_CITIES = [
    { name: 'Nairobi', description: 'Capital City, Kenya', lat: -1.2865, lng: 36.8172 },
    { name: 'Mombasa', description: 'Coastal City, Kenya', lat: -4.0435, lng: 39.6682 },
    { name: 'Kisumu', description: 'Lake City, Kenya', lat: -0.1022, lng: 34.7617 },
    { name: 'Nakuru', description: 'Central Kenya', lat: -0.2833, lng: 36.0667 },
    { name: 'Eldoret', description: 'Uasin Gishu, Kenya', lat: 0.5143, lng: 35.2799 },
    { name: 'Kericho', description: 'Tea Country, Kenya', lat: -0.3667, lng: 35.2833 },
    { name: 'Nyeri', description: 'Central Kenya', lat: -0.4167, lng: 36.9500 },
    { name: 'Machakos', description: 'Eastern Kenya', lat: -2.7149, lng: 37.2656 },
    { name: 'Kakamega', description: 'Western Kenya', lat: 0.2838, lng: 34.7542 },
    { name: 'Lamu', description: 'Coastal Island, Kenya', lat: -2.2625, lng: 40.9028 },
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose }) => {
    const { city, lat, lng, setLocation, setPermissionAsked } = useLocationStore();
    const { isAuthenticated } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const [defaultCities, setDefaultCities] = useState<typeof DEFAULT_KENYA_CITIES>([]);
    const [googleReady, setGoogleReady] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState('');
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [saveLabel, setSaveLabel] = useState('Home');
    const [saving, setSaving] = useState(false);
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const geocoder = useRef<google.maps.Geocoder | null>(null);
    const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

    const refreshSavedAddresses = useCallback(() => {
        if (!isAuthenticated) return;
        setLoadingSaved(true);
        addressesService.list()
            .then(setSavedAddresses)
            .catch(() => setSavedAddresses([]))
            .finally(() => setLoadingSaved(false));
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isOpen) return;
        loadGoogleMapsScript().then(() => {
            try {
                autocompleteService.current = new google.maps.places.AutocompleteService();
                geocoder.current = new google.maps.Geocoder();
                sessionToken.current = new google.maps.places.AutocompleteSessionToken();
                setGoogleReady(true);
            } catch (error) {
                console.error('Google Maps initialization failed:', error);
                setGoogleReady(true);
            }
        }).catch(error => {
            console.error('Failed to load Google Maps:', error);
            setGoogleReady(true);
        });
        refreshSavedAddresses();
        setShowSaveForm(false);
        setDefaultCities(DEFAULT_KENYA_CITIES);
    }, [isOpen, refreshSavedAddresses]);

    const fetchSuggestions = useCallback((input: string) => {
        if (!input.trim() || !autocompleteService.current) {
            setSuggestions([]);
            return;
        }
        try {
            autocompleteService.current.getPlacePredictions(
                { input, sessionToken: sessionToken.current ?? undefined },
                (results, status) => {
                    setSuggestions(status === google.maps.places.PlacesServiceStatus.OK && results ? results : []);
                }
            );
        } catch (error) {
            console.error('Autocomplete error:', error);
            setSuggestions([]);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchSuggestions(query), 300);
        return () => clearTimeout(timer);
    }, [query, fetchSuggestions]);

    const handleSelectSuggestion = (suggestion: PlaceSuggestion) => {
        if (!geocoder.current) return;
        geocoder.current.geocode({ placeId: suggestion.place_id }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                const loc = results[0].geometry.location;
                const country = results[0].address_components.find((c) => c.types.includes('country'))?.short_name;
                setLocation(suggestion.description, loc.lat(), loc.lng(), country);
            } else {
                setLocation(suggestion.description, null, null);
            }
            sessionToken.current = new google.maps.places.AutocompleteSessionToken();
            setQuery('');
            setSuggestions([]);
            onClose();
        });
    };

    const reverseGeocodeWithNominatim = async (latitude: number, longitude: number) => {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 4000);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                {
                    headers: { 'Accept-Language': 'en', 'User-Agent': 'SuqafuranApp/1.0' },
                    signal: controller.signal,
                }
            );
            clearTimeout(timer);
            const data = await response.json();
            if (data && data.address) {
                const { city, town, village, county, state, country_code } = data.address;
                const displayName = city || town || village || data.name || 'Unknown Location';
                const region = county || state || '';
                const fullName = region ? `${displayName}, ${region}` : displayName;
                return { displayName: fullName, country: country_code?.toUpperCase() };
            }
        } catch (err) {
            console.error('Nominatim geocoding failed:', err);
        }
        return null;
    };

    const fetchLocationFromIP = async (): Promise<{ displayName: string; lat: number; lng: number; country: string } | null> => {
        // 1. Try ipwho.is (fast, reliable, provides lat/lng and location)
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3500);
            const res = await fetch('https://ipwho.is/', { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
                const data = await res.json();
                if (data && data.success && data.latitude && data.longitude) {
                    const cityName = data.city || data.region || 'Nairobi';
                    const country = (data.country_code || 'KE').toUpperCase();
                    const region = data.region && data.region !== cityName ? data.region : (data.country || 'Kenya');
                    return {
                        displayName: `${cityName}, ${region}`,
                        lat: Number(data.latitude),
                        lng: Number(data.longitude),
                        country,
                    };
                }
            }
        } catch {
            // fallback
        }

        // 2. Fallback to ipapi.co
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3500);
            const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
                const data = await res.json();
                if (data && !data.error && data.latitude && data.longitude) {
                    const cityName = data.city || data.region || 'Nairobi';
                    const country = (data.country_code || 'KE').toUpperCase();
                    const region = data.region && data.region !== cityName ? data.region : (data.country_name || 'Kenya');
                    return {
                        displayName: `${cityName}, ${region}`,
                        lat: Number(data.latitude),
                        lng: Number(data.longitude),
                        country,
                    };
                }
            }
        } catch {
            // fallback
        }

        return null;
    };

    const resolveAndSetLocation = async (latitude: number, longitude: number) => {
        // 1. Try Google Maps Geocoder if ready
        if (geocoder.current) {
            try {
                const gResult = await new Promise<{ displayName: string; country?: string } | null>((resolve) => {
                    geocoder.current?.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                        if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                            const result = results[0];
                            const locality = result.address_components.find((c) => c.types.includes('locality'))?.long_name;
                            const region = result.address_components.find((c) => c.types.includes('administrative_area_level_1'))?.long_name;
                            const country = result.address_components.find((c) => c.types.includes('country'))?.short_name;
                            const displayName = locality && region ? `${locality}, ${region}` : result.formatted_address;
                            resolve({ displayName, country });
                        } else {
                            resolve(null);
                        }
                    });
                });
                if (gResult) {
                    setLocation(gResult.displayName, latitude, longitude, gResult.country || 'KE');
                    setDetecting(false);
                    onClose();
                    return;
                }
            } catch (err) {
                console.warn('Google reverse geocode error:', err);
            }
        }

        // 2. Try Nominatim reverse geocode
        const nominatimResult = await reverseGeocodeWithNominatim(latitude, longitude);
        if (nominatimResult) {
            setLocation(nominatimResult.displayName, latitude, longitude, nominatimResult.country || 'KE');
            setDetecting(false);
            onClose();
            return;
        }

        // 3. Fallback: match nearest Kenyan city or format coords so valid GPS is NEVER discarded
        let nearestCity = DEFAULT_KENYA_CITIES[0];
        let minDistance = Infinity;
        for (const c of DEFAULT_KENYA_CITIES) {
            const d = Math.hypot(c.lat - latitude, c.lng - longitude);
            if (d < minDistance) {
                minDistance = d;
                nearestCity = c;
            }
        }
        const displayName = minDistance < 0.5
            ? `${nearestCity.name} Area`
            : `GPS Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;

        setLocation(displayName, latitude, longitude, 'KE');
        setDetecting(false);
        onClose();
    };

    const handleUseCurrentLocation = (forceIpFallback = false) => {
        setPermissionAsked(true);
        setError('');

        if (forceIpFallback) {
            setDetecting(true);
            fetchLocationFromIP().then((ipLoc) => {
                setDetecting(false);
                if (ipLoc) {
                    setLocation(ipLoc.displayName, ipLoc.lat, ipLoc.lng, ipLoc.country);
                    onClose();
                } else {
                    setError('Could not detect network location. Please pick a city below.');
                }
            });
            return;
        }

        if (!navigator.geolocation) {
            setDetecting(true);
            fetchLocationFromIP().then((ipLoc) => {
                setDetecting(false);
                if (ipLoc) {
                    setLocation(ipLoc.displayName, ipLoc.lat, ipLoc.lng, ipLoc.country);
                    onClose();
                } else {
                    setError('Geolocation is not supported by your browser. Please search or pick a city below.');
                }
            });
            return;
        }

        setDetecting(true);

        // Attempt 1: High Accuracy GPS (Satellite hardware sensor)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolveAndSetLocation(position.coords.latitude, position.coords.longitude);
            },
            (geoError) => {
                // If high accuracy GPS timed out or was temporarily unavailable (e.g. indoors/simulator),
                // attempt 2: standard accuracy with short cache
                if (geoError.code !== geoError.PERMISSION_DENIED) {
                    navigator.geolocation.getCurrentPosition(
                        (fallbackPosition) => {
                            resolveAndSetLocation(fallbackPosition.coords.latitude, fallbackPosition.coords.longitude);
                        },
                        async () => {
                            // GPS failed: automatically attempt IP Geolocation fallback
                            const ipLoc = await fetchLocationFromIP();
                            setDetecting(false);
                            if (ipLoc) {
                                setLocation(ipLoc.displayName, ipLoc.lat, ipLoc.lng, ipLoc.country);
                                onClose();
                            } else {
                                setError('GPS signal unavailable. Please select your city below or search manually.');
                            }
                        },
                        { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
                    );
                } else {
                    // PERMISSION_DENIED: Attempt seamless IP fallback so user isn't blocked
                    fetchLocationFromIP().then((ipLoc) => {
                        setDetecting(false);
                        if (ipLoc) {
                            setLocation(ipLoc.displayName, ipLoc.lat, ipLoc.lng, ipLoc.country);
                            onClose();
                        } else {
                            setError('Please enable location access in your device/browser settings, or choose a city below.');
                        }
                    });
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSelectSaved = (addr: SavedAddress) => {
        setLocation(addr.formatted_address, addr.lat ?? null, addr.lng ?? null);
        onClose();
    };

    const handleSelectDefaultCity = (city: typeof DEFAULT_KENYA_CITIES[0]) => {
        setLocation(city.name, city.lat, city.lng, 'KE');
        onClose();
    };

    const handleDeleteSaved = async (e: React.MouseEvent, addr: SavedAddress) => {
        e.stopPropagation();
        try {
            await addressesService.remove(addr.id);
            setSavedAddresses((prev) => prev.filter((a) => a.id !== addr.id));
        } catch (err) {
            console.error('Failed to delete saved address', err);
        }
    };

    const handleSaveCurrentLocation = async () => {
        if (!city || !saveLabel.trim()) return;
        setSaving(true);
        try {
            const created = await addressesService.create({
                label: saveLabel.trim(),
                formatted_address: city,
                lat: lat ?? undefined,
                lng: lng ?? undefined,
            });
            setSavedAddresses((prev) => [created, ...prev]);
            setShowSaveForm(false);
        } catch (err) {
            console.error('Failed to save address', err);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
            <div
                className="w-full mx-4 max-w-md max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-950 border border-gray-100 dark:border-neutral-800 flex flex-col animate-scale-in"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '28rem' }}
            >
                <div className="flex justify-between items-center p-5 pb-3">
                    <h3 className="text-sm font-black text-gray-900 dark:text-neutral-50 font-poppins flex items-center gap-1.5">
                        <MapPin className="h-4.5 w-4.5 text-primary" />
                        <span>Choose Location</span>
                    </h3>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-50 dark:hover:bg-neutral-900 text-gray-400 transition-colors cursor-pointer">
                        <X className="h-4.5 w-4.5" />
                    </button>
                </div>

                <div className="px-5 pb-3 space-y-2">
                    <button
                        onClick={() => handleUseCurrentLocation(false)}
                        disabled={detecting}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/15 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                        {detecting ? 'Acquiring GPS / Location...' : 'Use GPS Location'}
                    </button>
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/40 space-y-2">
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => handleUseCurrentLocation(true)}
                                    className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-gray-700 dark:text-neutral-200 hover:bg-gray-50 cursor-pointer shadow-sm transition-all"
                                >
                                    Use Network (IP) Location
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSelectDefaultCity(DEFAULT_KENYA_CITIES[0])}
                                    className="px-3 py-1.5 bg-primary/10 rounded-xl text-xs font-bold text-primary hover:bg-primary/20 cursor-pointer transition-all"
                                >
                                    Use Nairobi (Default)
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-neutral-400">On iOS Simulator: Simulator menu - Features - Location - Custom Location or preset</p>
                        </div>
                    )}
                </div>

                <div className="px-5 pb-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search any city, town, or address..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-2xl text-sm font-semibold outline-none focus:border-primary dark:text-neutral-50 transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-1">
                    {!googleReady && (
                        <div className="flex items-center justify-center py-8 text-sm text-gray-400 gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                        </div>
                    )}

                    {googleReady && !query && (
                        <div className="space-y-3">
                            {!isAuthenticated ? (
                                <button
                                    onClick={() => { openAuthModal('signin'); onClose(); }}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 dark:bg-neutral-900 text-gray-700 dark:text-neutral-100 font-bold text-sm cursor-pointer"
                                >
                                    <LogIn className="h-4 w-4" /> Sign in for saved addresses
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[11px] font-black text-gray-400 dark:text-neutral-400 uppercase tracking-wider">Saved Addresses</h4>
                                        {city && !showSaveForm && (
                                            <button
                                                onClick={() => { setShowSaveForm(true); setSaveLabel('Home'); }}
                                                className="flex items-center gap-1 text-[11px] font-black text-primary hover:underline cursor-pointer"
                                            >
                                                <Bookmark className="h-3 w-3" /> Save current location
                                            </button>
                                        )}
                                    </div>

                                    {showSaveForm && (
                                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-black border border-gray-200 dark:border-neutral-800 space-y-2">
                                            <p className="text-xs font-semibold text-gray-600 dark:text-neutral-200 truncate">{city}</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={saveLabel}
                                                    onChange={(e) => setSaveLabel(e.target.value)}
                                                    placeholder="Label (e.g. Home, Work)"
                                                    className="flex-1 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:text-neutral-50"
                                                />
                                                <button
                                                    onClick={handleSaveCurrentLocation}
                                                    disabled={saving || !saveLabel.trim()}
                                                    className="btn-premium bg-primary text-white px-3 py-2 text-xs disabled:opacity-50"
                                                >
                                                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {loadingSaved ? (
                                        <div className="flex items-center justify-center py-4 text-xs text-gray-400 gap-2">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading saved addresses...
                                        </div>
                                    ) : savedAddresses.length === 0 ? (
                                        <p className="text-xs text-gray-400 py-2">No saved addresses yet — search a location and save it for quick reuse.</p>
                                    ) : (
                                        savedAddresses.map((addr) => (
                                            <button
                                                key={addr.id}
                                                onClick={() => handleSelectSaved(addr)}
                                                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors text-left cursor-pointer group"
                                            >
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-neutral-900 flex items-center justify-center shrink-0">
                                                    {addr.is_default ? <Star className="w-4 h-4 text-amber-500" /> : <MapPin className="w-4 h-4 text-gray-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-neutral-50 truncate">{addr.label}</p>
                                                    <p className="text-xs text-gray-400 truncate">{addr.formatted_address}</p>
                                                </div>
                                                <span
                                                    role="button"
                                                    onClick={(e) => handleDeleteSaved(e, addr)}
                                                    className="p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            <div className="pt-3 space-y-2">
                                <h4 className="text-[11px] font-black text-gray-400 dark:text-neutral-400 uppercase tracking-wider px-0">Popular Cities in Kenya</h4>
                                {defaultCities.map((city) => (
                                    <button
                                        key={city.name}
                                        onClick={() => handleSelectDefaultCity(city)}
                                        className="w-full flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors text-left cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-neutral-900 flex items-center justify-center shrink-0 mt-0.5">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-neutral-50 truncate">{city.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{city.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="pt-2 flex flex-col items-center text-center text-gray-400">
                                <Search className="h-5 w-5 mb-1.5" />
                                <p className="text-xs font-semibold text-gray-500 dark:text-neutral-300">Or type to search any location worldwide</p>
                            </div>
                        </div>
                    )}

                    {suggestions.map((s) => (
                        <button
                            key={s.place_id}
                            onClick={() => handleSelectSuggestion(s)}
                            className="w-full flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors text-left cursor-pointer"
                        >
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-neutral-900 flex items-center justify-center shrink-0 mt-0.5">
                                <MapPin className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-neutral-50 truncate">{s.structured_formatting?.main_text || s.description}</p>
                                {s.structured_formatting?.secondary_text && (
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{s.structured_formatting.secondary_text}</p>
                                )}
                            </div>
                        </button>
                    ))}

                    {googleReady && query && suggestions.length === 0 && (
                        <div className="py-10 text-center text-sm text-gray-400">No results found for &quot;{query}&quot;</div>
                    )}
                </div>
            </div>
        </div>
    );
};
