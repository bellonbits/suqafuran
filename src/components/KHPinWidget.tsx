import React, { useState, useEffect } from 'react';
import { MapPin, Share2, PhoneCall, Search, Navigation, Copy, Check, Target, PlusCircle, Info } from 'lucide-react';
import { khService } from '../services/khService';
import type { KHPinDetails } from '../services/khService';
import { Button } from './Button';
import { cn } from '../utils/cn';

interface KHPinWidgetProps {
    initialCode?: string;
}

const KHPinWidget: React.FC<KHPinWidgetProps> = ({ initialCode }) => {
    const [code, setCode] = useState(initialCode || '');
    const [details, setDetails] = useState<KHPinDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showEmergency, setShowEmergency] = useState(false);
    const [mode, setMode] = useState<'view' | 'create'>('view');
    const [createdPin, setCreatedPin] = useState<string | null>(null);

    useEffect(() => {
        if (code && code.length >= 6) {
            handleLookup();
        }
    }, [code]);

    const handleLookup = async () => {
        if (!code) return;
        setLoading(true);
        try {
            const data = await khService.getPinDetails(code);
            setDetails(data);
        } catch (error) {
            console.error('Error fetching PIN details:', error);
            setDetails(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!code) return;
        navigator.clipboard.writeText(`My KH Digital Address: ${code}\nLocation: ${details?.landmark_name || ''} ${details?.place_name || ''}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnWhatsApp = () => {
        const pinToShare = createdPin || code;
        const text = encodeURIComponent(`My KAALAY HEEDHE Digital Address is ${pinToShare}. Locate me at: ${details?.landmark_name || ''} ${details?.place_name || ''}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleCreatePin = async () => {
        setLoading(true);
        try {
            // 1. Get location
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            // 2. Create PIN via service
            // Note: For MVP we use dummy place_id=1. Real app would lookup place_id from backend based on lat/lng
            const newPin = await khService.createPin({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                place_id: 1, // Defaulting to the first seeded city for demo
                privacy_level: 'public'
            });

            setCreatedPin(newPin.code);
            setCode(newPin.code);
            setMode('view');

            // Refresh details
            const data = await khService.getPinDetails(newPin.code);
            setDetails(data);
        } catch (error) {
            console.error('Error creating PIN:', error);
            alert('Failed to get location. Please enable GPS.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-md w-full mx-auto">
            {/* Header */}
            <div className="bg-primary-500 p-6 text-white relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <Navigation className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold">Kaalay Heedhe</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowEmergency(!showEmergency)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all animate-pulse"
                        >
                            <PhoneCall className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <p className="text-white/80 text-[10px] mt-2 font-bold uppercase tracking-widest leading-none">
                    National Digital Address System
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => { setMode('view'); setShowEmergency(false); }}
                    className={cn(
                        "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2",
                        mode === 'view' && !showEmergency ? "border-primary-500 text-primary-600 bg-primary-50/30" : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                >
                    <Search className="h-3.5 w-3.5" />
                    Lookup
                </button>
                <button
                    onClick={() => { setMode('create'); setShowEmergency(false); }}
                    className={cn(
                        "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2",
                        mode === 'create' && !showEmergency ? "border-primary-500 text-primary-600 bg-primary-50/30" : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Create
                </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {showEmergency ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                        <h4 className="font-bold text-red-600 flex items-center gap-2 uppercase tracking-wider text-xs">
                            <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                            Emergency Contacts
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <a href="tel:888" className="bg-red-50 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-red-100 hover:bg-red-100 transition-colors group">
                                <span className="text-2xl font-black text-red-600 group-hover:scale-110 transition-transform">888</span>
                                <span className="text-xs font-bold text-red-700">POLICE</span>
                            </a>
                            <a href="tel:555" className="bg-orange-50 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-orange-100 hover:bg-orange-100 transition-colors group">
                                <span className="text-2xl font-black text-orange-600 group-hover:scale-110 transition-transform">555</span>
                                <span className="text-xs font-bold text-orange-700">FIRE</span>
                            </a>
                        </div>
                        <button
                            onClick={() => setShowEmergency(false)}
                            className="w-full py-2 text-gray-400 text-xs font-medium hover:text-gray-600"
                        >
                            Back to Address
                        </button>
                    </div>
                ) : mode === 'create' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center space-y-4">
                            <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
                                <Target className="h-8 w-8 text-white animate-pulse" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">Generate My PIN</h4>
                                <p className="text-sm text-gray-500">We'll use your current coordinates to create a unique digital address for this location.</p>
                            </div>
                            <Button
                                onClick={handleCreatePin}
                                disabled={loading}
                                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold text-lg gap-2"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    <>
                                        <MapPin className="h-5 w-5" />
                                        Pin My Location
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
                            <Info className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-gray-500 leading-normal font-medium">
                                By creating a PIN, you're making this location discoverable by its KH-CODE. You can set it to private in your account settings later.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Enter KH-PIN (e.g. KH-A1B2)"
                                className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono uppercase tracking-widest text-lg font-bold"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                            {loading && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"></div>
                                </div>
                            )}
                        </div>

                        {/* Result Details */}
                        {details || createdPin ? (
                            <div className="bg-primary-50/50 rounded-2xl p-5 border border-primary-100 space-y-4 animate-in zoom-in-95 duration-300">
                                {createdPin && mode === 'view' && (
                                    <div className="bg-green-500 text-white px-2 py-1 rounded-md text-[8px] font-bold absolute -top-2 left-6 animate-bounce">
                                        NEWLY CREATED
                                    </div>
                                )}
                                <div className="flex items-start gap-4">
                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-primary-100">
                                        <MapPin className="h-6 w-6 text-primary-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-bold text-gray-900 leading-tight">
                                                {details?.landmark_name || 'Individual PIN'}
                                            </h4>
                                            <span className="text-primary-600 font-mono font-black text-xs bg-primary-100 px-2 py-1 rounded">
                                                {code}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">
                                            {details?.district_name ? `${details.district_name}, ` : ''}
                                            {details?.place_name || 'Hargeisa'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={shareOnWhatsApp}
                                        className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        WhatsApp
                                    </button>
                                </div>
                            </div>
                        ) : code.length >= 6 && !loading ? (
                            <div className="text-center py-4 space-y-2">
                                <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                    <MapPin className="h-6 w-6 text-gray-300" />
                                </div>
                                <p className="text-sm text-gray-400 font-medium">No results found for this PIN</p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-dashed border-gray-200">
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                    Enter a KH-PIN to see location details or switch to "Create" to generate your own.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer Tag */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by Suqafuran</span>
            </div>
        </div>
    );
};

export default KHPinWidget;
