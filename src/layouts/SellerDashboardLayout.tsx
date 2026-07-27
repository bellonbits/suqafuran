import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Archive,
  Users, MessageSquare, Megaphone, Star, BarChart2,
  DollarSign, Store, FileText, Settings, LogOut,
  Bell, Menu, X, ChevronRight, Zap, ExternalLink,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';
import { getImageUrl } from '../utils/imageUtils';
import { sellerDashboardService } from '../services/sellerDashboardService';

const NAV_ITEMS = [
  { path: '/seller-dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/seller-dashboard/products', label: 'Products', icon: Package },
  { path: '/seller-dashboard/orders', label: 'Orders', icon: ShoppingCart, badge: 'orders' },
  { path: '/seller-dashboard/delivery', label: 'Delivery', icon: Truck },
  { path: '/seller-dashboard/inventory', label: 'Inventory', icon: Archive },
  { path: '/seller-dashboard/customers', label: 'Customers', icon: Users },
  { path: '/seller-dashboard/messages', label: 'Messages', icon: MessageSquare, badge: 'messages' },
  { path: '/seller-dashboard/marketing', label: 'Marketing', icon: Megaphone },
  { path: '/seller-dashboard/reviews', label: 'Reviews', icon: Star },
  { path: '/seller-dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/seller-dashboard/finance', label: 'Finance', icon: DollarSign },
  { path: '/seller-dashboard/shop', label: 'Shop Management', icon: Store },
  { path: '/seller-dashboard/reports', label: 'Reports', icon: FileText },
  { path: '/seller-dashboard/settings', label: 'Settings', icon: Settings },
];

export const SellerDashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['seller-notifications'],
    queryFn: sellerDashboardService.getNotifications,
    refetchInterval: 30_000,
  });

  const { data: conversations } = useQuery({
    queryKey: ['seller-conversations'],
    queryFn: sellerDashboardService.getConversations,
    refetchInterval: 15_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['seller-dashboard-stats'],
    queryFn: sellerDashboardService.getDashboardStats,
    staleTime: 60_000,
  });

  const unreadNotifs = (notifications || []).filter((n: any) => !n.is_read).length;
  const unreadMessages = (conversations || []).reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
  const pendingOrders = stats?.pending_orders || 0;

  const getBadge = (badge?: string) => {
    if (badge === 'messages') return unreadMessages;
    if (badge === 'orders') return pendingOrders;
    return 0;
  };

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const currentPage = NAV_ITEMS.find(item => isActive(item));
  const avatarUrl = user?.avatar_url ? getImageUrl(user.avatar_url) : null;

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={cn(
        'fixed md:static inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#0f172a] text-white transition-transform duration-300 ease-in-out md:translate-x-0 shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Zap className="w-4.5 h-4.5 text-white" fill="white" />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-tight">Suqafuran</span>
              <span className="block text-[10px] text-sky-400 font-bold uppercase tracking-widest -mt-0.5">Seller Center</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seller Profile Card */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                : <span>{user?.full_name?.charAt(0) || 'S'}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.full_name || 'Seller'}</p>
              <p className="text-[11px] text-sky-400 truncate">{user?.email || user?.phone || ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const badge = getBadge(item.badge);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group',
                  active
                    ? 'bg-gradient-to-r from-sky-500/20 to-blue-500/10 text-white border border-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/8'
                )}
              >
                <item.icon className={cn('w-4.5 h-4.5 shrink-0 transition-colors', active ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300')} />
                <span className="flex-1 truncate">{item.label}</span>
                {badge > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {active && <ChevronRight className="w-3.5 h-3.5 text-sky-400/60 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-3 border-t border-white/10 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/8 transition-all group">
            <ExternalLink className="w-4.5 h-4.5 text-slate-500 group-hover:text-slate-300" />
            Back to Marketplace
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex-shrink-0 h-16 bg-white border-b border-slate-100 flex items-center px-4 md:px-6 gap-4 shadow-sm z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-slate-400 font-medium hidden sm:block">Seller Center</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />
            <span className="text-sm font-bold text-slate-800 truncate">{currentPage?.label || 'Dashboard'}</span>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link to="/seller-dashboard/settings" className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600">
              <Bell className="w-4.5 h-4.5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
              )}
            </Link>

            {/* Alerts */}
            {pendingOrders > 0 && (
              <Link to="/seller-dashboard/orders" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold hover:bg-orange-100 transition-colors">
                <AlertCircle className="w-3.5 h-3.5" />
                {pendingOrders} Pending
              </Link>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <span>{user?.full_name?.charAt(0) || 'S'}</span>
                }
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user?.full_name || 'Seller'}</p>
                <p className="text-[10px] text-slate-400 leading-tight">Seller Account</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
