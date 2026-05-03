import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { notificationService } from '../services/notificationService';
import {
    ShoppingBag,
    Heart, Settings, LogOut,
    PlusCircle, Bell, HelpCircle, Shield, Wallet, Folder,
    Menu, X, TrendingUp, MessageSquare, Zap, Target,

    MessageCircle, Users, Globe, House
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getAvatarUrl } from '../utils/imageUtils';
import { Logo } from '../components/Logo';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/Button';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface DashboardLayoutProps {
    children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { t } = useTranslation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationService.getMyNotifications,
        enabled: !!user,
        refetchInterval: 30000,
    });

    const unreadCount = notifications?.filter(n => !n.is_read)?.length || 0;

    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const menuItems = [
        { labelKey: 'dashboard.myAdverts', label: 'My adverts', icon: ShoppingBag, path: '/my-ads' },
        { labelKey: 'dashboard.savedAds', label: 'Saved ads', icon: Heart, path: '/favorites' },
        { labelKey: 'dashboard.feedback', label: 'Feedback', icon: MessageCircle, path: '/feedback' },
        { labelKey: 'dashboard.performance', label: 'Performance', icon: Target, path: '/performance' },
    ];

    const secondaryItems = [
        { labelKey: 'dashboard.proSales', label: 'Pro Sales', icon: TrendingUp, path: '/pro-sales' },
        { labelKey: 'dashboard.premiumServices', label: 'Premium Services', icon: Shield, path: '/premium' },
        { labelKey: 'dashboard.myBalance', label: 'My Balance', icon: Wallet, path: '/wallet', detail: user?.wallet?.balance ? `${user.wallet.balance.toLocaleString()} tokens` : '0 tokens' },
        { labelKey: 'dashboard.followers', label: 'Followers', icon: Users, path: '/followers' },
        { labelKey: 'dashboard.requestHelp', label: 'Request help', icon: HelpCircle, path: '/help' },
        { labelKey: 'dashboard.faq', label: 'FAQ', icon: HelpCircle, path: '/help' },
    ];

    return (
        <div className="h-[100dvh] max-h-[100dvh] w-full bg-gray-50 flex flex-col md:flex-row overflow-hidden relative">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-20">
                <Link to="/">
                    <Logo size="sm" className="brightness-0" />
                </Link>
                <div className="flex items-center gap-3">
                    <LanguageSwitcher variant="pill" light={false} />
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 z-40 h-[100dvh] w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:flex md:h-full md:top-auto overflow-hidden",
                isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-gray-50 flex justify-center md:justify-start hidden md:flex">
                    <Link to="/">
                        <Logo size="md" className="brightness-0" />
                    </Link>
                </div>

                <div className="p-5 border-b border-gray-50 flex justify-center md:hidden">
                    <Logo size="md" className="brightness-0" />
                </div>

                <div className="p-5 flex flex-col items-center gap-2 border-b border-gray-50 bg-white">
                    {/* Close button — mobile only, top-right of sidebar */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors z-10"
                        aria-label="Close menu"
                    >
                        <X className="h-4 w-4 stroke-[2.5]" />
                    </button>

                    <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold border-2 border-primary-100 overflow-hidden shadow-sm">
                        {getAvatarUrl(user?.avatar_url) ? (
                            <img
                                src={getAvatarUrl(user?.avatar_url, { width: 100, quality: 'eco' })!}
                                alt={user?.full_name || 'User'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-2xl">{user?.full_name?.[0] || 'U'}</div>
                        )}
                    </div>
                    <div className="text-center w-full min-w-0">
                        <p className="text-base font-bold text-gray-900 truncate">{user?.full_name || 'User'}</p>
                        <p className="text-xs text-primary-600 font-medium mt-0.5">{user?.phone || t('auth.addPhone', 'Add phone number')}</p>
                    </div>
                    {/* Settings — below profile info */}
                    <Link
                        to="/settings"
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 rounded-full px-3 py-1.5 transition-colors mt-1"
                    >
                        <Settings className="h-3.5 w-3.5" />
                        {t('nav.settings', 'Settings')}
                    </Link>
                </div>

                <div className="px-4 py-2">
                    <Link to="/notifications" className="bg-orange-500 rounded-lg p-3 text-white flex items-center justify-between shadow-sm hover:bg-orange-600 transition-colors w-full">
                        <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5" />
                            <span className="text-sm font-bold">Alerts</span>
                        </div>
                        {unreadCount > 0 && (
                            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">{unreadCount} new</span>
                        )}
                    </Link>
                </div>

                <nav className="flex-1 p-4 pt-1 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
                    <Link to="/" className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all active:scale-95 mb-1">
                        <House className="h-5 w-5 text-gray-400" />
                        {t('nav.backToHome', 'Back to Home')}
                    </Link>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-primary-50 text-gray-900"
                                        : "text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-primary-600" : "text-gray-400")} />
                                <span className="font-bold flex-1 text-left">{t(item.labelKey, item.label)}</span>
                            </Link>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-gray-100">
                        {secondaryItems.map((item) => (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <item.icon className="h-5 w-5 text-gray-400" />
                                <div className="flex-1 flex items-center justify-between">
                                    <span>{t(item.labelKey, item.label)}</span>
                                    {item.detail && (
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">{item.detail}</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {(user?.is_admin || user?.is_agent) && (
                        <div className="pt-4 mt-4 border-t border-gray-100">
                            <p className="px-4 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.agentTools', 'Agent Tools')}</p>
                            <Link
                                to="/agent-dashboard"
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-primary-600 hover:bg-primary-50",
                                    location.pathname === '/agent-dashboard' && "bg-primary-50 shadow-sm"
                                )}
                            >
                                <Shield className="h-5 w-5" />
                                {t('dashboard.agentPortal', 'Agent Portal')}
                            </Link>
                        </div>
                    )}

                    {user?.is_admin && (
                        <div className="pt-4 mt-4 border-t border-gray-100">
                            <p className="px-4 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.adminTools', 'Admin Tools')}</p>
                            <Link
                                to="/admin"
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-secondary-600 hover:bg-secondary-50",
                                    location.pathname === '/admin' && "bg-secondary-50 shadow-sm"
                                )}
                            >
                                <Shield className="h-5 w-5" />
                                {t('dashboard.adminPanel', 'Admin Panel')}
                            </Link>
                            <Link
                                to="/admin/listings"
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-primary-600 hover:bg-primary-50",
                                    location.pathname === '/admin/listings' && "bg-primary-50 shadow-sm"
                                )}
                            >
                                <ShoppingBag className="h-5 w-5" />
                                {t('dashboard.allListings', 'All Listings')}
                            </Link>
                            <Link
                                to="/admin/promotions"
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-primary-600 hover:bg-primary-50",
                                    location.pathname === '/admin/promotions' && "bg-primary-50 shadow-sm"
                                )}
                            >
                                <Folder className="h-5 w-5" />
                                {t('dashboard.promotions', 'Promotions')}
                            </Link>
                            <Link
                                to="/admin/categories"
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-secondary-600 hover:bg-secondary-50",
                                    location.pathname === '/admin/categories' && "bg-secondary-50 shadow-sm"
                                )}
                            >
                                <Folder className="h-5 w-5" />
                                {t('dashboard.categories', 'Categories')}
                            </Link>
                            <Link
                                to="/admin/verifications"
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-amber-600 hover:bg-amber-50",
                                    location.pathname === '/admin/verifications' && "bg-amber-50 shadow-sm"
                                )}
                            >
                                <Shield className="h-5 w-5" />
                                {t('dashboard.verifications', 'Verifications')}
                            </Link>
                            <Link
                                to="/admin/editor"
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-indigo-600 hover:bg-indigo-50",
                                    location.pathname === '/admin/editor' && "bg-indigo-50 shadow-sm"
                                )}
                            >
                                <Globe className="h-5 w-5" />
                                {t('dashboard.webEditor', 'Web Editor')}
                            </Link>
                        </div>
                    )}
                </nav>

                {/* ── Sidebar Footer — always pinned at the bottom ── */}
                <div className="shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-100 bg-white space-y-2">

                    <Link to="/post-ad" className="block">
                        <Button className="w-full rounded-xl gap-2 font-bold shadow-sm">
                            <PlusCircle className="h-5 w-5" />
                            {t('listing.postAd')}
                        </Button>
                    </Link>

                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all text-left active:scale-95"
                    >
                        <LogOut className="h-5 w-5" />
                        {t('auth.logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50 h-full overflow-y-auto custom-scrollbar">
                <header className="sticky top-0 z-20 bg-primary-500 border-b border-primary-600/10 p-2 md:px-8 flex items-center justify-between shadow-sm">
                    <div className="flex-1 max-w-xl hidden md:flex">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-gray-100 border-none rounded-lg py-2 px-10 text-sm focus:ring-2 focus:ring-primary-500"
                            />
                            <Menu className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 ml-auto">
                        <div className="hidden md:block mr-2">
                            <LanguageSwitcher variant="pill" light={false} />
                        </div>
                        <div className="hidden md:flex items-center gap-1 md:gap-2">
                            <Link to="/favorites" className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all" title="Saved ads">
                                <Heart className="h-5 w-5" />
                            </Link>
                            <Link to="/messages" className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all relative" title="Messages">
                                <MessageSquare className="h-5 w-5" />
                            </Link>
                            <Link to="/notifications" className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all relative" title="Notifications">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </Link>
                            <Link to="/performance" className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all" title="Promotion">
                                <Zap className="h-5 w-5" />
                            </Link>
                            <Link to="/my-ads" className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all relative" title="My adverts">
                                <ShoppingBag className="h-5 w-5" />
                            </Link>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary-600 text-xs font-bold border-2 border-primary-200 shadow-sm overflow-hidden ml-2">
                                {getAvatarUrl(user?.avatar_url) ? (
                                    <img src={getAvatarUrl(user?.avatar_url, { width: 100, quality: 'eco' })!} className="w-full h-full object-cover" alt="" />
                                ) : user?.full_name?.[0]}
                            </div>
                        </div>

                        <Link to="/post-ad" className="hidden md:block">
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-6 h-9 font-bold text-sm uppercase tracking-wide border-none shadow-sm">
                                Sell
                            </Button>
                        </Link>
                    </div>
                </header>

                <div className="p-4 md:p-8 w-full max-w-7xl mx-auto overflow-x-hidden">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};

export { DashboardLayout };
