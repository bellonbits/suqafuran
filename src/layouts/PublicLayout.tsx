import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Search, Plus, Heart, Home, MessageSquare, User, Bell,
    Facebook, Twitter, Instagram, Youtube, ChevronDown, Zap
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { getAvatarUrl } from '../utils/imageUtils';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';

interface LayoutProps {
    children: React.ReactNode;
}

const PublicLayout: React.FC<LayoutProps> = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();
    const path = location.pathname;
    const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

    const toggleSection = (section: string) =>
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));

    const isActive = (href: string) =>
        href === '/' ? path === '/' : path.startsWith(href);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            {/* ── MOBILE HEADER ── */}
            <header className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm"
                style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                <div className="px-4 h-14 flex items-center gap-3">
                    <Link to="/" className="shrink-0">
                        <Logo size="sm" />
                    </Link>
                    <Link
                        to="/search"
                        className="flex-1 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-200 rounded-full px-3 h-9 transition-colors"
                    >
                        <Search className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-400 truncate">Search listings…</span>
                    </Link>
                    <div className="flex items-center gap-0.5 shrink-0">
                        <Link to="/notifications" className="p-2 rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors">
                            <Bell className="h-5 w-5" />
                        </Link>
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="p-1">
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm overflow-hidden border-2 border-primary-200">
                                    {getAvatarUrl(user?.avatar_url) ? (
                                        <img src={getAvatarUrl(user?.avatar_url)!} alt={user?.full_name || 'U'} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{user?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <Link to="/login" className="p-2 rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors">
                                <User className="h-5 w-5" />
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* ── DESKTOP HEADER ── */}
            <header className="hidden md:block sticky top-0 z-50 shadow-md">
                {/* Top bar */}
                <div className="bg-primary-500">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
                        {/* Logo */}
                        <Link to="/" className="shrink-0 mr-2">
                            <Logo size="md" />
                        </Link>

                        {/* Right icons */}
                        <div className="flex items-center gap-1 ml-auto shrink-0">
                            <Link to="/favorites" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                <Heart className="h-5 w-5" />
                                <span className="text-[10px] font-medium">Saved</span>
                            </Link>
                            <Link to="/messages" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                <MessageSquare className="h-5 w-5" />
                                <span className="text-[10px] font-medium">Messages</span>
                            </Link>
                            <Link to="/notifications" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                <Bell className="h-5 w-5" />
                                <span className="text-[10px] font-medium">Alerts</span>
                            </Link>
                            <Link to="/boost" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                <Zap className="h-5 w-5" />
                                <span className="text-[10px] font-medium">Boost</span>
                            </Link>

                            {isAuthenticated ? (
                                <Link to="/dashboard" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                                        {getAvatarUrl(user?.avatar_url) ? (
                                            <img src={getAvatarUrl(user?.avatar_url)!} alt={user?.full_name || 'U'} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{user?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-medium">Profile</span>
                                </Link>
                            ) : (
                                <Link to="/login" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                    <User className="h-5 w-5" />
                                    <span className="text-[10px] font-medium">Sign In</span>
                                </Link>
                            )}

                            {/* SELL button */}
                            <Link to="/post-ad"
                                className="ml-2 flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 active:scale-95 text-white font-bold text-sm px-5 h-10 rounded-lg transition-all shadow-sm shrink-0">
                                <Plus className="h-4 w-4" strokeWidth={3} />
                                SELL
                            </Link>
                        </div>
                    </div>
                </div>

            </header>

            {/* Main content */}
            <main className="flex-1 md:pb-0" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 16px))' }}>
                {children}
            </main>

            {/* Bottom Navigation — mobile only */}
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="flex items-stretch h-16">

                    <Link to="/"
                        className={cn('flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform',
                            isActive('/') ? 'text-primary-500' : 'text-gray-400')}>
                        <Home className="h-[22px] w-[22px]" strokeWidth={isActive('/') ? 2.5 : 1.8}
                            fill={isActive('/') ? 'rgba(125,204,233,0.25)' : 'none'} />
                        <span className="text-[10px] font-semibold">Home</span>
                    </Link>

                    <Link to="/favorites"
                        className={cn('flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform',
                            isActive('/favorites') ? 'text-primary-500' : 'text-gray-400')}>
                        <Heart className="h-[22px] w-[22px]" strokeWidth={isActive('/favorites') ? 2.5 : 1.8}
                            fill={isActive('/favorites') ? 'rgba(125,204,233,0.25)' : 'none'} />
                        <span className="text-[10px] font-semibold">Saved</span>
                    </Link>

                    {/* Sell FAB */}
                    <div className="flex-1 flex flex-col items-center justify-center" style={{ marginTop: '-24px' }}>
                        <Link to="/post-ad" className="flex flex-col items-center gap-1">
                            <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center active:scale-95 transition-transform"
                                style={{ boxShadow: '0 6px 24px rgba(125,204,233,0.55)' }}>
                                <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400 mt-0.5">Sell</span>
                        </Link>
                    </div>

                    <Link to="/messages"
                        className={cn('flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform',
                            isActive('/messages') ? 'text-primary-500' : 'text-gray-400')}>
                        <MessageSquare className="h-[22px] w-[22px]" strokeWidth={isActive('/messages') ? 2.5 : 1.8}
                            fill={isActive('/messages') ? 'rgba(125,204,233,0.25)' : 'none'} />
                        <span className="text-[10px] font-semibold">Messages</span>
                    </Link>

                    <Link to="/dashboard"
                        className={cn('flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform',
                            isActive('/dashboard') ? 'text-primary-500' : 'text-gray-400')}>
                        <User className="h-[22px] w-[22px]" strokeWidth={isActive('/dashboard') ? 2.5 : 1.8}
                            fill={isActive('/dashboard') ? 'rgba(125,204,233,0.25)' : 'none'} />
                        <span className="text-[10px] font-semibold">Profile</span>
                    </Link>
                </div>
            </nav>

            {/* Desktop Footer */}
            <footer className="hidden md:block bg-primary-500 text-black py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-4 gap-8">
                        <div>
                            <h3 className="font-extrabold mb-4 uppercase tracking-wider text-sm">About Suqafuran</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/about" className="hover:opacity-70">About Us</Link></li>
                                <li><Link to="/contact" className="hover:opacity-70">Contact Us</Link></li>
                                <li><Link to="/terms" className="hover:opacity-70">Terms & Conditions</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-extrabold mb-4 uppercase tracking-wider text-sm">Support</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/help" className="hover:opacity-70">Help Center</Link></li>
                                <li><Link to="/safety" className="hover:opacity-70">Safety Tips</Link></li>
                                <li><Link to="/privacy" className="hover:opacity-70">Privacy Policy</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-extrabold mb-4 uppercase tracking-wider text-sm">Digital Address</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/kh" className="font-bold flex items-center gap-2 hover:opacity-70"><span className="w-2 h-2 rounded-full bg-black inline-block" />Get KH-PIN</Link></li>
                                <li><Link to="/kh" className="hover:opacity-70">Landmark Directory</Link></li>
                                <li><Link to="/kh" className="hover:opacity-70">Emergency Contacts</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-extrabold mb-4 uppercase tracking-wider text-sm">Connect</h3>
                            <div className="flex gap-3 mb-4">
                                {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                                    <div key={i} className="h-9 w-9 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 cursor-pointer transition-colors">
                                        <Icon className="h-4 w-4 text-black" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-black/60 italic">© 2026 Suqafuran. Buy. Sell. Connect.</p>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Mobile Footer (collapsible) */}
            <footer className="md:hidden bg-primary-500 text-black">
                <div className="px-4 py-3">
                    <button onClick={() => toggleSection('footer')} className="w-full flex items-center justify-between py-2">
                        <Logo size="sm" />
                        <ChevronDown className={cn('h-5 w-5 transition-transform', openSections['footer'] ? 'rotate-180' : '')} />
                    </button>
                    {openSections['footer'] && (
                        <div className="pt-2 pb-4 space-y-3">
                            <div className="flex gap-3">
                                {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                                    <div key={i} className="h-8 w-8 bg-black/10 rounded-full flex items-center justify-center">
                                        <Icon className="h-4 w-4 text-black" />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-black/80">
                                <Link to="/about">About Us</Link>
                                <Link to="/help">Help Center</Link>
                                <Link to="/terms">Terms</Link>
                                <Link to="/safety">Safety Tips</Link>
                                <Link to="/privacy">Privacy</Link>
                                <Link to="/kh">Get KH-PIN</Link>
                            </div>
                            <p className="text-xs text-black/50">© 2026 Suqafuran. Buy. Sell. Connect.</p>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
};

export { PublicLayout };
