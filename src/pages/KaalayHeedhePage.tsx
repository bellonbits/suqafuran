import React from 'react';
import KHPinWidget from '../components/KHPinWidget';
import { Shield, Info, Map as MapIcon, Share2, Navigation } from 'lucide-react';

const KaalayHeedhePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 pt-10 pb-20 px-4">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                        Your Digital <span className="text-primary-600">Identity</span> in Somalia
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">
                        Kaalay Heedhe simplifies addresses. No more describing long routes—just share your
                        <span className="font-bold text-primary-600"> KH-PIN</span> and let others find you instantly.
                    </p>
                </div>

                {/* Main Widget */}
                <div className="relative">
                    <div className="absolute -inset-4 bg-primary-500/10 blur-3xl rounded-full"></div>
                    <KHPinWidget />
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                        <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center">
                            <MapIcon className="h-7 w-7 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Landmark Directory</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Search for mosques, malls, hospitals, and schools across Somalia. All major landmarks integrated.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                        <div className="bg-green-50 w-14 h-14 rounded-2xl flex items-center justify-center">
                            <Share2 className="h-7 w-7 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Instant Sharing</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Share your exact location PIN via WhatsApp, SMS, or Link. Perfect for delivery and visitors.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                        <div className="bg-red-50 w-14 h-14 rounded-2xl flex items-center justify-center">
                            <Shield className="h-7 w-7 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Emergency Mode</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            One-tap access to Police (888) and Fire (555) services based on your current district.
                        </p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-primary-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                            <Info className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">How it works</span>
                        </div>
                        <h2 className="text-3xl font-bold">Bridging the Gap without Street Names</h2>
                        <ul className="space-y-4 text-primary-100/80 font-medium">
                            <li className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center text-xs text-white font-bold shrink-0">1</span>
                                Pin your location on the map in Suqafuran.
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center text-xs text-white font-bold shrink-0">2</span>
                                Get your unique KH-XXXX digital address code.
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center text-xs text-white font-bold shrink-0">3</span>
                                Share it with anyone—it works everywhere in Somalia.
                            </li>
                        </ul>
                    </div>
                    <div className="w-full md:w-1/3 aspect-[4/5] bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden">
                        {/* Mockup or Illustration Placeholder */}
                        <div className="text-center p-8 space-y-4">
                            <div className="w-20 h-20 bg-primary-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                                <Navigation className="h-10 w-10 text-white" />
                            </div>
                            <p className="text-sm font-bold text-primary-200">KAALAY HEEDHE</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KaalayHeedhePage;
