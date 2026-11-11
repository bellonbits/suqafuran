"use client";

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, DollarSign, Search, Filter, Loader2,
  Mail, ShoppingBag, ChevronRight, MessageSquare, User, X
} from 'lucide-react';
import api from '@/services/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomersData();
  }, []);

  const loadCustomersData = async () => {
    try {
      const ordersRes = await api.get('/orders?limit=100').catch(() => null);

      if (ordersRes?.data) {
        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data.orders || ordersRes.data.items || [];

        const customerMap = new Map<string, any>();
        orders.forEach((order: any) => {
          const customerId = order.customer_id || order.id;
          const customerName = order.customer_name || order.customer?.full_name || order.buyer_name || 'Guest Customer';

          if (!customerMap.has(customerId)) {
            customerMap.set(customerId, {
              id: customerId,
              name: customerName,
              email: order.customer_email || order.email || 'Direct Order',
              phone: order.phone || order.customer_phone || '',
              orders: 0,
              spent: 0,
            });
          }

          const customer = customerMap.get(customerId)!;
          customer.orders += 1;
          customer.spent += Number(order.total_amount || order.amount || 0);
        });

        const customersList = Array.from(customerMap.values());
        setCustomers(customersList);

        const totalCustomers = customersList.length;
        const repeatCustomers = customersList.filter((c: any) => c.orders > 1).length;
        const avgOrderValue = totalCustomers > 0
          ? customersList.reduce((sum: number, c: any) => sum + c.spent, 0) / totalCustomers
          : 0;

        setStats({
          total_customers: totalCustomers,
          repeat_customers: repeatCustomers,
          avg_order_value: Math.round(avgOrderValue),
        });
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const name = (c.name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return !q || name.includes(q) || email.includes(q);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-semibold text-slate-400">Loading customer information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto px-1 md:px-0">
      
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Customers
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block mt-0.5">
            View shopper order history, repeat clients, and total lifetime spend
          </p>
        </div>

        <Link
          to="/seller-dashboard/messages"
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-full text-xs font-extrabold transition-all shadow-md shadow-sky-500/20 active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Open Inbox</span>
        </Link>
      </div>

      {/* ── Compact 3-Metric Strip (Redesigned from tall stacked boxes) ── */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-4">
        <div className="bg-white dark:bg-neutral-900/90 rounded-2xl md:rounded-3xl p-3.5 md:p-4 border border-slate-100 dark:border-neutral-800 shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">
            Total Customers
          </span>
          <p className="text-lg md:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats?.total_customers || 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Unique buyers</span>
        </div>

        <div className="bg-white dark:bg-neutral-900/90 rounded-2xl md:rounded-3xl p-3.5 md:p-4 border border-slate-100 dark:border-neutral-800 shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block truncate">
            Repeat Shoppers
          </span>
          <p className="text-lg md:text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
            {stats?.repeat_customers || 0}
          </p>
          <span className="text-[10px] text-sky-600/70 mt-1 block">&gt; 1 order</span>
        </div>

        <div className="bg-white dark:bg-neutral-900/90 rounded-2xl md:rounded-3xl p-3.5 md:p-4 border border-slate-100 dark:border-neutral-800 shadow-sm">
          <span className="text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block truncate">
            Avg Order Value
          </span>
          <p className="text-base md:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
            KSh {Number(stats?.avg_order_value || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-600/70 mt-1 block">Per transaction</span>
        </div>
      </div>

      {/* ── Search Input ── */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by customer name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Customers List Cards (Mobile & Desktop View) ── */}
      {filteredCustomers.length > 0 ? (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => {
            const initial = (customer.name || 'C').charAt(0).toUpperCase();

            return (
              <div
                key={customer.id}
                className="bg-white dark:bg-neutral-900/90 rounded-2xl p-4 border border-slate-100 dark:border-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex items-center justify-between gap-3 group"
              >
                {/* Left: Avatar & Details */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 text-white font-extrabold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                      {customer.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {customer.email}
                    </p>
                  </div>
                </div>

                {/* Right: Orders Badge & Total Spend */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center justify-end gap-1.5 mb-1">
                    <span className="text-[10px] font-black text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full">
                      {customer.orders} {customer.orders === 1 ? 'Order' : 'Orders'}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white">
                    KSh {Number(customer.spent || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900/60 rounded-3xl border border-slate-100 dark:border-neutral-800 p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
            {searchQuery ? 'No matching customers found' : 'No customers recorded yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {searchQuery ? 'Try clearing your search query.' : 'When buyers place orders in your shop, their profiles and order summaries will appear here.'}
          </p>
        </div>
      )}

    </div>
  );
}
