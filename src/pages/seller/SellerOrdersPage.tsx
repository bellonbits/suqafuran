import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart, Clock, CheckCircle, XCircle, RefreshCw, Truck,
  Package, AlertTriangle, Eye, Phone, MapPin, Printer, Receipt,
  MessageSquare, X, Search, User
} from 'lucide-react';

import { toast } from 'react-hot-toast';
import { sellerDashboardService, fmtKSh } from '../../services/sellerDashboardService';
import type { SellerOrder } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';

type OrderStatus = 'all' | 'pending' | 'accepted' | 'processing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; border: string }> = {
  pending:         { label: 'Pending',        color: 'text-amber-700',  bg: 'bg-amber-50',   icon: Clock,        border: 'border-amber-200' },
  accepted:        { label: 'Accepted',       color: 'text-blue-700',   bg: 'bg-blue-50',    icon: CheckCircle,  border: 'border-blue-200' },
  processing:      { label: 'Processing',     color: 'text-purple-700', bg: 'bg-purple-50',  icon: RefreshCw,    border: 'border-purple-200' },
  ready_for_pickup:{ label: 'Ready Pickup',   color: 'text-indigo-700', bg: 'bg-indigo-50',  icon: Package,      border: 'border-indigo-200' },
  out_for_delivery:{ label: 'Out Delivery',   color: 'text-sky-700',    bg: 'bg-sky-50',     icon: Truck,        border: 'border-sky-200' },
  delivered:       { label: 'Delivered',      color: 'text-emerald-700',bg: 'bg-emerald-50', icon: CheckCircle,  border: 'border-emerald-200' },
  cancelled:       { label: 'Cancelled',      color: 'text-red-600',    bg: 'bg-red-50',     icon: XCircle,      border: 'border-red-200' },
  refunded:        { label: 'Refunded',       color: 'text-orange-700', bg: 'bg-orange-50',  icon: AlertTriangle,border: 'border-orange-200' },
};

const NEXT_STATUS: Record<string, string[]> = {
  pending:          ['accepted', 'cancelled'],
  accepted:         ['processing', 'cancelled'],
  processing:       ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
};

const StatusBadge: React.FC<{ status: string; small?: boolean }> = ({ status, small }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-slate-600', bg: 'bg-slate-50', icon: Clock, border: 'border-slate-200' };
  return (
    <span className={cn('inline-flex items-center gap-1 font-bold rounded-lg border', cfg.bg, cfg.color, cfg.border, small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1')}>
      <cfg.icon className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {cfg.label}
    </span>
  );
};

const OrderDetailDrawer: React.FC<{
  order: SellerOrder | null;
  onClose: () => void;
  onStatusUpdate: (orderId: number, status: string) => void;
  onContact: (phone: string) => void;
}> = ({ order, onClose, onStatusUpdate, onContact }) => {
  if (!order) return null;
  const nextStatuses = NEXT_STATUS[order.status] || [];

  const handlePrint = () => {
    const content = `
      <html><head><title>Invoice #${order.order_number || order.id}</title>
      <style>body{font-family:sans-serif;padding:24px;max-width:600px;margin:auto}
      h1{color:#0f172a}table{width:100%;border-collapse:collapse}th,td{border:1px solid #e2e8f0;padding:8px;text-align:left}
      .total{font-size:1.2em;font-weight:bold;color:#0ea5e9}</style></head>
      <body>
      <h1>Invoice #${order.order_number || order.id}</h1>
      <p><strong>Customer:</strong> ${order.buyer_name || 'N/A'}</p>
      <p><strong>Phone:</strong> ${order.buyer_phone || 'N/A'}</p>
      <p><strong>Address:</strong> ${order.delivery_address || 'N/A'}</p>
      <p><strong>Payment:</strong> ${order.payment_method || 'N/A'}</p>
      <p><strong>Delivery:</strong> ${order.delivery_method || 'N/A'}</p>
      <p><strong>Notes:</strong> ${order.notes || '—'}</p>
      <hr/>
      <table><thead><tr><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
      <tbody>${(order.items || []).map(i => `<tr><td>${i.product_name || ''}</td><td>${i.quantity}</td><td>${fmtKSh(i.unit_price)}</td><td>${fmtKSh(i.total_price || i.unit_price * i.quantity)}</td></tr>`).join('')}</tbody>
      </table>
      <br/>
      <p>Delivery Fee: ${fmtKSh(order.delivery_fee || 0)}</p>
      <p class="total">TOTAL: ${fmtKSh(order.total_amount)}</p>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(content);
    w.document.close();
    w.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">Order #{order.order_number || order.id}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{order.created_at ? new Date(order.created_at).toLocaleString('en-KE') : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-1">Current Status</p>
              <StatusBadge status={order.status} />
            </div>
            {nextStatuses.length > 0 && (
              <div className="flex gap-2">
                {nextStatuses.map(ns => (
                  <button
                    key={ns}
                    onClick={() => onStatusUpdate(order.id, ns)}
                    className={cn('px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors',
                      ns === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                    )}
                  >
                    → {STATUS_CONFIG[ns]?.label || ns}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Customer</p>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-800">{order.buyer_name || 'Unknown'}</span>
              </div>
              {order.buyer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${order.buyer_phone}`} className="text-sm text-sky-600 font-semibold hover:underline">{order.buyer_phone}</a>
                </div>
              )}
              {order.delivery_address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{order.delivery_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          {(order.items || []).length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Products Ordered</p>
              <div className="space-y-2">
                {order.items!.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                      {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover rounded-lg" /> : <Package className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.product_name || `Item #${item.listing_id}`}</p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity} × {fmtKSh(item.unit_price)}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{fmtKSh(item.total_price || item.unit_price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Order Summary</p>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2">
              {[
                { label: 'Payment Method', value: order.payment_method || '—' },
                { label: 'Delivery Method', value: order.delivery_method || '—' },
                { label: 'Delivery Fee', value: fmtKSh(order.delivery_fee || 0) },
                { label: 'Notes', value: order.notes || '—' },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-xs text-slate-400 font-medium">{r.label}</span>
                  <span className="text-xs font-semibold text-slate-700 text-right max-w-[60%]">{r.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-50 flex justify-between">
                <span className="text-sm font-bold text-slate-800">Total</span>
                <span className="text-sm font-black text-sky-600">{fmtKSh(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex flex-wrap gap-2">
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            <Printer className="w-4 h-4" /> Invoice
          </button>
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            <Receipt className="w-4 h-4" /> Receipt
          </button>
          {order.buyer_phone && (
            <button onClick={() => onContact(order.buyer_phone!)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl transition-colors">
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const SellerOrdersPage: React.FC = () => {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: () => sellerDashboardService.getSellerOrders({ limit: 200 }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      sellerDashboardService.updateDeliveryStatus(id, status),
    onSuccess: () => {
      toast.success('Order status updated!');
      qc.invalidateQueries({ queryKey: ['seller-orders'] });
      setSelectedOrder(null);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const filtered = orders.filter((o: SellerOrder) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return String(o.id).includes(q) || (o.buyer_name || '').toLowerCase().includes(q) || (o.order_number || '').toLowerCase().includes(q);
    }
    return true;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = orders.filter((o: SellerOrder) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const handleStatusUpdate = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ id: orderId, status });
  };

  const handleContact = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${clean.startsWith('0') ? '254' + clean.slice(1) : clean}`, '_blank');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">{filtered.length} orders {statusFilter !== 'all' ? `(${STATUS_CONFIG[statusFilter]?.label})` : 'total'}</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={cn('flex-shrink-0 px-4 py-2 text-xs font-bold rounded-xl transition-all',
            statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
          )}
        >
          All ({orders.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status as OrderStatus); setPage(1); }}
            className={cn('flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all',
              statusFilter === status ? `${cfg.bg} ${cfg.color} border ${cfg.border}` : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            )}
          >
            <cfg.icon className="w-3.5 h-3.5" />
            {cfg.label}
            {statusCounts[status] > 0 && <span className={cn('ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black', statusFilter === status ? 'bg-white/50' : 'bg-slate-100')}>{statusCounts[status]}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by order number or customer name..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
        />
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <ShoppingCart className="w-14 h-14 text-slate-200 mb-4" />
          <h3 className="text-base font-bold text-slate-700">No orders found</h3>
          <p className="text-sm text-slate-400 mt-1">{search ? 'Try a different search' : 'Orders will appear here when customers place them'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((order: SellerOrder) => {
                  const nextStatuses = NEXT_STATUS[order.status] || [];
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-slate-900">#{order.order_number || order.id}</p>
                        <p className="text-xs text-slate-400">{(order.items?.length || 0)} item(s)</p>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-bold flex-shrink-0">
                            {(order.buyer_name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">{order.buyer_name || 'Customer'}</p>
                            {order.buyer_phone && <p className="text-xs text-slate-400">{order.buyer_phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-slate-900">{fmtKSh(order.total_amount)}</p>
                        {order.delivery_fee ? <p className="text-xs text-slate-400">+{fmtKSh(order.delivery_fee)} delivery</p> : null}
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="text-xs text-slate-600">{order.created_at ? new Date(order.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '—'}</p>
                        <p className="text-xs text-slate-400">{order.created_at ? new Date(order.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={order.status} small />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => setSelectedOrder(order)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          {nextStatuses.length > 0 && nextStatuses[0] !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, nextStatuses[0])}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {STATUS_CONFIG[nextStatuses[0]]?.label}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
              <p className="text-xs text-slate-400">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          onContact={handleContact}
        />
      )}
    </div>
  );
};
