import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, XCircle, ChevronRight, ChevronLeft, Globe, Navigation } from 'lucide-react';
import type { State, Region } from '../utils/somaliRegions';
import { SOMALI_STATES } from '../utils/somaliRegions';
import { useLocationStore } from '../store/useLocationStore';
import { getCountryInfo } from '../utils/eastAfricanCities';

const GOOGLE_API_KEY = 'AIzaSyDV3YpLO1MEXJWvpGMr_cIV-TaRfkvHPbs';

declare global {
    interface Window { google: any; }
}

let scriptLoaded = false;
let scriptLoading = false;
const scriptCallbacks: Array<() => void> = [];

function loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve) => {
        if (scriptLoaded && window.google?.maps?.places) { resolve(); return; }
        scriptCallbacks.push(resolve);
        if (scriptLoading) return;
        scriptLoading = true;
        const s = document.createElement('script');
        s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
        s.async = true;
        s.onload = () => {
            scriptLoaded = true;
            scriptLoading = false;
            scriptCallbacks.forEach(cb => cb());
            scriptCallbacks.length = 0;
        };
        document.head.appendChild(s);
    });
}

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (location: string) => void;
    title?: string;
}

type SelectionLevel = 'state' | 'region' | 'town';
type Tab = 'local' | 'google';

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
    isOpen, onClose, onSelect, title = 'Choose Location',
}) => {
    const { countryCode } = useLocationStore();
    const country = getCountryInfo(countryCode);
    // For Somalia we still show the hierarchical region/town drilldown.
    const useSomaliPicker = country?.code === 'SO';
    const hasFlatCityList = !!country && !useSomaliPicker;

    const [tab, setTab] = useState<Tab>(country ? 'local' : 'google');
    const [level, setLevel] = useState<SelectionLevel>('state');
    const [selectedState, setSelectedState] = useState<State | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [googleReady, setGoogleReady] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const autocompleteService = useRef<any>(null);
    const sessionToken = useRef<any>(null);
    const geocoder = useRef<any>(null);

    useEffect(() => {
        if (!isOpen) return;
        setLoadingGoogle(true);
        loadGoogleMapsScript().then(() => {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
            geocoder.current = new window.google.maps.Geocoder();
            sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
            setGoogleReady(true);
            setLoadingGoogle(false);
        });
    }, [isOpen]);

    const fetchSuggestions = useCallback((input: string) => {
        if (!input.trim() || !autocompleteService.current) { setSuggestions([]); return; }
        autocompleteService.current.getPlacePredictions(
            { input, sessionToken: sessionToken.current },
            (results: any[], status: string) => {
                if (status === 'OK') setSuggestions(results);
                else setSuggestions([]);
            }
        );
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchSuggestions(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchSuggestions]);

    const handleGoogleSelect = (suggestion: any) => {
        onSelect(suggestion.description);
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
        setSuggestions([]);
        setSearchQuery('');
        onClose();
    };

    // Somali drilldown
    const handleBack = () => {
        if (level === 'town') { setLevel('region'); setSelectedRegion(null); }
        else if (level === 'region') { setLevel('state'); setSelectedState(null); }
    };

    const localQuery = tab === 'local' ? searchQuery : '';
    const filteredSomali = useMemo(() => {
        if (!useSomaliPicker) return [];
        const q = localQuery.toLowerCase().trim();
        if (level === 'state') return SOMALI_STATES.filter(s => s.name.toLowerCase().includes(q) || s.regions.some(r => r.name.toLowerCase().includes(q)));
        if (level === 'region' && selectedState) return selectedState.regions.filter(r => r.name.toLowerCase().includes(q));
        if (level === 'town' && selectedRegion) return selectedRegion.towns.filter(t => t.toLowerCase().includes(q));
        return [];
    }, [useSomaliPicker, level, selectedState, selectedRegion, localQuery]);

    const filteredCities = useMemo(() => {
        if (!hasFlatCityList || !country) return [];
        const q = localQuery.toLowerCase().trim();
        return q ? country.cities.filter(c => c.toLowerCase().includes(q)) : country.cities;
    }, [hasFlatCityList, country, localQuery]);

    const handleSomaliSelect = (item: any) => {
        setSearchQuery('');
        if (level === 'state') { setSelectedState(item); setLevel('region'); }
        else if (level === 'region') { setSelectedRegion(item); setLevel('town'); }
        else {
            onSelect(`${item}, ${selectedRegion?.name}, ${selectedState?.name}`);
            onClose();
            setTimeout(() => { setLevel('state'); setSelectedState(null); setSelectedRegion(null); }, 300);
        }
    };

    const handleCitySelect = (city: string) => {
        onSelect(country ? `${city}, ${country.name}` : city);
        onClose();
    };

    const resetModal = () => {
        setTab(country ? 'local' : 'google');
        setSearchQuery('');
        setSuggestions([]);
        setLevel('state');
        setSelectedState(null);
        setSelectedRegion(null);
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                if (!geocoder.current) {
                    await loadGoogleMapsScript();
                    geocoder.current = new window.google.maps.Geocoder();
                }

                geocoder.current.geocode(
                    { location: { lat: latitude, lng: longitude } },
                    (results: any[], status: string) => {
                        setDetecting(false);
                        if (status === 'OK' && results[0]) {
                            const result = results[0];
                            const city = result.address_components.find((c: any) => c.types.includes('locality'))?.long_name;
                            const region = result.address_components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name;

                            const displayName = city && region ? `${city}, ${region}` : result.formatted_address;
                            onSelect(displayName);
                            onClose();
                        } else {
                            alert('Could not determine your location');
                        }
                    }
                );
            },
            (error) => {
                setDetecting(false);
                alert(`Error getting location: ${error.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const localTabLabel = country ? country.name : 'Local';

    return (
        <AnimatePresence onExitComplete={resetModal}>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="fixed left-0 right-0 bottom-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl z-[9999] overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {tab === 'local' && useSomaliPicker && level !== 'state' && (
                                    <button onClick={handleBack} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                                    </button>
                                )}
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                                    <p className="text-xs text-primary-500 font-semibold mt-0.5">
                                        {tab === 'google' ? 'Search any location worldwide' :
                                            useSomaliPicker ? (
                                                level === 'state' ? 'Select Region' :
                                                level === 'region' ? `Regions in ${selectedState?.name}` :
                                                `Towns in ${selectedRegion?.name}`
                                            ) : `Cities in ${country?.name ?? 'your country'}`}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <XCircle className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Tab switcher */}
                        <div className="px-5 pb-3">
                            <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
                                {country && (
                                    <button
                                        onClick={() => { setTab('local'); setSearchQuery(''); setSuggestions([]); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'local' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <MapPin className="w-4 h-4" /> {localTabLabel}
                                    </button>
                                )}
                                <button
                                    onClick={() => { setTab('google'); setSearchQuery(''); setSuggestions([]); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'google' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Globe className="w-4 h-4" /> Worldwide
                                </button>
                            </div>
                        </div>

                        {/* Current Location Button */}
                        <div className="px-5 pb-2">
                            <button
                                onClick={handleGetCurrentLocation}
                                disabled={detecting}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary-50 text-primary-600 font-bold text-sm hover:bg-primary-100 transition-all active:scale-98 disabled:opacity-50"
                            >
                                <Navigation className={`w-4 h-4 ${detecting ? 'animate-pulse' : ''}`} />
                                {detecting ? 'Detecting Location...' : 'Use Current Location'}
                            </button>
                        </div>

                        {/* Search input */}
                        <div className="px-5 pb-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={
                                        tab === 'google'
                                            ? 'Search any city, town, or address…'
                                            : useSomaliPicker
                                                ? `Search ${level}…`
                                                : `Search cities in ${country?.name ?? ''}…`
                                    }
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button onClick={() => { setSearchQuery(''); setSuggestions([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <XCircle className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-5 pb-6">

                            {/* ── Worldwide tab ── */}
                            {tab === 'google' && (
                                <div className="space-y-1.5">
                                    {loadingGoogle && !googleReady && (
                                        <div className="flex items-center justify-center py-10 text-sm text-gray-400">Loading Google Maps…</div>
                                    )}

                                    {googleReady && !searchQuery && (
                                        <div className="py-8 flex flex-col items-center text-center">
                                            <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mb-3">
                                                <Search className="w-6 h-6 text-primary-400" />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-700">Type to search any location</p>
                                            <p className="text-xs text-gray-400 mt-1">Powered by Google Maps</p>
                                        </div>
                                    )}

                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleGoogleSelect(s)}
                                            className="w-full flex items-start gap-3 p-3.5 rounded-2xl hover:bg-primary-50 transition-colors text-left group border border-transparent hover:border-primary-100"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                                                <MapPin className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{s.structured_formatting?.main_text}</p>
                                                <p className="text-xs text-gray-400 truncate mt-0.5">{s.structured_formatting?.secondary_text}</p>
                                            </div>
                                        </button>
                                    ))}

                                    {googleReady && searchQuery && suggestions.length === 0 && (
                                        <div className="py-10 text-center text-sm text-gray-400">No results found for "{searchQuery}"</div>
                                    )}
                                </div>
                            )}

                            {/* ── Local tab — Somali drilldown ── */}
                            {tab === 'local' && useSomaliPicker && (
                                <div className="space-y-1.5">
                                    {level === 'state' && (
                                        <button
                                            onClick={() => { onSelect('All Locations'); onClose(); }}
                                            className="w-full text-left p-4 rounded-2xl hover:bg-primary-50 text-gray-600 font-medium transition-colors flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                                                    <MapPin className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                                                </div>
                                                <span>All Locations</span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                        </button>
                                    )}

                                    {filteredSomali.map((item: any, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSomaliSelect(item)}
                                            className="w-full text-left p-4 rounded-2xl hover:bg-primary-50 text-gray-800 font-semibold transition-all flex items-center justify-between group border border-transparent hover:border-primary-100"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:text-primary-600 transition-colors shadow-sm">
                                                    <MapPin className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900">{level === 'town' ? item : item.name}</span>
                                                    {level === 'state' && <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{item.regions.length} Regions</span>}
                                                    {level === 'region' && <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{item.towns.length} Towns</span>}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                        </button>
                                    ))}

                                    {filteredSomali.length === 0 && localQuery && (
                                        <div className="py-12 flex flex-col items-center text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-gray-900 font-bold text-sm">No locations found</p>
                                            <p className="text-xs text-gray-500 mt-1">Try the Worldwide tab instead</p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-4 justify-center">
                                        {['state', 'region', 'town'].map((l, i) => (
                                            <React.Fragment key={l}>
                                                <span className={`w-2 h-2 rounded-full transition-all ${level === l ? 'bg-primary-600 scale-125' : (i < ['state','region','town'].indexOf(level) ? 'bg-primary-300' : 'bg-gray-200')}`} />
                                                {i < 2 && <span className={`flex-1 h-0.5 max-w-[40px] ${i < ['state','region','town'].indexOf(level) ? 'bg-primary-300' : 'bg-gray-200'}`} />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Local tab — flat city list for non-Somalia countries ── */}
                            {tab === 'local' && hasFlatCityList && (
                                <div className="space-y-1.5">
                                    <button
                                        onClick={() => { onSelect('All Locations'); onClose(); }}
                                        className="w-full text-left p-4 rounded-2xl hover:bg-primary-50 text-gray-600 font-medium transition-colors flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                                                <MapPin className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                                            </div>
                                            <span>All Locations</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                    </button>

                                    {filteredCities.map((city) => (
                                        <button
                                            key={city}
                                            onClick={() => handleCitySelect(city)}
                                            className="w-full text-left p-4 rounded-2xl hover:bg-primary-50 text-gray-800 font-semibold transition-all flex items-center justify-between group border border-transparent hover:border-primary-100"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                                                    <MapPin className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                                                </div>
                                                <span className="text-gray-900">{city}</span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                        </button>
                                    ))}

                                    {filteredCities.length === 0 && (
                                        <div className="py-12 flex flex-col items-center text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-gray-900 font-bold text-sm">No cities found</p>
                                            <p className="text-xs text-gray-500 mt-1">Try the Worldwide tab instead</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
