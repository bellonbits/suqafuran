import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingBag,
    MessageCircle, Heart, Settings, LogOut,
    PlusCircle, Bell, HelpCircle, Shield, Wallet
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { useAuthStore } from '../store/useAuthStore';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuthStore();

    const menuItems = [
        { label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'My Wallet', icon: Wallet, path: '/wallet' },
        { label: 'My Ads', icon: ShoppingBag, path: '/my-ads' },
        { label: 'Messages', icon: MessageCircle, path: '/messages' },
        { label: 'Saved Ads', icon: Heart, path: '/favorites' },
        { label: 'Notifications', icon: Bell, path: '/notifications' },
        { label: 'Help Center', icon: HelpCircle, path: '/help' },
        { label: 'Account Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar - Desktop */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-50 flex justify-center md:justify-start">
                    <Link to="/">
                        <Logo size="md" />
                    </Link>
                </div>

                <div className="p-6 flex items-center gap-3 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold border border-primary-100">
                        {user?.full_name?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-50 space-y-2">
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
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 md:px-8 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">
                        {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-primary-600 relative">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <Link to="/settings" className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                {user?.full_name?.[0]}
                            </div>
                        </Link>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
};

export { DashboardLayout };
