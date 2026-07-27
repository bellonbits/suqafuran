"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Store, Star, ShieldCheck, Navigation, Loader2, MapPin } from 'lucide-react';
import { businessService } from '../../../services/business';
import { loadGoogleMapsScript } from '../../../lib/googleMaps';
import { useLocationStore } from '../../../store/useLocation';
import type { Business } from '../../../types';

type NearbyBusiness = Business & { distance_km?: number };

export default function StoresPage() {
    const { city, lat, lng, setLocation } = useLocationStore();
    const [businesses, setBusinesses] = useState<NearbyBusiness[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [ratingFilter, setRatingFilter] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [locating, setLocating] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<google.maps.Map | null>(null);
    const markers = useRef<Map<string, google.maps.Marker>>(new Map());
    const infoWindow = useRef<google.maps.InfoWindow | null>(null);

    useEffect(() => {
        setLoading(true);
        businessService.getNearbyShops({ lat: lat ?? undefined, lng: lng ?? undefined, limit: 100 })
            .then((data) => setBusinesses(data || []))
            .catch(() => setBusinesses([]))
            .finally(() => setLoading(false));
    }, [lat, lng]);

    // Initialize the map once.
    useEffect(() => {
        if (!mapRef.current) return;
        loadGoogleMapsScript().then(() => {
            mapInstance.current = new google.maps.Map(mapRef.current as HTMLDivElement, {
                center: { lat: lat ?? 2.0469, lng: lng ?? 45.3182 }, // defaults to Mogadishu
                zoom: lat && lng ? 12 : 6,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            });
            infoWindow.current = new google.maps.InfoWindow();
            setMapReady(true);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const categories = Array.from(new Set(businesses.map((b) => b.category).filter(Boolean)));

    const filtered = businesses.filter((b) => {
        if (categoryFilter && b.category !== categoryFilter) return false;
        if (ratingFilter && b.rating < 4.5) return false;
        return true;
    });

    const renderInfoContent = (b: NearbyBusiness) =>
        `<div style="font-family:inherit;min-width:160px"><strong>${b.name}</strong><br/>${b.rating ? ` ${b.rating.toFixed(1)}` : ''}${b.distance_km != null ? ` · ${b.distance_km.toFixed(1)} km` : ''}</div>`;

    // Sync markers whenever the filtered list or map readiness changes.
    useEffect(() => {
        if (!mapReady || !mapInstance.current) return;
        const map = mapInstance.current;

        markers.current.forEach((m) => m.setMap(null));
        markers.current.clear();

        const bounds = new google.maps.LatLngBounds();
        let hasAny = false;

        filtered.forEach((b) => {
            if (b.location_lat == null || b.location_lng == null) return;
            const position = { lat: b.location_lat, lng: b.location_lng };
            const marker = new google.maps.Marker({
                map,
                position,
                title: b.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: '#6cd4ff',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                },
            });
            marker.addListener('click', () => {
                setSelectedId(b.id);
                infoWindow.current?.setContent(renderInfoContent(b));
                infoWindow.current?.open(map, marker);
            });
            markers.current.set(b.id, marker);
            bounds.extend(position);
            hasAny = true;
        });

        if (hasAny && !lat && !lng) {
            map.fitBounds(bounds);
        }
    }, [filtered, mapReady, lat, lng]);

    const focusBusiness = useCallback((b: NearbyBusiness) => {
        setSelectedId(b.id);
        if (!mapInstance.current || b.location_lat == null || b.location_lng == null) return;
        mapInstance.current.panTo({ lat: b.location_lat, lng: b.location_lng });
        mapInstance.current.setZoom(15);
        const marker = markers.current.get(b.id);
        if (marker) {
            infoWindow.current?.setContent(renderInfoContent(b));
            infoWindow.current?.open(mapInstance.current, marker);
        }
    }, []);

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation(city, latitude, longitude);
                mapInstance.current?.panTo({ lat: latitude, lng: longitude });
                mapInstance.current?.setZoom(13);
                setLocating(false);
            },
            () => setLocating(false),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 font-poppins">Browse Stores</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {city ? `Near ${city}` : 'Set your location to sort by distance'}
                    </p>
                </div>
                <button
                    onClick={handleLocateMe}
                    disabled={locating}
                    className="btn-premium bg-primary/10 text-primary px-4 py-2 text-xs hover:bg-primary/15 disabled:opacity-50"
                >
                    {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
                    Use my location
                </button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setCategoryFilter('')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize cursor-pointer ${!categoryFilter ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                    All categories
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize cursor-pointer ${categoryFilter === cat ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300'}`}
                    >
                        {cat}
                    </button>
                ))}
                <button
                    onClick={() => setRatingFilter((v) => !v)}
                    className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer ${ratingFilter ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                    <Star className="h-3 w-3" /> 4.5+
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 h-[calc(100vh-13rem)] min-h-[480px]">
                <div className="overflow-y-auto space-y-3 pr-1 order-2 lg:order-1">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-slate-900 animate-pulse" />
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center space-y-3">
                            <Store className="h-10 w-10 text-gray-300 mx-auto" />
                            <p className="font-bold text-gray-500">No nearby stores found</p>
                            <p className="text-xs text-gray-400">Try a different location or category</p>
                        </div>
                    ) : (
                        filtered.map((b) => (
                            <button
                                key={b.id}
                                onClick={() => focusBusiness(b)}
                                className={`w-full text-left p-4 rounded-2xl border card-shadow bg-white dark:bg-slate-900 transition-all cursor-pointer ${selectedId === b.id ? 'border-primary' : 'border-gray-100 dark:border-slate-800'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {b.logo_url ? (
                                        <img src={b.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                                    ) : (
                                        <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 font-black shrink-0">
                                            {b.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-sm font-black text-gray-900 dark:text-slate-100 truncate">{b.name}</h4>
                                            {b.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />}
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold capitalize truncate">
                                            {b.rating > 0 && <> {b.rating.toFixed(1)} · </>}
                                            {b.category}
                                            {b.distance_km != null && <> · {b.distance_km.toFixed(1)} km</>}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={`/shop/${b.slug}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-3 inline-block text-[11px] font-black text-primary hover:underline"
                                >
                                    View store →
                                </Link>
                            </button>
                        ))
                    )}
                </div>

                <div className="order-1 lg:order-2 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 relative min-h-[320px]">
                    <div ref={mapRef} className="h-full w-full bg-slate-100 dark:bg-slate-900" />
                    {!mapReady && (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 gap-2 bg-slate-50 dark:bg-slate-950">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading map...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
