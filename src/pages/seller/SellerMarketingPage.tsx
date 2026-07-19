import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Tag, Star, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sellerDashboardService, fmtKSh } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';


export const SellerMarketingPage: React.FC = () => {
  const qc = useQueryClient();
  const [promoTab, setPromoTab] = useState<'coupons' | 'campaigns' | 'sponsored'>('coupons');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_value: '',
    max_uses: '',
    expires_at: '',
  });

  const { data: codes = [], isLoading: codesLoading } = useQuery({
    queryKey: ['seller-marketing-codes'],
    queryFn: sellerDashboardService.getMarketingCodes,
    staleTime: 60_000,
  });

  const createCodeMutation = useMutation({
    mutationFn: sellerDashboardService.createMarketingCode,
    onSuccess: () => {
      toast.success('Promo code created!');
      qc.invalidateQueries({ queryKey: ['seller-marketing-codes'] });
      setIsCouponModalOpen(false);
    },
    onError: () => toast.error('Failed to create code'),
  });

  const deleteCodeMutation = useMutation({
    mutationFn: sellerDashboardService.deactivateMarketingCode,
    onSuccess: () => {
      toast.success('Promo code deactivated');
      qc.invalidateQueries({ queryKey: ['seller-marketing-codes'] });
    },
    onError: () => toast.error('Failed to deactivate code'),
  });

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim() || !couponForm.discount_value) {
      toast.error('Code and value required');
      return;
    }
    createCodeMutation.mutate({
      code: couponForm.code.toUpperCase().trim(),
      discount_type: couponForm.discount_type,
      discount_value: parseFloat(couponForm.discount_value),
      min_order_value: couponForm.min_order_value ? parseFloat(couponForm.min_order_value) : undefined,
      max_uses: couponForm.max_uses ? parseInt(couponForm.max_uses) : undefined,
      is_active: true,
      expires_at: couponForm.expires_at || undefined,
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Marketing Tools</h1>
          <p className="text-sm text-slate-500 mt-0.5">Grow your business and increase sales with custom promotions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-px">
        {[
          { key: 'coupons' as const, label: 'Coupon Codes', icon: Tag },
          { key: 'campaigns' as const, label: 'Discount Campaigns', icon: Megaphone },
          { key: 'sponsored' as const, label: 'Sponsored Listings', icon: Star },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setPromoTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all relative border-b-2',
              promoTab === t.key ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Coupons View */}
      {promoTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">Your Active Coupons</h2>
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Coupon
            </button>
          </div>

          {codesLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : codes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
              <Tag className="w-12 h-12 text-slate-200 mb-3" />
              <p className="text-sm font-bold text-slate-700">No active coupons</p>
              <p className="text-xs text-slate-400 mt-1">Create discount codes to share with your customers</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Min. Purchase</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Expiry</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {codes.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <code className="text-xs font-black bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-1 rounded-lg uppercase">{c.code}</code>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : fmtKSh(c.discount_value)} Off
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        {c.min_order_value ? fmtKSh(c.min_order_value) : 'None'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-KE') : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteCodeMutation.mutate(c.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto flex"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Campaigns View */}
      {promoTab === 'campaigns' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { label: 'Discount Campaigns', desc: 'Create percentage or fixed price reductions across selected products.', active: false },
            { label: 'Flash Sales', desc: 'Run limited-time, deep-discount sales to drive immediate buyer interest.', active: false },
            { label: 'Bundle Offers', desc: 'Encourage larger baskets by offering discounts when products are bought together.', active: false },
            { label: 'Buy One Get One (BOGO)', desc: 'Set up Buy 1 Get 1 Free or Buy 1 Get 2nd 50% Off campaigns.', active: false },
            { label: 'Free Delivery Campaigns', desc: 'Waive shipping fees dynamically for orders matching specific items.', active: false },
          ].map(c => (
            <div key={c.label} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 mb-1">{c.label}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
              <button className="mt-5 w-full py-2 bg-sky-50 text-sky-600 text-xs font-bold rounded-xl hover:bg-sky-100 transition-colors">
                Configure Campaign
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sponsored Listings View */}
      {promoTab === 'sponsored' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="max-w-xl">
            <h2 className="text-base font-bold text-slate-900 mb-2">Boost Listing Placements</h2>
            <p className="text-xs text-slate-500 leading-relaxed">Promote your catalog listings directly to users by bidding for prime marketplace views. Choose placements to increase clicks, impressions, and sales conversion rates.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Featured Listings', desc: 'High visibility banner tag directly in matching search results.', rate: 'KSh 150/day' },
              { label: 'Homepage Placement', desc: 'Showcase items directly on the main Suqafuran homepage feed.', rate: 'KSh 300/day' },
              { label: 'Category Placement', desc: 'Pin products to the header of matching main category pages.', rate: 'KSh 200/day' },
            ].map(p => (
              <div key={p.label} className="border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800 mb-1">{p.label}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{p.desc}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Standard Rate</p>
                  <p className="text-sm font-black text-sky-600">{p.rate}</p>
                  <button className="mt-3 w-full py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-sky-500/10">
                    Apply Placement
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleCreateCoupon} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Create Coupon Code</h3>
              <p className="text-xs text-slate-400 mt-0.5">Define conditions for this promo discount code</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Coupon Code *</label>
              <input
                value={couponForm.code}
                onChange={e => setCouponForm(f => ({ ...f, code: e.target.value }))}
                placeholder="e.g. FLASH20"
                className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 font-mono uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Discount Type</label>
                <select
                  value={couponForm.discount_type}
                  onChange={e => setCouponForm(f => ({ ...f, discount_type: e.target.value as any }))}
                  className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (KSh)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Value *</label>
                <input
                  type="number"
                  value={couponForm.discount_value}
                  onChange={e => setCouponForm(f => ({ ...f, discount_value: e.target.value }))}
                  placeholder="e.g. 15"
                  className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Min. Spend (KSh)</label>
                <input
                  type="number"
                  value={couponForm.min_order_value}
                  onChange={e => setCouponForm(f => ({ ...f, min_order_value: e.target.value }))}
                  placeholder="e.g. 1000"
                  className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Max Uses</label>
                <input
                  type="number"
                  value={couponForm.max_uses}
                  onChange={e => setCouponForm(f => ({ ...f, max_uses: e.target.value }))}
                  placeholder="e.g. 100"
                  className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Expiry Date</label>
              <input
                type="date"
                value={couponForm.expires_at}
                onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsCouponModalOpen(false)} className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl shadow-sm">Save Code</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
