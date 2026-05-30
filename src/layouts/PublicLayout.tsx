import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Plus, Heart, Home, MessageSquare, User, Bell,
    ChevronDown, Zap,
    Phone, ShoppingBag
} from 'lucide-react';

/* ── Brand-accurate social icons (use brand SVGs + brand colors) ── */
const XIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);
const FacebookIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.017 1.792-4.683 4.533-4.683 1.312 0 2.686.235 2.686.235v2.965h-1.514c-1.49 0-1.955.93-1.955 1.886v2.263h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
);
const InstagramIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38a3.7 3.7 0 0 1-1.38.9c-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.86 5.86 0 0 0-2.13 1.38A5.86 5.86 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.73 1.46 1.38 2.13a5.86 5.86 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 0 0 2.13-1.38 5.86 5.86 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.13A5.86 5.86 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.41-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/>
    </svg>
);
const TikTokIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.95a8.2 8.2 0 0 0 4.78 1.52V7.01a4.85 4.85 0 0 1-1.01-.32z"/>
    </svg>
);
import { Logo } from '../components/Logo';
import { getAvatarUrl } from '../utils/imageUtils';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { CurrencySwitcher } from '../components/CurrencySwitcher';
import { AISupportChat } from '../components/AISupportChat';

interface LayoutProps {
    children: React.ReactNode;
}

const PublicLayout: React.FC<LayoutProps> = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();
    const { t } = useTranslation();
    const location = useLocation();
    const path = location.pathname;
    const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

    const toggleSection = (section: string) =>
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));

    const isActive = (href: string) =>
        href === '/' ? path === '/' : path.startsWith(href);

    return (
        <>
        <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden relative">

            {/* ── MOBILE HEADER ── */}
            <header
                className="md:hidden sticky top-0 z-50 bg-primary-500 border-b border-primary-600/10"
                style={{
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
                }}
            >
                <div className="px-3 h-16 flex items-center justify-between gap-1.5 w-full">
                    <Link to="/" className="shrink-0">
                        <Logo size="xs" />
                    </Link>
                    <div className="flex-1" />
                    <div className="shrink-0">
                        <CurrencySwitcher compact />
                    </div>
                    <div className="shrink-0">
                        <LanguageSwitcher compact light />
                    </div>
                    <Link to="/notifications" className="relative p-2 shrink-0 text-primary-800">
                        <Bell className="h-5 w-5" />
                    </Link>
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-sm overflow-hidden border-2 border-primary-200">
                                {getAvatarUrl(user?.avatar_url) ? (
                                    <img src={getAvatarUrl(user?.avatar_url, { width: 100, quality: 'eco' })!} alt={user?.full_name || 'U'} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                                )}
                            </div>
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="shrink-0 px-3 h-8 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center shadow-sm"
                        >
                            {t('nav.signIn')}
                        </Link>
                    )}
                </div>
            </header>

            {/* ── DESKTOP HEADER ── */}
            <header className="hidden md:block sticky top-0 z-50">
                <div className="bg-primary-500 border-b border-primary-600/10 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
                        <Link to="/" className="shrink-0 mr-2">
                            <Logo size="md" />
                        </Link>

                        <div className="flex items-center gap-1 ml-auto shrink-0">
                            <CurrencySwitcher />
                            <LanguageSwitcher compact />

                            <Link to="/favorites" className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all" title={t('nav.saved')}>
                                <Heart className="h-5 w-5" />
                            </Link>
                            <Link to="/messages" className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all" title={t('nav.messages')}>
                                <MessageSquare className="h-5 w-5" />
                            </Link>
                            <Link to="/notifications" className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all" title={t('nav.alerts')}>
                                <Bell className="h-5 w-5" />
                            </Link>
                            <Link to="/performance" className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all" title={t('nav.boost')}>
                                <Zap className="h-5 w-5" />
                            </Link>
                            <Link to="/my-ads" className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all" title={t('nav.myAds', 'My Adverts')}>
                                <ShoppingBag className="h-5 w-5" />
                            </Link>

                            {isAuthenticated ? (
                                <Link to="/dashboard" className="p-0.5 rounded-full border-2 border-white/50 hover:border-white transition-all ml-1 overflow-hidden" title={t('nav.profile')}>
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary-600 font-bold text-xs">
                                        {getAvatarUrl(user?.avatar_url) ? (
                                            <img src={getAvatarUrl(user?.avatar_url, { width: 100, quality: 'eco' })!} alt={user?.full_name || 'U'} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{user?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                                        )}
                                    </div>
                                </Link>
                            ) : (
                                <Link to="/login" className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-gray-700 hover:bg-gray-100 transition-colors shadow-sm" title={t('nav.signIn')}>
                                    <User className="h-4 w-4" strokeWidth={2.5} />
                                </Link>
                            )}

                            <Link to="/post-ad"
                                className="ml-3 flex items-center justify-center gap-1.5 bg-[#fb923c] hover:bg-[#f97316] text-white font-bold text-[13px] tracking-wide uppercase px-6 h-9 rounded-md transition-colors shadow-sm shrink-0">
                                {t('nav.sell')}
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 md:pb-0">
                {children}
            </main>

            {/* Bottom Navigation — mobile only */}
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 bottom-nav-safe"
                style={{
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '0 -1px 16px rgba(0,0,0,0.08)',
                }}
            >
                <div className="flex items-stretch h-[60px] px-1">

                    {/* Home */}
                    <Link to="/"
                        className="flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform">
                        <div className={cn(
                            'w-10 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                            isActive('/') ? 'bg-primary-100' : ''
                        )}>
                            <Home className={cn('h-5 w-5 transition-colors', isActive('/') ? 'text-primary-600' : 'text-gray-400')}
                                strokeWidth={isActive('/') ? 2.5 : 1.8} />
                        </div>
                        <span className={cn('text-[10px] font-semibold', isActive('/') ? 'text-primary-600' : 'text-gray-400')}>
                            {t('nav.home')}
                        </span>
                    </Link>

                    {/* Saved */}
                    <Link to="/favorites"
                        className="flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform">
                        <div className={cn(
                            'w-10 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                            isActive('/favorites') ? 'bg-primary-100' : ''
                        )}>
                            <Heart className={cn('h-5 w-5 transition-colors', isActive('/favorites') ? 'text-primary-600 fill-primary-200' : 'text-gray-400')}
                                strokeWidth={isActive('/favorites') ? 2.5 : 1.8} />
                        </div>
                        <span className={cn('text-[10px] font-semibold', isActive('/favorites') ? 'text-primary-600' : 'text-gray-400')}>
                            {t('nav.saved')}
                        </span>
                    </Link>

                    {/* Sell FAB — elevated center button */}
                    <div className="flex-1 flex flex-col items-center justify-center" style={{ marginTop: '-22px' }}>
                        <Link to="/post-ad" className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
                            <div
                                className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(160deg, var(--color-primary-400) 0%, var(--color-primary-500) 60%, var(--color-primary-200) 100%)',
                                    boxShadow: '0 6px 20px rgba(var(--color-primary-rgb), 0.5), 0 2px 6px rgba(0,0,0,0.1)',
                                }}
                            >
                                <Plus className="h-6 w-6 text-white" strokeWidth={2.8} />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-400">{t('nav.sell')}</span>
                        </Link>
                    </div>

                    {/* Messages */}
                    <Link to="/messages"
                        className="flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform">
                        <div className={cn(
                            'w-10 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                            isActive('/messages') ? 'bg-primary-100' : ''
                        )}>
                            <MessageSquare className={cn('h-5 w-5 transition-colors', isActive('/messages') ? 'text-primary-600' : 'text-gray-400')}
                                strokeWidth={isActive('/messages') ? 2.5 : 1.8} />
                        </div>
                        <span className={cn('text-[10px] font-semibold', isActive('/messages') ? 'text-primary-600' : 'text-gray-400')}>
                            {t('nav.messages')}
                        </span>
                    </Link>

                    {/* Profile */}
                    <Link to="/dashboard"
                        className="flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform">
                        <div className={cn(
                            'w-10 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                            isActive('/dashboard') ? 'bg-primary-100' : ''
                        )}>
                            <User className={cn('h-5 w-5 transition-colors', isActive('/dashboard') ? 'text-primary-600' : 'text-gray-400')}
                                strokeWidth={isActive('/dashboard') ? 2.5 : 1.8} />
                        </div>
                        <span className={cn('text-[10px] font-semibold', isActive('/dashboard') ? 'text-primary-600' : 'text-gray-400')}>
                            {t('nav.profile')}
                        </span>
                    </Link>

                </div>
            </nav>

            {/* Desktop Footer */}
            <footer className="hidden md:block bg-primary-500 text-black py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-4 gap-8">
                        <div>
                            <h3 className="font-extrabold mb-4 uppercase tracking-wider text-sm">{t('footer.about')}</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/about" className="hover:opacity-70">{t('footer.aboutUs')}</Link></li>
                                <li><Link to="/contact" className="hover:opacity-70">{t('footer.contactUs')}</Link></li>
                                <li><Link to="/terms" className="hover:opacity-70">{t('footer.terms')}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-extrabold mb-4 uppercase tracking-wider text-sm">{t('footer.support')}</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/help" className="hover:opacity-70">{t('footer.helpCenter')}</Link></li>
                                <li><Link to="/safety" className="hover:opacity-70">{t('footer.safetyTips')}</Link></li>
                                <li><Link to="/privacy" className="hover:opacity-70">{t('footer.privacy')}</Link></li>
                                <li>
                                    <a href="https://wa.me/252612958679" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:opacity-70">
                                        <Phone className="h-3.5 w-3.5" />
                                        {t('footer.whatsappSupport')}
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-extrabold mb-4 uppercase tracking-wider text-sm">{t('footer.digitalAddress')}</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/kh" className="font-bold flex items-center gap-2 hover:opacity-70"><span className="w-2 h-2 rounded-full bg-black inline-block" />{t('footer.getKhPin')}</Link></li>
                                <li><Link to="/kh" className="hover:opacity-70">{t('footer.landmarkDir')}</Link></li>
                                <li><Link to="/kh" className="hover:opacity-70">{t('footer.emergencyContacts')}</Link></li>
                            </ul>
                            <div className="mt-4">
                                <p className="text-xs font-bold uppercase tracking-wider mb-2 text-black/60">{t('footer.payWith')}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {['EVC Plus', 'Zaad', 'Golis', 'Somtel'].map(name => (
                                        <span key={name} className="text-[10px] font-bold bg-black/10 text-black rounded px-2 py-0.5">{name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-extrabold mb-4 uppercase tracking-wider text-sm">{t('footer.connect')}</h3>
                            <div className="flex gap-3 mb-4">
                                <a href="https://www.facebook.com/suqafuran" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-9 w-9 bg-[#1877F2] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm">
                                    <FacebookIcon className="h-4 w-4 text-white" />
                                </a>
                                <a href="https://x.com/suqafuran" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="h-9 w-9 bg-black rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm">
                                    <XIcon className="h-4 w-4 text-white" />
                                </a>
                                <a href="https://www.instagram.com/suqafuran" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-9 w-9 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm">
                                    <InstagramIcon className="h-4 w-4 text-white" />
                                </a>
                                <a href="https://www.tiktok.com/@suqafuran_" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="h-9 w-9 bg-black rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm">
                                    <TikTokIcon className="h-4 w-4 text-white" />
                                </a>
                            </div>
                            <p className="text-xs text-black/60 italic mb-6">{t('footer.tagline')}</p>
                            
                            <div className="pt-4 border-t border-black/10">
                                <h3 className="font-extrabold mb-4 uppercase tracking-wider text-[11px] text-black/60">{t('footer.getUsOn')}</h3>
                                <div className="flex flex-col gap-2">
                                    <Link to="/download" className="flex items-center gap-3 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-900 transition-colors shadow-sm">
                                        <svg viewBox="0 0 384 512" className="h-5 w-5 fill-current"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 33-17.9 64.4-17.9 31 0 39.7 17.9 64.1 17.9 48.9 0 89.4-83.2 103.2-125.2-43.9-18.1-74.4-53.3-74.6-86zM230.3 56.1c16-19.7 26.9-47.1 23.9-74.6-23.7 1-52.1 15.8-69 35.5-15 17.5-28.2 45.4-25.2 72.1 26.4 2 54.3-13.3 70.3-33z"/></svg>
                                         <div className="text-left">
                                             <p className="text-[9px] uppercase leading-none opacity-60">{t('footer.downloadOn')}</p>
                                             <p className="text-xs font-bold leading-tight">{t('footer.appStore')}</p>
                                         </div>
                                     </Link>
                                    <Link to="/download" className="flex items-center gap-3 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-900 transition-colors shadow-sm">
                                        <svg viewBox="0 0 512 512" className="h-5 w-5 fill-current"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-10.3 18-28.5-1.2-40.8zM325.3 277.7l60.1 60.1L104.6 499l220.7-221.3z"/></svg>
                                        <div className="text-left">
                                            <p className="text-[9px] uppercase leading-none opacity-60">{t('footer.getItOn')}</p>
                                            <p className="text-xs font-bold leading-tight">{t('footer.googlePlay')}</p>
                                        </div>
                                    </Link>
                                    <Link to="/download" className="flex items-center gap-3 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
                                        <ShoppingBag className="h-5 w-5" />
                                        <div className="text-left">
                                            <p className="text-[9px] uppercase leading-none opacity-70">{t('footer.androidDirect')}</p>
                                            <p className="text-xs font-bold leading-tight">{t('footer.downloadApk')}</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Programmatic SEO Tags */}
                    <div className="mt-8 pt-8 border-t border-black/10">
                        <h4 className="font-extrabold mb-3 uppercase tracking-wider text-xs text-black/60">Trending Near You</h4>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { name: "Cheap iPhones in Nairobi", query: "product=iPhone&city=Nairobi&category=Electronics" },
                                { name: "Gaming Laptops in Kenya", query: "product=laptops&city=Nairobi&category=Electronics" },
                                { name: "Used Toyota Cars for Sale", query: "product=Toyota&city=Nairobi&category=Vehicles" },
                                { name: "Houses for Rent in Nairobi", query: "product=houses&city=Nairobi&category=Property" },
                                { name: "Hire Web Developers", query: "skill=web%20developer&city=Nairobi&category=Jobs" },
                                { name: "Plumbers near me", query: "service=plumber&city=Nairobi&category=Services" },
                            ].map((tag) => (
                                <Link 
                                    key={tag.name} 
                                    to={`/discover?${tag.query}`} 
                                    className="text-xs bg-black/5 hover:bg-black/10 text-black font-semibold px-3 py-1.5 rounded-full transition-all"
                                >
                                    {tag.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>




            {/* Mobile Footer (collapsible) */}
            <footer className="md:hidden bg-primary-500 text-black content-bottom-safe">
                <div className="px-4 py-3">
                    <button onClick={() => toggleSection('footer')} className="w-full flex items-center justify-between py-2">
                        <Logo size="sm" />
                        <ChevronDown className={cn('h-5 w-5 transition-transform', openSections['footer'] ? 'rotate-180' : '')} />
                    </button>
                    {openSections['footer'] && (
                        <div className="pt-2 pb-4 space-y-3">
                            <div className="flex gap-3">
                                <a href="https://www.facebook.com/suqafuran" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-8 w-8 bg-[#1877F2] rounded-full flex items-center justify-center shadow-sm">
                                    <FacebookIcon className="h-4 w-4 text-white" />
                                </a>
                                <a href="https://x.com/suqafuran" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="h-8 w-8 bg-black rounded-full flex items-center justify-center shadow-sm">
                                    <XIcon className="h-4 w-4 text-white" />
                                </a>
                                <a href="https://www.instagram.com/suqafuran" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-8 w-8 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                                    <InstagramIcon className="h-4 w-4 text-white" />
                                </a>
                                <a href="https://www.tiktok.com/@suqafuran_" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="h-8 w-8 bg-black rounded-full flex items-center justify-center shadow-sm">
                                    <TikTokIcon className="h-4 w-4 text-white" />
                                </a>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-black/80">
                                <Link to="/about">{t('footer.aboutUs')}</Link>
                                <Link to="/help">{t('footer.helpCenter')}</Link>
                                <Link to="/terms">{t('footer.terms')}</Link>
                                <Link to="/safety">{t('footer.safetyTips')}</Link>
                                <Link to="/privacy">{t('footer.privacy')}</Link>
                                <Link to="/kh">{t('footer.getKhPin')}</Link>
                                <Link to="/download" className="font-bold text-primary-900">{t('footer.downloadApp')}</Link>
                                <Link to="/contact">{t('footer.contactUs')}</Link>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {['EVC Plus', 'Zaad', 'Golis', 'Somtel'].map(name => (
                                    <span key={name} className="text-[10px] font-bold bg-black/10 text-black rounded px-2 py-0.5">{name}</span>
                                ))}
                            </div>
                            <p className="text-xs text-black/50">{t('footer.tagline')}</p>
                        </div>
                    )}
                </div>
            </footer>
        </div>
        <AISupportChat />
        </>
    );
};

export { PublicLayout };
