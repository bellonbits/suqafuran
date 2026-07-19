"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Warehouse,
  Users, MessageSquare, Megaphone, Star, BarChart3,
  DollarSign, Store, FileText, Settings, LogOut, Menu, X,
  ChevronRight, Home
} from 'lucide-react';

const sellerNavItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/seller-dashboard' },
  { label: 'Products', icon: <Package className="w-5 h-5" />, href: '/seller-dashboard/products' },
  { label: 'Orders', icon: <ShoppingCart className="w-5 h-5" />, href: '/seller-dashboard/orders' },
  { label: 'Delivery', icon: <Truck className="w-5 h-5" />, href: '/seller-dashboard/delivery' },
  { label: 'Inventory', icon: <Warehouse className="w-5 h-5" />, href: '/seller-dashboard/inventory' },
  { label: 'Customers', icon: <Users className="w-5 h-5" />, href: '/seller-dashboard/customers' },
  { label: 'Messages', icon: <MessageSquare className="w-5 h-5" />, href: '/seller-dashboard/messages' },
  { label: 'Marketing', icon: <Megaphone className="w-5 h-5" />, href: '/seller-dashboard/marketing' },
  { label: 'Reviews', icon: <Star className="w-5 h-5" />, href: '/seller-dashboard/reviews' },
  { label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, href: '/seller-dashboard/analytics' },
  { label: 'Finance', icon: <DollarSign className="w-5 h-5" />, href: '/seller-dashboard/finance' },
  { label: 'Shop', icon: <Store className="w-5 h-5" />, href: '/seller-dashboard/shop' },
  { label: 'Reports', icon: <FileText className="w-5 h-5" />, href: '/seller-dashboard/reports' },
  { label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/seller-dashboard/settings' },
];

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-2xl font-black text-orange-600">
            Suqafuran
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`fixed md:sticky top-0 left-0 h-screen md:translate-x-0 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-transform duration-300 z-40 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="hidden md:flex items-center gap-3 px-6 py-6 border-b border-gray-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
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
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Link>
                );
              })}
            </div>

            <hr className="my-6 border-gray-200 dark:border-slate-800" />

            <div className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Back to Shop</span>
              </Link>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full">
          <main className="p-4 md:p-8 max-w-7xl mx-auto">
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
    </div>
  );
}
