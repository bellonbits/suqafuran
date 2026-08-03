"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse,
  Users, MessageSquare, Megaphone, Star, BarChart3,
  DollarSign, Store, FileText, Settings, LogOut, Menu, X,
  ChevronRight, Home, ArrowLeft, Zap, TrendingUp,
  ShieldCheck, FileUp, UserCog
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuth';
import { AuthModal } from '@/components/shared/AuthModal';

const sellerNavItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/seller-dashboard' },
  { label: 'Products', icon: <Package className="w-5 h-5" />, href: '/seller-dashboard/products' },
  { label: 'Bulk Import', icon: <FileUp className="w-5 h-5" />, href: '/seller-dashboard/products/bulk-import', badge: 'BIZ' },
  { label: 'Orders', icon: <ShoppingCart className="w-5 h-5" />, href: '/seller-dashboard/orders' },
  { label: 'Inventory', icon: <Warehouse className="w-5 h-5" />, href: '/seller-dashboard/inventory' },
  { label: 'Customers', icon: <Users className="w-5 h-5" />, href: '/seller-dashboard/customers' },
  { label: 'Messages', icon: <MessageSquare className="w-5 h-5" />, href: '/seller-dashboard/messages' },
  { label: 'Marketing', icon: <Megaphone className="w-5 h-5" />, href: '/seller-dashboard/marketing' },
  { label: 'Reviews', icon: <Star className="w-5 h-5" />, href: '/seller-dashboard/reviews' },
  { label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, href: '/seller-dashboard/analytics' },
  { label: 'Finance', icon: <DollarSign className="w-5 h-5" />, href: '/seller-dashboard/finance' },
  { label: 'Shop', icon: <Store className="w-5 h-5" />, href: '/seller-dashboard/shop' },
  { label: 'Reports', icon: <FileText className="w-5 h-5" />, href: '/seller-dashboard/reports' },
  { label: 'Verification', icon: <ShieldCheck className="w-5 h-5" />, href: '/seller-dashboard/verification', badge: 'NEW' },

  // Monetization Section
  { label: 'Subscription', icon: <Zap className="w-5 h-5" />, href: '/seller-dashboard/subscription', badge: 'PRO' },
  { label: 'Featured Ads', icon: <TrendingUp className="w-5 h-5" />, href: '/seller-dashboard/featured-ads', badge: 'NEW' },

  { label: 'Staff', icon: <UserCog className="w-5 h-5" />, href: '/seller-dashboard/settings/staff', badge: 'BIZ' },
  { label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/seller-dashboard/settings' },
];

function getPageLabel(pathname: string): string {
  if (pathname === '/seller-dashboard') return 'Dashboard';
  if (pathname === '/seller-dashboard/subscription') return 'Subscription Plans';
  if (pathname === '/seller-dashboard/featured-ads') return 'Featured Advertising';
  if (pathname === '/seller-dashboard/verification') return 'Shop Verification';
  if (pathname === '/seller-dashboard/products/bulk-import') return 'Bulk Import';
  if (pathname === '/seller-dashboard/products/add') return 'Add Product';
  if (pathname === '/seller-dashboard/settings/staff') return 'Staff Accounts';
  const item = sellerNavItems.find(item => item.href === pathname);
  return item?.label || 'Seller Dashboard';
}

export const SellerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentPageLabel = getPageLabel(pathname);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
      if ((e.altKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/seller-dashboard" className="text-lg font-black text-orange-600">
              Suqafuran
            </Link>
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{currentPageLabel}</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`fixed md:sticky top-0 left-0 h-screen md:translate-x-0 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-transform duration-300 z-40 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header - Desktop Only */}
          <div className="hidden md:flex items-center gap-3 px-6 py-6 border-b border-gray-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center flex-shrink-0">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 dark:text-white">Seller Hub</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">Manage your shop</p>
            </div>
          </div>

          <nav className="overflow-y-auto h-[calc(100vh-100px)] md:h-[calc(100vh-80px)] pt-6 px-3 pb-8">
            <div className="space-y-1">
              {sellerNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        item.badge === 'PRO' ? 'bg-purple-100 text-purple-700' :
                        item.badge === 'BIZ' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Link>
                );
              })}
            </div>

            <hr className="my-6 border-gray-200 dark:border-slate-800" />

            <div className="space-y-1">
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Back to Shop</span>
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full overflow-hidden flex flex-col">
          {/* Top Navigation Bar - Desktop */}
          <div className="hidden md:block sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {pathname !== '/seller-dashboard' && (
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Go back (Alt + Left Arrow)"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                  </button>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                  <Link to="/seller-dashboard" className="hover:text-orange-600 font-medium">
                    Dashboard
                  </Link>
                  {pathname !== '/seller-dashboard' && (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      <span className="font-semibold text-gray-900 dark:text-white">{currentPageLabel}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400">
                💡 Tip: Alt + Left Arrow to go back
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AuthModal />
    </div>
  );
};
