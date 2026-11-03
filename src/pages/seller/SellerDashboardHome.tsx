import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus, Package, MessageSquare, Eye, AlertCircle,
  Lightbulb, Zap, ChevronRight, ShieldCheck
} from 'lucide-react';
import { sellerDashboardService } from '../../services/sellerDashboardService';
import { useAuthStore } from '../../store/useAuthStore';
import { getImageUrl } from '../../utils/imageUtils';
import { BoardStatCard } from '../../components/dashboard/BoardStatCard';
import { StatusBadge } from '../../components/dashboard/StatusBadge';

export const SellerDashboardHome: React.FC = () => {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['seller-dashboard-overview'],
    queryFn: sellerDashboardService.getDashboardStats,
    refetchInterval: 30_000,
  });

  const sellerName = user?.full_name?.split(' ')[0] || user?.username || 'Seller';
  const activeProducts = stats?.active_products ?? 0;
  const unreadMessages = stats?.unread_messages ?? 0;
  const productViews = stats?.total_views ?? stats?.product_views ?? 0;
  const attentionProducts = stats?.products_needing_attention ?? [];
  const recentInquiries = stats?.recent_inquiries ?? [];

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#00BFFF] via-[#02CCFE] to-[#0095D4] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-500/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Suqafuran Seller</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Welcome back, {sellerName}!
            </h1>
            <p className="text-sky-50 text-sm sm:text-base max-w-xl">
              Your listings are active across East Africa. What would you like to sell today?
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link
              to="/seller-dashboard/products/new"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-white text-[#0095D4] hover:text-[#007BB3] hover:bg-sky-50 font-bold rounded-2xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 text-base min-h-[52px]"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Add a Product</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3 Core Real Metrics with BoardUI Stat Cards ────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BoardStatCard
          label="Products Online"
          value={isLoading ? '...' : activeProducts}
          caption={activeProducts === 1 ? '1 item live for buyers' : `${activeProducts} items live for buyers`}
          icon={Package}
          deltaTone="positive"
        />

        <BoardStatCard
          label="New Buyer Messages"
          value={isLoading ? '...' : unreadMessages}
          delta={unreadMessages > 0 ? `${unreadMessages} unread` : 'All caught up'}
          deltaTone={unreadMessages > 0 ? 'negative' : 'positive'}
          caption={unreadMessages > 0 ? 'Waiting for your reply' : 'All messages answered'}
          icon={MessageSquare}
        />

        <BoardStatCard
          label="Total Product Views"
          value={isLoading ? '...' : productViews.toLocaleString()}
          caption="Shoppers who viewed your ads"
          icon={Eye}
          deltaTone="positive"
        />
      </div>

      {/* ── Products Needing Attention ─────────────────────────────── */}
      {attentionProducts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Products Needing Your Attention ({attentionProducts.length})</span>
          </div>
          <p className="text-xs text-amber-800">
            These items are under review or require quick updates before buyers can see them.
          </p>
          <div className="divide-y divide-amber-200/50">
            {attentionProducts.map((p: any) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {p.image_url ? (
                    <img
                      src={getImageUrl(p.image_url)}
                      alt={p.title}
                      className="w-12 h-12 rounded-xl object-cover bg-amber-100 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-200 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{p.title}</p>
                      <StatusBadge status={p.status || 'under_review'} />
                    </div>
                    <p className="text-xs text-amber-700 font-medium mt-0.5">
                      {p.status === 'rejected'
                        ? `Needs change: ${p.rejection_reason || 'Please review guidelines'}`
                        : 'Currently under review by safety team'}
                    </p>
                  </div>
                </div>
                <Link
                  to="/seller-dashboard/products"
                  className="shrink-0 px-3.5 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-colors"
                >
                  View item
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Buyer Enquiries & Tips Grid ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Buyer Enquiries */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#00BFFF]" />
                <span>Recent Buyer Enquiries</span>
              </h2>
              <Link
                to="/seller-dashboard/messages"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentInquiries.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No buyer messages yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  When interested buyers ask about your products, their messages will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInquiries.slice(0, 3).map((inq: any) => (
                  <Link
                    key={inq.id}
                    to="/seller-dashboard/messages"
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-sky-50/50 border border-slate-100 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {inq.buyer_name || 'Buyer'}
                        </span>
                        {inq.unread && (
                          <span className="px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Re: <span className="font-medium text-slate-700">{inq.listing_title}</span>
                      </p>
                      <p className="text-xs text-slate-600 truncate mt-0.5 italic">
                        "{inq.last_message || 'Is this still available?'}"
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold shrink-0 group-hover:bg-sky-600 transition-colors">
                      Reply
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Sellers who reply within 15 minutes sell up to 3x faster.</span>
            </p>
          </div>
        </div>

        {/* Simple Tips For Selling Faster */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>3 Tips for Faster Sales</span>
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                1
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-slate-900">Take clear, bright photos</p>
                <p className="text-slate-600 leading-relaxed">
                  Natural daylight makes your product look honest and appealing. Take photos from front, back, and sides.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                2
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-slate-900">Set a realistic price</p>
                <p className="text-slate-600 leading-relaxed">
                  Check what similar items sell for on Suqafuran. Items with fair market pricing sell in under 48 hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                3
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-slate-900">Include exact location</p>
                <p className="text-slate-600 leading-relaxed">
                  Buyers prefer shopping from sellers close to their neighborhood or town for easy pickup and cash-on-meet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardHome;
