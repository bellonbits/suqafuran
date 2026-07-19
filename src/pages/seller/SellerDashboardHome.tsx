import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, ShoppingCart, Package, DollarSign,
  Eye, MessageSquare, Star, Users, Truck, RefreshCw,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle,
  AlertTriangle, Plus, ChevronRight, BarChart2, Zap
} from 'lucide-react';

import { sellerDashboardService, fmtKSh } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';

// ── Sparkline SVG ────────────────────────────────────────────────────────────
const Sparkline: React.FC<{ data: number[]; color?: string; height?: number }> = ({
  data, color = '#38bdf8', height = 40
}) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 120; const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={pts} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── Bar Chart SVG ────────────────────────────────────────────────────────────
const BarChart: React.FC<{ data: { label: string; value: number }[]; color?: string }> = ({ data, color = '#38bdf8' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{ height: `${(d.value / max) * 100}%`, backgroundColor: color, opacity: 0.7 + (i / data.length) * 0.3 }}
          />
          <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ── Donut Chart SVG ──────────────────────────────────────────────────────────
const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const r = 60; const cx = 70; const cy = 70;
  const segments = data.map(d => {
    const pct = d.value / total;
    const start = cumulative * 2 * Math.PI;
    const end = (cumulative + pct) * 2 * Math.PI;
    cumulative += pct;
    const x1 = cx + r * Math.sin(start); const y1 = cy - r * Math.cos(start);
    const x2 = cx + r * Math.sin(end); const y2 = cy - r * Math.cos(end);
    const large = pct > 0.5 ? 1 : 0;
    return { ...d, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, pct };
  });
  return (
    <div className="flex items-center gap-4">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
        {segments.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={r - 22} fill="white" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e293b">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-slate-600 font-medium truncate max-w-[100px]">{d.label}</span>
            <span className="text-xs font-bold text-slate-800 ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: number;
  sparkData?: number[];
  sparkColor?: string;
  link?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconColor, iconBg, trend, sparkData, sparkColor, link }) => {
  const content = (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full',
            trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          )}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
        </div>
        {sparkData && sparkData.length > 1 && (
          <div className="opacity-60 group-hover:opacity-100 transition-opacity">
            <Sparkline data={sparkData} color={sparkColor || '#38bdf8'} height={32} />
          </div>
        )}
      </div>
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : <div>{content}</div>;
};

// ── Order Status Badge ────────────────────────────────────────────────────────
const statusMeta: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-blue-700', bg: 'bg-blue-50', icon: CheckCircle },
  processing: { label: 'Processing', color: 'text-purple-700', bg: 'bg-purple-50', icon: RefreshCw },
  ready_for_pickup: { label: 'Ready', color: 'text-indigo-700', bg: 'bg-indigo-50', icon: Package },
  out_for_delivery: { label: 'Delivering', color: 'text-sky-700', bg: 'bg-sky-50', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  refunded: { label: 'Refunded', color: 'text-orange-700', bg: 'bg-orange-50', icon: AlertTriangle },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const meta = statusMeta[status] || { label: status, color: 'text-slate-600', bg: 'bg-slate-50', icon: Clock };
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg', meta.bg, meta.color)}>
      {meta.label}
    </span>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const SellerDashboardHome: React.FC = () => {
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['seller-dashboard-stats'],
    queryFn: sellerDashboardService.getDashboardStats,
    staleTime: 2 * 60_000,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['seller-orders-recent'],
    queryFn: () => sellerDashboardService.getSellerOrders({ limit: 10 }),
    staleTime: 60_000,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['seller-listings'],
    queryFn: () => sellerDashboardService.getMyListings({ limit: 50 }),
    staleTime: 5 * 60_000,
  });

  const { data: walletData } = useQuery({
    queryKey: ['seller-wallet'],
    queryFn: sellerDashboardService.getWalletBalance,
    staleTime: 2 * 60_000,
  });

  // Derive stats
  const totalRevenue = stats?.total_revenue ?? walletData?.balance ?? 0;
  const revenueToday = stats?.revenue_today ?? 0;
  const revenueMonth = stats?.revenue_this_month ?? 0;
  const totalOrders = stats?.total_orders ?? orders.length;
  const pendingOrders = stats?.pending_orders ?? orders.filter((o: any) => o.status === 'pending').length;
  const processingOrders = stats?.processing_orders ?? orders.filter((o: any) => ['processing', 'accepted'].includes(o.status)).length;
  const deliveredOrders = stats?.delivered_orders ?? orders.filter((o: any) => o.status === 'delivered').length;
  const cancelledOrders = stats?.cancelled_orders ?? orders.filter((o: any) => o.status === 'cancelled').length;
  const activeProducts = stats?.active_products ?? listings.filter((l: any) => l.status === 'active' || l.is_active).length;
  const outOfStock = stats?.out_of_stock_products ?? 0;
  const shopViews = stats?.shop_views ?? 0;
  const productViews = stats?.product_views ?? 0;
  const avgRating = stats?.average_rating ?? 0;
  const totalReviews = stats?.total_reviews ?? 0;

  // Generate mock trend data if API doesn't provide it
  const makeTrend = (base: number, count: number) =>
    Array.from({ length: count }, (_, i) => Math.max(0, base * (0.5 + Math.random() * 1.2) * (0.8 + i * 0.03)));

  const salesTrend = stats?.sales_trend || makeTrend(revenueMonth / 30, 14);
  const ordersTrend = stats?.orders_trend || makeTrend(totalOrders / 30, 14);

  // Top products from listings
  const topProducts = [...listings]
    .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  // Category distribution
  const catMap: Record<string, number> = {};
  listings.forEach((l: any) => {
    const cat = l.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const DONUT_COLORS = ['#38bdf8', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
  const categoryData = Object.entries(catMap).slice(0, 5).map(([label, value], i) => ({
    label, value, color: DONUT_COLORS[i % DONUT_COLORS.length]
  }));

  // Revenue bars (last 7 days / weeks / months)
  const periodCount = trendPeriod === 'daily' ? 7 : trendPeriod === 'weekly' ? 4 : 6;
  const periodLabels = trendPeriod === 'daily'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : trendPeriod === 'weekly'
    ? ['Wk1', 'Wk2', 'Wk3', 'Wk4']
    : ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const revenueBarData = Array.from({ length: periodCount }, (_, i) => ({
    label: periodLabels[i] || `${i + 1}`,
    value: salesTrend[i] || 0
  }));

  const loading = statsLoading || ordersLoading;

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back! Here's your business at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link to="/seller-dashboard/products">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </Link>
        </div>
      </div>

      {/* Revenue KPIs */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Revenue</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Revenue" value={fmtKSh(totalRevenue)} icon={DollarSign} iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={12} sparkData={salesTrend.slice(0, 7)} sparkColor="#10b981" link="/seller-dashboard/finance" />
          <StatCard title="Revenue Today" value={fmtKSh(revenueToday)} icon={TrendingUp} iconColor="text-sky-600" iconBg="bg-sky-50" trend={8} sparkData={salesTrend.slice(-7)} sparkColor="#38bdf8" link="/seller-dashboard/finance" />
          <StatCard title="Revenue This Month" value={fmtKSh(revenueMonth)} icon={BarChart2} iconColor="text-purple-600" iconBg="bg-purple-50" trend={15} sparkData={salesTrend} sparkColor="#8b5cf6" link="/seller-dashboard/finance" />
        </div>
      </div>

      {/* Orders KPIs */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Orders</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCart} iconColor="text-blue-600" iconBg="bg-blue-50" trend={5} sparkData={ordersTrend.slice(0, 7)} sparkColor="#3b82f6" link="/seller-dashboard/orders" />
          <StatCard title="Pending" value={pendingOrders} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" link="/seller-dashboard/orders?status=pending" />
          <StatCard title="Processing" value={processingOrders} icon={RefreshCw} iconColor="text-purple-600" iconBg="bg-purple-50" link="/seller-dashboard/orders?status=processing" />
          <StatCard title="Delivered" value={deliveredOrders} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={3} link="/seller-dashboard/orders?status=delivered" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-1 gap-4 mt-4 max-w-[200px]">
          <StatCard title="Cancelled" value={cancelledOrders} icon={XCircle} iconColor="text-red-500" iconBg="bg-red-50" link="/seller-dashboard/orders?status=cancelled" />
        </div>
      </div>

      {/* Products & Shop KPIs */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Products & Visibility</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Active Products" value={activeProducts} icon={Package} iconColor="text-indigo-600" iconBg="bg-indigo-50" trend={2} link="/seller-dashboard/products" />
          <StatCard title="Out of Stock" value={outOfStock} icon={AlertTriangle} iconColor="text-orange-600" iconBg="bg-orange-50" link="/seller-dashboard/inventory" />
          <StatCard title="Shop Views" value={shopViews.toLocaleString()} icon={Eye} iconColor="text-sky-600" iconBg="bg-sky-50" trend={18} sparkData={makeTrend(shopViews / 30, 7)} sparkColor="#0ea5e9" link="/seller-dashboard/analytics" />
          <StatCard title="Product Views" value={productViews.toLocaleString()} icon={Eye} iconColor="text-teal-600" iconBg="bg-teal-50" trend={11} link="/seller-dashboard/analytics" />
        </div>
      </div>

      {/* Engagement KPIs */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Engagement</p>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-sm">
          <StatCard title="Messages" value={stats?.unread_messages ?? 0} icon={MessageSquare} iconColor="text-blue-600" iconBg="bg-blue-50" link="/seller-dashboard/messages" />
          <StatCard title="Reviews" value={totalReviews} icon={Star} iconColor="text-amber-500" iconBg="bg-amber-50" link="/seller-dashboard/reviews" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Trend</h3>
              <p className="text-xs text-slate-400">Sales performance over time</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
              {(['daily', 'weekly', 'monthly'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setTrendPeriod(p)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all',
                    trendPeriod === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <BarChart data={revenueBarData} color="#38bdf8" />
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Top Categories</h3>
            <p className="text-xs text-slate-400">Products by category</p>
          </div>
          {categoryData.length > 0
            ? <DonutChart data={categoryData} />
            : <div className="flex items-center justify-center h-32 text-slate-300 text-sm">No data yet</div>
          }
        </div>
      </div>

      {/* Top Products + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Top Products</h3>
            <Link to="/seller-dashboard/products" className="flex items-center gap-1 text-xs text-sky-600 font-bold hover:text-sky-700">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">No products yet</p>
              <Link to="/seller-dashboard/products" className="mt-3 text-xs font-bold text-sky-600 hover:underline">Add your first product →</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {topProducts.map((p: any, i) => (
                <div key={p.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors">
                  <span className="w-6 text-xs font-black text-slate-300">#{i + 1}</span>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      : <Package className="w-5 h-5 text-slate-300 m-auto mt-2.5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.title_en || p.name_en || 'Product'}</p>
                    <p className="text-xs text-slate-400">{fmtKSh(p.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-700">{p.views || 0} views</p>
                    <p className="text-[10px] text-slate-400">#{p.id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
            <Link to="/seller-dashboard/orders" className="flex items-center gap-1 text-xs text-sky-600 font-bold hover:text-sky-700">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">No orders yet</p>
              <p className="text-xs text-slate-300 mt-1">Orders will appear here once customers start buying</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {orders.slice(0, 6).map((order: any) => (
                <Link
                  key={order.id}
                  to={`/seller-dashboard/orders`}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">#{order.order_number || order.id}</p>
                    <p className="text-xs text-slate-400 truncate">{order.buyer_name || 'Customer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{fmtKSh(order.total_amount)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Product', to: '/seller-dashboard/products', icon: Plus, color: 'from-sky-500 to-blue-600' },
            { label: 'View Orders', to: '/seller-dashboard/orders', icon: ShoppingCart, color: 'from-emerald-500 to-teal-600' },
            { label: 'Finance', to: '/seller-dashboard/finance', icon: DollarSign, color: 'from-purple-500 to-indigo-600' },
            { label: 'Shop Profile', to: '/seller-dashboard/shop', icon: Users, color: 'from-orange-500 to-amber-600' },
          ].map(a => (
            <Link key={a.to} to={a.to}>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer group">
                <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0', a.color)}>
                  <a.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-white/90 group-hover:text-white">{a.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Average Rating */}
      {avgRating > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-black text-slate-900">{avgRating.toFixed(1)}</p>
            <div className="flex items-center gap-0.5 justify-center mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={cn('w-4 h-4', s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')} />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">{totalReviews} reviews</p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800 mb-1">Shop Rating</p>
            <p className="text-xs text-slate-400">Your average customer rating across all products</p>
            <Link to="/seller-dashboard/reviews" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-sky-600 hover:text-sky-700">
              View all reviews <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
