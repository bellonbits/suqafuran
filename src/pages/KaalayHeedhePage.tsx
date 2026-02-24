import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import KHPinWidget from '../components/KHPinWidget';
import { Shield, Info, Map as MapIcon, Share2, Navigation, ArrowLeft } from 'lucide-react';
import { cn } from '../utils/cn';

const KaalayHeedhePage: React.FC = () => {
    const [khMode, setKhMode] = React.useState<{ emergency?: boolean }>({});
    const widgetRef = React.useRef<HTMLDivElement>(null);

    const scrollToWidget = (emergency = false) => {
        setKhMode({ emergency });
        widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <div className="min-h-screen bg-[#fcfcfd] pt-10 pb-20 px-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-50 to-transparent -z-10 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* Back Navigation */}
            <div className="max-w-4xl mx-auto mb-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 font-bold transition-all group"
                >
                    <div className="p-2 rounded-full bg-white shadow-sm border border-gray-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </div>
                    <span>Back to Suqafuran</span>
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto space-y-12 relative z-10"
            >
                {/* Hero Section */}
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="inline-block px-4 py-1.5 bg-primary-50 rounded-full text-primary-600 text-[10px] font-black uppercase tracking-[0.2em] border border-primary-100"
                    >
                        National Digital Address System
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                        Your Digital <span className="text-primary-600 relative inline-block">
                            Identity
                            <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                                <path d="M0 7C30 7 70 2 100 2" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
                            </svg>
                        </span> in Mogadishu & Cities
                    </h1>
                    <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                        Kaalay Heedhe simplifies addresses. No more describing long routes—just share your
                        <span className="font-bold text-primary-600"> KH-PIN</span> and let others find you instantly.
                    </p>
                </div>

                {/* Main Widget */}
                <motion.div
                    ref={widgetRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="relative z-20"
                >
                    <div className="absolute -inset-8 bg-primary-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                    <KHPinWidget emergency={khMode.emergency} />
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
                    {[
                        { icon: MapIcon, color: "blue", title: "Landmark Directory", desc: "Search for mosques, malls, hospitals, and schools across Mogadishu & major cities. All major landmarks integrated.", action: () => scrollToWidget(false) },
                        { icon: Share2, color: "green", title: "Instant Sharing", desc: "Share your exact location PIN via WhatsApp, SMS, or Link. Perfect for delivery and visitors.", action: () => scrollToWidget(false) },
                        { icon: Shield, color: "red", title: "Emergency Mode", desc: "One-tap access to Police (888) and Fire (555) services based on your current district.", action: () => scrollToWidget(true) }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (i * 0.1) }}
                            whileHover={{ y: -8 }}
                            onClick={feature.action}
                            className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 cursor-pointer hover:shadow-xl hover:shadow-primary-500/5 transition-all group"
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                                feature.color === "blue" ? "bg-blue-50 text-blue-500" :
                                    feature.color === "green" ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
                            )}>
                                <feature.icon className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Info Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-primary-900 rounded-[3rem] p-8 md:p-14 text-white flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2" />

                    <div className="flex-1 space-y-8 relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                            <Info className="h-4 w-4 text-primary-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">How it works</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black leading-tight italic">Bridging the Gap without Street Names</h2>
                        <ul className="space-y-6 text-primary-100/70 font-bold">
                            {[
                                "Pin your location on the map in Suqafuran.",
                                "Get your unique KH-XXXX digital address code.",
                                "Share it with anyone—it works in major cities."
                            ].map((step, i) => (
                                <li key={i} className="flex items-start gap-4 group">
                                    <span className="h-8 w-8 rounded-xl bg-primary-500 flex items-center justify-center text-sm text-white font-black shrink-0 shadow-lg shadow-primary-500/40 group-hover:scale-110 transition-transform">
                                        {i + 1}
                                    </span>
                                    <p className="text-lg leading-snug pt-0.5">{step}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="w-full lg:w-1/3 aspect-[4/5] bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center overflow-hidden relative z-10 backdrop-blur-md">
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="text-center p-8 space-y-6"
                        >
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-primary-500/50">
                                <Navigation className="h-12 w-12 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-primary-400 uppercase tracking-widest leading-none mb-1">KAALAY HEEDHE</p>
                                <div className="text-2xl font-mono font-black text-white tracking-[0.15em] bg-white/10 px-4 py-1 rounded-lg border border-white/5">KH-A1B2</div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default KaalayHeedhePage;
