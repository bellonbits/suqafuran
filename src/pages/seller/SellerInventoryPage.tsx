import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Archive, AlertTriangle, TrendingUp, TrendingDown, Package, Plus, Minus, X, Search, BarChart2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sellerDashboardService, fmtKSh } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageUtils';

interface AdjustmentLog { id: string; productName: string; change: number; note: string; date: string; }

export const SellerInventoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [adjustModal, setAdjustModal] = useState<{ product: any; isOpen: boolean } | null>(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'add' as 'add' | 'remove', amount: '', note: '' });
  const [adjustmentLogs, setAdjustmentLogs] = useState<AdjustmentLog[]>([]);
  const [localStock, setLocalStock] = useState<Record<number, number>>({});

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['seller-listings'],
    queryFn: () => sellerDashboardService.getMyListings({ limit: 200 }),
    staleTime: 60_000,
  });

  const getStock = (p: any) => localStock[p.id] ?? p.stock_quantity ?? p.stock_level ?? 0;
  const getLowThreshold = (p: any) => p.low_stock_threshold ?? 5;

  const getStockStatus = (p: any) => {
    const stock = getStock(p);
    if (stock === 0) return 'out';
    if (stock <= getLowThreshold(p)) return 'low';
    return 'ok';
  };

  const filtered = listings.filter((l: any) => !search || (l.title_en || '').toLowerCase().includes(search.toLowerCase()));

  const outOfStock = filtered.filter((p: any) => getStockStatus(p) === 'out');
  const lowStock = filtered.filter((p: any) => getStockStatus(p) === 'low');
  const inStock = filtered.filter((p: any) => getStockStatus(p) === 'ok');
  const totalValue = filtered.reduce((sum: number, p: any) => sum + (getStock(p) * (p.price || 0)), 0);

  const handleAdjust = () => {
    if (!adjustModal?.product || !adjustForm.amount) return;
    const amount = parseInt(adjustForm.amount);
    const id = adjustModal.product.id;
    const current = getStock(adjustModal.product);
    const newStock = adjustForm.type === 'add' ? current + amount : Math.max(0, current - amount);
    setLocalStock(prev => ({ ...prev, [id]: newStock }));
    setAdjustmentLogs(prev => [{
      id: Date.now().toString(),
      productName: adjustModal.product.title_en || 'Product',
      change: adjustForm.type === 'add' ? +amount : -amount,
      note: adjustForm.note,
      date: new Date().toLocaleString('en-KE'),
    }, ...prev.slice(0, 49)]);
    toast.success(`Stock ${adjustForm.type === 'add' ? 'increased' : 'reduced'} by ${amount}`);
    setAdjustModal(null);
    setAdjustForm({ type: 'add', amount: '', note: '' });
  };

  const StockBadge: React.FC<{ product: any }> = ({ product }) => {
    const status = getStockStatus(product);
    const stock = getStock(product);
    return (
      <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold',
        status === 'out' ? 'bg-red-50 text-red-600 border border-red-200'
        : status === 'low' ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      )}>
        <span className={cn('w-1.5 h-1.5 rounded-full', status === 'out' ? 'bg-red-500' : status === 'low' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')} />
        {status === 'out' ? 'Out of Stock' : status === 'low' ? `Low (${stock})` : `In Stock (${stock})`}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage and monitor your stock levels</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: filtered.length, icon: Archive, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'In Stock', value: inStock.length, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Low Stock', value: lowStock.length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Out of Stock', value: outOfStock.length, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.bg)}>
              <card.icon className={cn('w-5 h-5', card.color)} />
            </div>
            <p className="text-2xl font-black text-slate-900">{card.value}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold mb-1">Inventory Value</p>
          <p className="text-2xl font-black text-slate-900">{fmtKSh(totalValue)}</p>
          <p className="text-xs text-slate-400 mt-1">Total value of all stock on hand</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold mb-1">Best Selling</p>
          <p className="text-sm font-bold text-slate-800 truncate">
            {listings.sort((a: any, b: any) => (b.views || 0) - (a.views || 0))[0]?.title_en || '—'}
          </p>
          <p className="text-xs text-slate-400 mt-1">{listings.sort((a: any, b: any) => (b.views || 0) - (a.views || 0))[0]?.views || 0} views</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-800">Low Stock Alert — {lowStock.length} product(s)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.slice(0, 6).map((p: any) => (
              <button key={p.id} onClick={() => { setAdjustModal({ product: p, isOpen: true }); setAdjustForm({ type: 'add', amount: '', note: '' }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors">
                <Package className="w-3 h-3" />
                {p.title_en?.slice(0, 20) || 'Product'} ({getStock(p)} left)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + Table */}
      <div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide hidden sm:table-cell">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide hidden md:table-cell">Value</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                          {p.images?.[0] ? <img src={getImageUrl(p.images[0])} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-300 m-auto mt-2.5" />}
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{p.title_en || 'Product'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <code className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded">{p.sku || '—'}</code>
                    </td>
                    <td className="px-4 py-3"><StockBadge product={p} /></td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-semibold text-slate-700">{fmtKSh(getStock(p) * (p.price || 0))}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setAdjustModal({ product: p, isOpen: true }); setAdjustForm({ type: 'add', amount: '', note: '' }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors ml-auto">
                        <BarChart2 className="w-3.5 h-3.5" /> Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjustment History */}
      {adjustmentLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Inventory Adjustment History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {adjustmentLogs.map(log => (
              <div key={log.id} className="flex items-center gap-4 px-6 py-3">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', log.change > 0 ? 'bg-emerald-50' : 'bg-red-50')}>
                  {log.change > 0 ? <Plus className="w-3.5 h-3.5 text-emerald-600" /> : <Minus className="w-3.5 h-3.5 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{log.productName}</p>
                  {log.note && <p className="text-xs text-slate-400 truncate">{log.note}</p>}
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-bold', log.change > 0 ? 'text-emerald-600' : 'text-red-500')}>{log.change > 0 ? '+' : ''}{log.change}</p>
                  <p className="text-xs text-slate-400">{log.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Adjust Stock</h3>
              <button onClick={() => setAdjustModal(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-4 truncate">{adjustModal.product.title_en}</p>
            <div className="flex gap-2 mb-4">
              {(['add', 'remove'] as const).map(t => (
                <button key={t} onClick={() => setAdjustForm(f => ({ ...f, type: t }))}
                  className={cn('flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors capitalize', adjustForm.type === t ? (t === 'add' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                  {t === 'add' ? <><Plus className="w-3.5 h-3.5 inline mr-1" />Add Stock</> : <><Minus className="w-3.5 h-3.5 inline mr-1" />Remove Stock</>}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Quantity *</label>
                <input type="number" value={adjustForm.amount} onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))} min="1" placeholder="Enter quantity" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Note (optional)</label>
                <input value={adjustForm.note} onChange={e => setAdjustForm(f => ({ ...f, note: e.target.value }))} placeholder="Reason for adjustment" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAdjustModal(null)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button onClick={handleAdjust} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl shadow-sm">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
