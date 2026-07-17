"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Users, Settings, LogOut, Menu, X,
  BarChart3, Wallet, Truck, Store, ShoppingCart, MessageSquare,
  Bell, Search, ChevronLeft, Home
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuth';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  navItems: NavItem[];
  userRole: 'admin' | 'agent' | 'seller' | 'rider' | 'user';
}

const roleColors: Record<string, string> = {
  admin: 'from-sky-500 to-blue-600',
  agent: 'from-emerald-500 to-teal-600',
  seller: 'from-purple-500 to-pink-600',
  rider: 'from-orange-500 to-amber-600',
  user: 'from-gray-500 to-slate-600',
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  navItems,
  userRole,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const gradientClass = roleColors[userRole] || roleColors.admin;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`${
          sidebarOpen ? 'w-64' : 'w-[72px]'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col flex-shrink-0 relative z-20`}
      >
        {/* Logo / Brand */}
        <div
          className="flex items-center gap-3 p-4 border-b border-slate-800 cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
          onClick={() => router.push('/')}
        >
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Image src="/icon1.png" alt="Logo" width={28} height={28} className="object-contain" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-sm font-black text-white leading-tight">Suqafuran</p>
                <p className="text-xs text-slate-400 capitalize">{userRole} Panel</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back to Shops button */}
        <div className={`px-3 pt-3 pb-2 border-b border-slate-800 flex-shrink-0 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          <Link href="/" className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 transition-all duration-200 ${sidebarOpen ? 'w-full' : 'w-10 h-10 justify-center'}`}>
            <Home className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold whitespace-nowrap"
                >
                  Back to Shops
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-3 space-y-0.5">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <motion.button
                key={idx}
                whileHover={{ x: sidebarOpen ? 3 : 0 }}
                onClick={() => router.push(item.href)}
                title={!sidebarOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sky-400 rounded-r-full" />
                )}
                <div className="w-5 h-5 flex-shrink-0">{item.icon}</div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium flex-1 text-left truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge && sidebarOpen && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                    {item.badge}
                  </span>
                )}
                {item.badge && !sidebarOpen && (
                  <span className="absolute -right-1 -top-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
                {/* Tooltip for collapsed */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                    {item.label}
                  </div>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 space-y-0.5 flex-shrink-0">
          <motion.button
            whileHover={{ x: sidebarOpen ? 3 : 0 }}
            onClick={() => router.push('/settings')}
            title={!sidebarOpen ? 'Settings' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.button
            whileHover={{ x: sidebarOpen ? 3 : 0 }}
            onClick={handleLogout}
            title={!sidebarOpen ? 'Sign out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400/70 hover:bg-red-900/20 hover:text-red-400 transition-all ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
              <h1 className="text-xl font-black text-gray-900 tracking-tight">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 px-3.5 py-2 rounded-xl text-gray-500 focus-within:ring-2 ring-sky-300 transition-all">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none text-sm w-36 text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Back to Shops (header shortcut) */}
            <Link href="/" className="hidden lg:flex btn-back">
              <Home className="w-3.5 h-3.5" />
              Back to Shops
            </Link>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-400 capitalize">{userRole}</p>
                </div>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{user?.email || ''}</p>
                    </div>
                    <button onClick={() => { router.push('/profile'); setShowUserMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                      View Profile
                    </button>
                    <button onClick={() => { router.push('/settings'); setShowUserMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                      Settings
                    </button>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={() => { handleLogout(); setShowUserMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm font-semibold transition-colors">
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6 max-w-[1600px] mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
