import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingBag, Eye } from 'lucide-react';
import { sellerDashboardService } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';


// Simple bar component
const Bar: React.FC<{ pct: number; label: string; valStr: string }> = ({ pct, label, valStr }) => (
  <div className="space-y-1 text-xs">
    <div className="flex justify-between items-baseline">
      <span className="font-semibold text-slate-700 truncate max-w-[70%]">{label}</span>
      <span className="font-bold text-slate-900">{valStr}</span>
    </div>
    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  </div>
);

export const SellerAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const { data: stats } = useQuery({
    queryKey: ['seller-dashboard-stats-analytics'],
    queryFn: sellerDashboardService.getDashboardStats,
    staleTime: 60_000,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['seller-listings-analytics'],
    queryFn: () => sellerDashboardService.getMyListings({ limit: 100 }),
    staleTime: 5 * 60_000,
  });

  const totalViews = stats?.product_views ?? listings.reduce((sum: number, l: any) => sum + (l.views || 0), 0);
  const totalFavorites = listings.reduce((sum: number, l: any) => sum + (l.favorites_count || 0), 0);

  // Top products by views
  const topProducts = [...listings]
    .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const maxViews = topProducts.length ? Math.max(...topProducts.map((p: any) => p.views || 1)) : 1;

  // Category distribution
  const catMap: Record<string, number> = {};
  listings.forEach((l: any) => {
    const cat = l.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const topCategories = Object.entries(catMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const maxCatVal = topCategories.length ? Math.max(...topCategories.map(x => x[1])) : 1;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Understand your traffic and storefront activity metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {([
            { key: 'day' as const, label: 'Today' },
            { key: 'week' as const, label: 'Weekly' },
            { key: 'month' as const, label: 'Monthly' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setPeriod(t.key)}
              className={cn(
                'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all',
                period === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Shop Views', value: (stats?.shop_views ?? 0).toLocaleString(), icon: Eye, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Product Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Favorites', value: totalFavorites.toLocaleString(), icon: TrendingUp, color: 'text-pink-500', bg: 'bg-pink-50' },
          { label: 'Active Listings', value: listings.length, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3.5', m.bg)}>
              <m.icon className={cn('w-4.5 h-4.5', m.color)} />
            </div>
            <p className="text-xl font-black text-slate-950 leading-none">{m.value}</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Products by Traffic</h3>
            <p className="text-xs text-slate-400">Products with highest user interest count</p>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-xs text-slate-400">No product view analytics available</p>
          ) : (
            <div className="space-y-4 pt-2">
              {topProducts.map(p => (
                <Bar
                  key={p.id}
                  label={p.title_en || 'Product'}
                  pct={((p.views || 0) / maxViews) * 100}
                  valStr={`${p.views || 0} views`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Top Product Categories */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Product Categories</h3>
            <p className="text-xs text-slate-400">Categories with highest listing inventory counts</p>
          </div>
          {topCategories.length === 0 ? (
            <p className="text-xs text-slate-400">No category listing data</p>
          ) : (
            <div className="space-y-4 pt-2">
              {topCategories.map(([cat, count]) => (
                <Bar
                  key={cat}
                  label={cat}
                  pct={(count / maxCatVal) * 100}
                  valStr={`${count} items`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
