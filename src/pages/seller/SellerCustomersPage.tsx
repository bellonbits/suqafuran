import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, User, Phone, Mail, DollarSign, Calendar, Search, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { sellerDashboardService, fmtKSh } from '../../services/sellerDashboardService';
import type { CustomerRecord } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';


export const SellerCustomersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // We fetch orders to construct the customer profiles dynamically if no businessId is provided or the endpoint returns empty.
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['seller-orders-for-customers'],
    queryFn: () => sellerDashboardService.getSellerOrders({ limit: 500 }),
    staleTime: 60_000,
  });

  // Construct customers from orders
  const customerMap: Record<string, CustomerRecord> = {};
  orders.forEach((o: any) => {
    const key = o.buyer_phone || o.buyer_name || `cust-${o.buyer_id || o.id}`;
    if (!customerMap[key]) {
      customerMap[key] = {
        id: o.buyer_id || o.id,
        name: o.buyer_name || 'Anonymous Customer',
        phone: o.buyer_phone || undefined,
        email: o.buyer_email || undefined,
        total_orders: 0,
        total_spend: 0,
        last_purchase_date: o.created_at,
        is_new: false,
      };
    }
    const c = customerMap[key];
    c.total_orders += 1;
    c.total_spend += o.total_amount || 0;
    if (new Date(o.created_at) > new Date(c.last_purchase_date || '')) {
      c.last_purchase_date = o.created_at;
    }
  });

  const customers = Object.values(customerMap);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q);
  });

  // Analytics
  const newCustomers = customers.filter(c => c.total_orders === 1);
  const returningCustomers = customers.filter(c => c.total_orders > 1);
  const topCustomers = [...customers].sort((a, b) => b.total_spend - a.total_spend).slice(0, 5);

  const totalSpendAll = customers.reduce((sum, c) => sum + c.total_spend, 0);


  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Customer Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track, segment and view purchase history of your customers</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: customers.length, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'New Customers', value: newCustomers.length, icon: User, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Returning Customers', value: returningCustomers.length, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Avg Spend/Customer', value: fmtKSh(customers.length ? totalSpendAll / customers.length : 0), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.bg)}>
              <card.icon className={cn('w-5 h-5', card.color)} />
            </div>
            <p className="text-xl font-black text-slate-900">{card.value}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Top Customers and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customers by name, phone or email..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          {ordersLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
              <Users className="w-14 h-14 text-slate-200 mb-4" />
              <h3 className="text-base font-bold text-slate-700">No customers found</h3>
              <p className="text-sm text-slate-400 mt-1">Make sure you have processed some orders.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Total Spend</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Last Purchase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(c => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-bold flex-shrink-0">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                              {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-semibold">{c.total_orders}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{fmtKSh(c.total_spend)}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 hidden sm:table-cell">
                          {c.last_purchase_date ? new Date(c.last_purchase_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* CRM Panel (Top Customers / Customer Details Drawer style card) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-sky-500" /> Top Customers
            </h3>
            {topCustomers.length === 0 ? (
              <p className="text-xs text-slate-400">No customer spend history yet</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {topCustomers.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-xs font-black text-slate-300 w-5">#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.total_orders} orders</p>
                    </div>
                    <span className="text-sm font-bold text-slate-950">{fmtKSh(c.total_spend)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedCustomer && (
            <div className="bg-white rounded-2xl border border-sky-100 shadow-md p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <button onClick={() => setSelectedCustomer(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-bold text-sky-500 uppercase tracking-widest mb-4">Customer Details</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 text-lg font-black">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">{selectedCustomer.name}</h4>
                  <p className="text-xs text-slate-400">Registered Customer</p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`tel:${selectedCustomer.phone}`} className="hover:underline">{selectedCustomer.phone}</a>
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
                <div className="h-px bg-slate-100 my-2" />
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Total Orders</span>
                    <span className="text-sm font-black text-slate-800">{selectedCustomer.total_orders}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Total Spend</span>
                    <span className="text-sm font-black text-sky-600">{fmtKSh(selectedCustomer.total_spend)}</span>
                  </div>
                </div>
                {selectedCustomer.last_purchase_date && (
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">
                    <Calendar className="w-3 h-3" />
                    Last Purchase: {new Date(selectedCustomer.last_purchase_date).toLocaleDateString('en-KE')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { X } from 'lucide-react';
