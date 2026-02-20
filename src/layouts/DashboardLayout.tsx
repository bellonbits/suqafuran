import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingBag,
    Heart, Settings, LogOut,
    PlusCircle, Bell, HelpCircle, Shield, Wallet, Folder,
    Menu, X
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getAvatarUrl } from '../utils/imageUtils';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { useAuthStore } from '../store/useAuthStore';
import { CurrencySwitcher } from '../components/CurrencySwitcher';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    // Close mobile menu when route changes
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const menuItems = [
        { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'My Wallet', icon: Wallet, path: '/wallet' },
        { label: 'My Ads', icon: ShoppingBag, path: '/my-ads' },
        { label: 'Saved Ads', icon: Heart, path: '/favorites' },
        { label: 'Notifications', icon: Bell, path: '/notifications' },
        { label: 'Help Center', icon: HelpCircle, path: '/help' },
        { label: 'Account Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-20">
                <Link to="/">
                    <Logo size="sm" />
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
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
                "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:flex md:h-screen sticky top-0 overflow-hidden",
                isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-gray-50 flex justify-center md:justify-start hidden md:flex">
                    <Link to="/">
                        <Logo size="md" />
                    </Link>
                </div>

                {/* Mobile Logo in Sidebar (optional, but good for context if opening menu pushes content) */}
                <div className="p-6 border-b border-gray-50 flex justify-between items-center md:hidden">
                    <Logo size="md" />
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 flex items-center gap-3 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold border border-primary-100 overflow-hidden">
                        {getAvatarUrl(user?.avatar_url) ? (
                            <img
                                src={getAvatarUrl(user?.avatar_url)!}
                                alt={user?.full_name || 'User'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            user?.full_name?.[0] || 'U'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                                location.pathname === item.path
                                    ? "bg-primary-50 text-primary-600 shadow-sm shadow-primary-100"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-primary-600"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}

                    {(user?.is_admin || user?.is_agent) && (
                        <div className="pt-4 mt-4 border-t border-gray-50">
                            <p className="px-4 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Agent Tools</p>
                            <Link
                                to="/agent-dashboard"
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-primary-600 hover:bg-primary-50",
                                    location.pathname === '/agent-dashboard' && "bg-primary-50 shadow-sm shadow-primary-100"
                                )}
                            >
                                <Shield className="h-5 w-5" />
                                Agent Portal
                            </Link>
                        </div>
                    )}

                    {user?.is_admin && (
                        <div className="pt-4 mt-4 border-t border-gray-50">
                            <p className="px-4 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Tools</p>
                            <Link
                                to="/admin"
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-secondary-600 hover:bg-secondary-50",
                                    location.pathname === '/admin' && "bg-secondary-50 shadow-sm shadow-secondary-100"
                                )}
                            >
                                <Shield className="h-5 w-5" />
                                Admin Panel
                            </Link>
                            <Link
                                to="/admin/promotions"
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-primary-600 hover:bg-primary-50",
                                    location.pathname === '/admin/promotions' && "bg-primary-50 shadow-sm shadow-primary-100"
                                )}
                            >
                                <Folder className="h-5 w-5" />
                                Promotions
                            </Link>
                        </div>
                    )}
                </nav>

                <div className="mt-auto shrink-0 p-4 border-t border-gray-50 space-y-2 bg-white">
                    <Link to="/post-ad">
                        <Button className="w-full rounded-xl gap-2 font-bold mb-2 shadow-md">
                            <PlusCircle className="h-5 w-5" />
                            Post New Ad
                        </Button>
                    </Link>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all text-left"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50 min-h-screen">
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 md:px-8 flex items-center justify-between">
                    {/* Placeholder for desktop layout alignment */}
                    <div className="md:hidden"></div>

                    <div className="flex items-center gap-4 ml-auto">
                        <CurrencySwitcher />
                        <button className="p-2 text-gray-400 hover:text-primary-600 relative">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <Link to="/settings" className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                            {getAvatarUrl(user?.avatar_url) ? (
                                <img
                                    src={getAvatarUrl(user?.avatar_url)!}
                                    alt={user?.full_name || 'User'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                    {user?.full_name?.[0]}
                                </div>
                            )}
                        </Link>
                    </div>
                </header>

                <div className="p-4 md:p-8 w-full max-w-7xl overflow-x-hidden">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};

export { DashboardLayout };
