import React, { useState, useEffect } from 'react';
import { MapPin, Share2, PhoneCall, Search, Navigation, Copy, Check, Target, PlusCircle, Shield } from 'lucide-react';
import { khService } from '../services/khService';
import type { KHPinDetails } from '../services/khService';
import { Button } from './Button';
import { cn } from '../utils/cn';
import LocationPicker from './LocationPicker';

interface KHPinWidgetProps {
    initialCode?: string;
    emergency?: boolean;
}

const KHPinWidget: React.FC<KHPinWidgetProps> = ({ initialCode, emergency }) => {
    const [code, setCode] = useState(initialCode || '');
    const [details, setDetails] = useState<KHPinDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showEmergency, setShowEmergency] = useState(emergency || false);
    const [mode, setMode] = useState<'view' | 'create'>('view');
    const [createdPin, setCreatedPin] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number; words?: string } | null>(null);

    useEffect(() => {
        if (emergency !== undefined) {
            setShowEmergency(emergency);
        }
    }, [emergency]);

    useEffect(() => {
        if (code && code.length >= 6) {
            handleLookup();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    const handleLookup = async () => {
        if (!code) return;
        setLoading(true);
        try {
            const data = await khService.getPinDetails(code);
            setDetails(data);
        } catch (error) {
            console.error('Lookup failed', error);
            setDetails(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePin = async () => {
        if (!coords) return;
        setLoading(true);
        try {
            const res = await khService.createPin({
                latitude: coords.lat,
                longitude: coords.lng,
                place_id: 1, // Defaulting to 1 for MVP
                privacy_level: 'public'
            });
            setCreatedPin(res.code);
            setCode(res.code);
            setMode('view');

            // Fetch details for the newly created PIN
            const data = await khService.getPinDetails(res.code);
            setDetails(data);
        } catch (error) {
            console.error('Create failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSelect = (lat: number, lng: number, words?: string) => {
        setCoords({ lat, lng, words });
    };

    const copyToClipboard = () => {
        if (!details) return;
        navigator.clipboard.writeText(details.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnWhatsApp = () => {
        const pinToShare = details?.code || code;
        const text = encodeURIComponent(`My KH Digital Address: ${pinToShare}\nLocation: ${details?.landmark_name || ''} ${details?.place_name || ''}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden max-w-md w-full mx-auto relative z-20">
            {/* Header */}
            <div className="bg-primary-600 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20">
                            <Navigation className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black italic tracking-tight leading-none">Kaalay Heedhe</h3>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Digital Address</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowEmergency(!showEmergency)}
                        className={cn(
                            "p-3 rounded-2xl shadow-lg transition-all active:scale-95",
                            showEmergency ? "bg-white text-red-600" : "bg-red-500 text-white animate-pulse"
                        )}
                    >
                        {showEmergency ? <Search className="h-5 w-5" /> : <PhoneCall className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-50/50 p-2 border-b border-gray-100">
                <button
                    onClick={() => { setMode('view'); setShowEmergency(false); }}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                        mode === 'view' && !showEmergency ? "bg-white text-primary-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <Search className="h-4 w-4" />
                    Lookup
                </button>
                <button
                    onClick={() => { setMode('create'); setShowEmergency(false); }}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                        mode === 'create' && !showEmergency ? "bg-white text-primary-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <PlusCircle className="h-4 w-4" />
                    Create
                </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
                {showEmergency ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 text-center space-y-2">
                            <h4 className="text-red-900 font-bold uppercase tracking-tight">Emergency Contacts</h4>
                            <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">Active District: Banadir</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <a href="tel:888" className="bg-white border border-gray-100 p-6 rounded-[2rem] text-center hover:border-red-200 hover:shadow-lg transition-all group">
                                <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Shield className="h-6 w-6 text-red-500" />
                                </div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Police</p>
                                <p className="text-xl font-black text-gray-900 tracking-tighter">888</p>
                            </a>
                            <a href="tel:555" className="bg-white border border-gray-100 p-6 rounded-[2rem] text-center hover:border-red-200 hover:shadow-lg transition-all group">
                                <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <PhoneCall className="h-6 w-6 text-red-500" />
                                </div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Fire</p>
                                <p className="text-xl font-black text-gray-900 tracking-tighter">555</p>
                            </a>
                        </div>
                        <Button
                            variant="primary"
                            className="w-full bg-gray-900 rounded-[1.5rem] py-6"
                            onClick={() => setShowEmergency(false)}
                        >
                            Back to Search
                        </Button>
                    </div>
                ) : mode === 'create' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center space-y-2">
                            <h4 className="text-xl font-black text-gray-900 tracking-tight uppercase">New Address</h4>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Selected precise point on map</p>
                        </div>

                        <LocationPicker onLocationSelect={handleLocationSelect} />

                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full rounded-[1.5rem] py-8 text-lg font-black tracking-tight"
                            loading={loading}
                            onClick={handleCreatePin}
                            disabled={!coords}
                        >
                            {coords ? 'Generate My KH-PIN' : 'Select Point on Map'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                        {/* Lookup View */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="ENTER PIN (Eg. KH-A1B2)"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-[1.5rem] py-5 pl-14 pr-6 font-mono font-black tracking-[0.2em] outline-none transition-all placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-sans"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                            />
                            {loading && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"></div>
                                </div>
                            )}
                        </div>

                        {details || createdPin ? (
                            <div className="bg-primary-50/50 rounded-2xl p-5 border border-primary-100 space-y-4 animate-in zoom-in-95 duration-300 relative">
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
                                        onClick={copyToClipboard}
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
                    </div>
                )}
            </div>

            {/* Footer Tag */}
            <div className="bg-gray-50/50 px-8 py-6 border-t border-gray-100 flex items-center justify-center gap-2">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">National System</span>
                <div className="h-1 w-1 bg-gray-200 rounded-full" />
                <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">Suqafuran</span>
            </div>
        </div>
    );
};

export default KHPinWidget;
