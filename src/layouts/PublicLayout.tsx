import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Search, Plus, Heart, Home, MessageSquare, User, Bell,
    Facebook, Twitter, Instagram, Youtube, ChevronDown, Zap,
    Phone
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { getAvatarUrl } from '../utils/imageUtils';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';
import LanguageSwitcher from '../components/LanguageSwitcher';

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
        <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden relative">

            {/* ── MOBILE HEADER ── */}
            <header
                className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-100"
                style={{
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
                }}
            >
                <div className="px-3 h-14 flex items-center justify-between gap-1.5 w-full">
                    <Link to="/" className="shrink-0">
                        <Logo size="sm" />
                    </Link>
                    <Link
                        to="/search"
                        className="flex-1 min-w-0 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-2 h-9"
                    >
                        <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="text-[12px] text-gray-400 truncate">{t('nav.search')}</span>
                    </Link>
                    <div className="shrink-0">
                        <LanguageSwitcher compact light />
                    </div>
                    <Link to="/notifications" className="relative p-2 shrink-0 text-gray-500">
                        <Bell className="h-5 w-5" />
                    </Link>
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-sm overflow-hidden border-2 border-primary-200">
                                {getAvatarUrl(user?.avatar_url) ? (
                                    <img src={getAvatarUrl(user?.avatar_url)!} alt={user?.full_name || 'U'} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                                )}
                            </div>
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="shrink-0 px-3 h-8 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center"
                        >
                            {t('nav.signIn')}
                        </Link>
                    )}
                </div>
            </header>

            {/* ── DESKTOP HEADER ── */}
            <header className="hidden md:block sticky top-0 z-50 shadow-md">
                <div className="bg-primary-500">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
                        <Link to="/" className="shrink-0 mr-2">
                            <Logo size="md" />
                        </Link>

                        <div className="flex items-center gap-1 ml-auto shrink-0">
                            <LanguageSwitcher compact />

                            <Link to="/favorites" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                <Heart className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{t('nav.saved')}</span>
                            </Link>
                            <Link to="/messages" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                <MessageSquare className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{t('nav.messages')}</span>
                            </Link>
                            <Link to="/notifications" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                <Bell className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{t('nav.alerts')}</span>
                            </Link>
                            <Link to="/boost" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                <Zap className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{t('nav.boost')}</span>
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
                                    <span className="text-[10px] font-medium">{t('nav.profile')}</span>
                                </Link>
                            ) : (
                                <Link to="/login" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                                    <User className="h-5 w-5" />
                                    <span className="text-[10px] font-medium">{t('nav.signIn')}</span>
                                </Link>
                            )}

                            <Link to="/post-ad"
                                className="ml-2 flex items-center gap-2 bg-secondary-500 hover:bg-secondary-600 active:scale-95 text-white font-bold text-sm px-5 h-10 rounded-lg transition-all shadow-sm shrink-0">
                                <Plus className="h-4 w-4" strokeWidth={3} />
                                {t('nav.sell')}
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 md:pb-0 content-bottom-safe">
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

                    {/* Favorites */}
                    <Link to="/favorites"
                        className="flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform">
                        <div className={cn(
                            'w-10 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                            isActive('/favorites') ? 'bg-primary-100' : ''
                        )}>
                            <Heart className={cn('h-5 w-5 transition-colors', isActive('/favorites') ? 'text-primary-600' : 'text-gray-400')}
                                strokeWidth={isActive('/favorites') ? 2.5 : 1.8}
                                fill={isActive('/favorites') ? 'rgba(125,204,233,0.3)' : 'none'} />
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
                                    background: 'linear-gradient(145deg, #7dcce9 0%, #4aafc8 100%)',
                                    boxShadow: '0 6px 20px rgba(125,204,233,0.5), 0 2px 6px rgba(0,0,0,0.1)',
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
                                    <a href="https://wa.me/252615000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:opacity-70">
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
                                <a href="https://www.facebook.com/suqafuran" target="_blank" rel="noopener noreferrer" className="h-9 w-9 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors">
                                    <Facebook className="h-4 w-4 text-black" />
                                </a>
                                <a href="https://www.twitter.com/suqafuran" target="_blank" rel="noopener noreferrer" className="h-9 w-9 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors">
                                    <Twitter className="h-4 w-4 text-black" />
                                </a>
                                <a href="https://www.instagram.com/suqafuran" target="_blank" rel="noopener noreferrer" className="h-9 w-9 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors">
                                    <Instagram className="h-4 w-4 text-black" />
                                </a>
                                <a href="https://www.youtube.com/@suqafuran" target="_blank" rel="noopener noreferrer" className="h-9 w-9 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors">
                                    <Youtube className="h-4 w-4 text-black" />
                                </a>
                            </div>
                            <p className="text-xs text-black/60 italic">{t('footer.tagline')}</p>
                        </div>
                    </div>
                </div>
            </footer>

            {/* WhatsApp floating support button */}
            <a
                href="https://wa.me/252615000000"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
                style={{ background: '#25D366' }}
                aria-label="WhatsApp Support"
            >
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            </a>

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
                                <a href="https://www.facebook.com/suqafuran" target="_blank" rel="noopener noreferrer" className="h-8 w-8 bg-black/10 rounded-full flex items-center justify-center">
                                    <Facebook className="h-4 w-4 text-black" />
                                </a>
                                <a href="https://www.twitter.com/suqafuran" target="_blank" rel="noopener noreferrer" className="h-8 w-8 bg-black/10 rounded-full flex items-center justify-center">
                                    <Twitter className="h-4 w-4 text-black" />
                                </a>
                                <a href="https://www.instagram.com/suqafuran" target="_blank" rel="noopener noreferrer" className="h-8 w-8 bg-black/10 rounded-full flex items-center justify-center">
                                    <Instagram className="h-4 w-4 text-black" />
                                </a>
                                <a href="https://www.youtube.com/@suqafuran" target="_blank" rel="noopener noreferrer" className="h-8 w-8 bg-black/10 rounded-full flex items-center justify-center">
                                    <Youtube className="h-4 w-4 text-black" />
                                </a>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-black/80">
                                <Link to="/about">{t('footer.aboutUs')}</Link>
                                <Link to="/help">{t('footer.helpCenter')}</Link>
                                <Link to="/terms">{t('footer.terms')}</Link>
                                <Link to="/safety">{t('footer.safetyTips')}</Link>
                                <Link to="/privacy">{t('footer.privacy')}</Link>
                                <Link to="/kh">{t('footer.getKhPin')}</Link>
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
    );
};

export { PublicLayout };
