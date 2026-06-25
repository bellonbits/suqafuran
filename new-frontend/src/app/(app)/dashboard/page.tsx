"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, FolderHeart, BarChart3, Plus, Eye, CheckCircle2, ShieldCheck, Store, Loader2, LayoutGrid } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { businessService } from '../../../services/business';
import { useAuthStore } from '../../../store/useAuth';
import type { Business, BusinessProduct, Order, BusinessAnalytics } from '../../../types';

type Tab = 'overview' | 'products' | 'orders' | 'analytics';

const BUSINESS_CATEGORIES = ['shop', 'service', 'restaurant', 'freelancer'];

function slugify(name: string) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function DashboardContent() {
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const initialTab = (searchParams.get('tab') as Tab) || 'overview';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    const [loadingBusinesses, setLoadingBusinesses] = useState(true);
    const [business, setBusiness] = useState<Business | null>(null);
    const [loadingData, setLoadingData] = useState(false);

    const [products, setProducts] = useState<BusinessProduct[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);

    // New business onboarding form
    const [bizName, setBizName] = useState('');
    const [bizCategory, setBizCategory] = useState(BUSINESS_CATEGORIES[0]);
    const [bizAddress, setBizAddress] = useState('');
    const [creatingBiz, setCreatingBiz] = useState(false);
    const [bizError, setBizError] = useState('');

    // New product form
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductStock, setNewProductStock] = useState('10');
    const [addingProduct, setAddingProduct] = useState(false);

    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

    useEffect(() => {
        businessService.getMyBusinesses()
            .then(list => {
                if (list.length > 0) setBusiness(list[0]);
            })
            .catch(err => console.error('Failed to load businesses', err))
            .finally(() => setLoadingBusinesses(false));
    }, []);

    useEffect(() => {
        if (!business) return;
        setLoadingData(true);
        Promise.all([
            businessService.getProducts(business.id),
            businessService.getOrders(business.id),
            businessService.getAnalytics(business.id),
        ])
            .then(([prods, ords, an]) => {
                setProducts(prods);
                setOrders(ords);
                setAnalytics(an);
            })
            .catch(err => console.error('Failed to load business data', err))
            .finally(() => setLoadingData(false));
    }, [business]);

    const handleCreateBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bizName.trim()) return;
        setCreatingBiz(true);
        setBizError('');
        try {
            const created = await businessService.registerBusiness({
                name: bizName.trim(),
                slug: slugify(bizName) || `shop-${Date.now()}`,
                category: bizCategory,
                address: bizAddress.trim() || undefined,
            });
            setBusiness(created);
        } catch (err: any) {
            setBizError(err?.response?.data?.detail || 'Failed to create business workspace');
        } finally {
            setCreatingBiz(false);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!business || !newProductName.trim() || !newProductPrice.trim()) return;
        setAddingProduct(true);
        try {
            const newProd = await businessService.addProduct(business.id, {
                name_en: newProductName.trim(),
                price: Number(newProductPrice),
                stock_level: Number(newProductStock) || 0,
            });
            setProducts(prev => [newProd, ...prev]);
            setNewProductName('');
            setNewProductPrice('');
            setNewProductStock('10');
        } catch (err) {
            console.error('Failed to add product', err);
        } finally {
            setAddingProduct(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId: number, nextStatus: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded') => {
        if (!business) return;
        setUpdatingOrderId(orderId);
        try {
            const updated = await businessService.updateOrder(business.id, orderId, { status: nextStatus });
            setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
        } catch (err) {
            console.error('Failed to update order status', err);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const activeOrdersCount = orders.filter(o => o.status !== 'completed').length;
    const totalProductViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
    const chartData = (analytics?.sales_trends_7d || []).map(t => ({
        name: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: t.revenue,
    }));

    if (loadingBusinesses) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading your workspace...
            </div>
        );
    }

    // No business yet: onboarding state
    if (!business) {
        return (
            <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
                <div className="text-center space-y-2 mb-8">
                    <Store className="h-10 w-10 text-primary mx-auto" />
                    <h1 className="text-xl font-black text-gray-900 dark:text-slate-100 font-poppins">Set up your seller workspace</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">
                        Register a business to manage inventory, track orders, and see real sales analytics.
                    </p>
                </div>

                <form onSubmit={handleCreateBusiness} className="p-6 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-4">
                    {bizError && (
                        <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/20 rounded-2xl p-3">{bizError}</p>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Business Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Rajo Skincare"
                            value={bizName}
                            onChange={(e) => setBizName(e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Category</label>
                        <select
                            value={bizCategory}
                            onChange={(e) => setBizCategory(e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 capitalize"
                        >
                            {BUSINESS_CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Address (optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Eastleigh, Nairobi"
                            value={bizAddress}
                            onChange={(e) => setBizAddress(e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={creatingBiz}
                        className="btn-premium w-full bg-primary text-white py-3 text-sm shadow-md shadow-primary/20 hover:bg-primary-dark disabled:opacity-50"
                    >
                        {creatingBiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Create Workspace
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-8">

                {/* Left Side SaaS tabs */}
                <aside className="w-full md:w-60 shrink-0 space-y-2">
                    <div className="p-4 bg-slate-900 text-white rounded-3xl mb-4 dark:bg-slate-800">
                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">SaaS Hub</span>
                        <h2 className="text-sm font-black font-poppins mt-0.5 truncate">{business.name}</h2>
                    </div>

                    {[
                        { id: 'overview' as Tab, name: 'Dashboard', icon: LayoutDashboard },
                        { id: 'products' as Tab, name: 'Inventory Products', icon: FolderHeart },
                        { id: 'orders' as Tab, name: 'Order Statuses', icon: ShoppingBag },
                        { id: 'analytics' as Tab, name: 'Sales Analytics', icon: BarChart3 }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isCurrent = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left text-xs font-black transition-all cursor-pointer ${isCurrent ? 'bg-primary text-white shadow shadow-primary/20' : 'text-gray-500 hover:bg-slate-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                            >
                                <Icon className="h-4.5 w-4.5" />
                                <span>{tab.name}</span>
                            </button>
                        );
                    })}

                    {(user?.is_agent || user?.is_admin) && (
                        <Link
                            href="/agent"
                            className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left text-xs font-black text-primary hover:bg-primary/5 dark:text-sky-400 dark:hover:bg-sky-400/5 border border-primary/20 dark:border-sky-400/20"
                        >
                            <ShieldCheck className="h-4.5 w-4.5" />
                            <span>Agent Hub</span>
                        </Link>
                    )}

                    {user?.is_admin && (
                        <Link
                            href="/admin"
                            className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left text-xs font-black text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700"
                        >
                            <LayoutGrid className="h-4.5 w-4.5" />
                            <span>Admin Console</span>
                        </Link>
                    )}
                </aside>

                {/* Right Side Content Panel */}
                <div className="flex-1 space-y-8 min-w-0">

                    {loadingData ? (
                        <div className="py-20 text-center text-sm font-semibold text-gray-400">
                            <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                            Loading workspace data...
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-fade-in-up">
                                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                        <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-2">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Sales Revenue</span>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">${analytics?.revenue.toLocaleString() ?? 0}</h3>
                                            <span className="text-[9px] text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-full">{analytics?.completed_orders ?? 0} completed orders</span>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-2">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Product Views</span>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">{totalProductViews}</h3>
                                            <span className="text-[9px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">Across {products.length} listings</span>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-2">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Orders</span>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">{activeOrdersCount}</h3>
                                            <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">Requires attention</span>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-2">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Inventory Items</span>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">{products.length}</h3>
                                            <span className="text-[9px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full">
                                                {analytics?.low_stock_count ?? 0} low on stock
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-4">
                                        <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 font-poppins">Revenue — Last 7 Days</h3>
                                        {chartData.length > 0 ? (
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                                                                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                                                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                                                        <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                                                        <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} />
                                                        <Area type="monotone" dataKey="revenue" stroke="#38BDF8" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 font-semibold py-8 text-center">No completed sales in the last 7 days yet</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'products' && (
                                <div className="space-y-6 animate-scale-in">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Inventory Manager</h2>
                                    </div>

                                    <form onSubmit={handleAddProduct} className="p-5 rounded-3xl bg-slate-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-end">
                                        <div className="space-y-1.5 flex-1 w-full">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Product Title</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Add new items..."
                                                value={newProductName}
                                                onChange={(e) => setNewProductName(e.target.value)}
                                                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                            />
                                        </div>
                                        <div className="space-y-1.5 w-full md:w-32">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Price (USD)</label>
                                            <input
                                                type="number"
                                                required
                                                placeholder="Price..."
                                                value={newProductPrice}
                                                onChange={(e) => setNewProductPrice(e.target.value)}
                                                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                            />
                                        </div>
                                        <div className="space-y-1.5 w-full md:w-28">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Stock Level</label>
                                            <input
                                                type="number"
                                                required
                                                placeholder="Stock..."
                                                value={newProductStock}
                                                onChange={(e) => setNewProductStock(e.target.value)}
                                                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                            />
                                        </div>
                                        <button type="submit" disabled={addingProduct} className="btn-premium bg-primary text-white px-5 py-3 text-xs w-full md:w-auto shrink-0 shadow-md shadow-primary/20 hover:bg-primary-dark disabled:opacity-50">
                                            {addingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            <span>Add Product</span>
                                        </button>
                                    </form>

                                    {products.length === 0 ? (
                                        <div className="py-12 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                                            No products in your catalog yet
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {products.map(prod => (
                                                <div key={prod.id} className="p-4 bg-white border border-gray-100 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex gap-4">
                                                    {prod.images?.[0] ? (
                                                        <img src={prod.images[0]} alt="" className="h-16 w-16 rounded-2xl object-cover shrink-0" />
                                                    ) : (
                                                        <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-gray-300 shrink-0">
                                                            <FolderHeart className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                    <div className="overflow-hidden flex-1 flex flex-col justify-between py-0.5">
                                                        <div>
                                                            <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{prod.name_en}</h4>
                                                            <span className="text-[10px] font-bold text-primary dark:text-sky-400">
                                                                USD {prod.price}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prod.stock_level > 0 ? 'text-green-600 bg-green-50 dark:bg-green-950/20' : 'text-red-500 bg-red-50 dark:bg-red-950/20'}`}>
                                                                {prod.stock_level > 0 ? `Stock: ${prod.stock_level} units` : 'Out of stock'}
                                                            </span>
                                                            <span className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold">{prod.is_active ? 'Active' : 'Inactive'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div className="space-y-6 animate-scale-in">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Manage Customer Orders</h2>

                                    {orders.length === 0 ? (
                                        <div className="py-12 text-center text-sm font-semibold text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl">
                                            No orders recorded yet
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {orders.map(order => (
                                                <div key={order.id} className="p-5 bg-white border border-gray-100 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-black text-gray-900 dark:text-slate-100">Order #{order.id}</span>
                                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                                                order.status === 'completed' ? 'text-green-600 bg-green-50' :
                                                                order.status === 'processing' ? 'text-sky-600 bg-sky-50' :
                                                                'text-amber-500 bg-amber-50'
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">
                                                            Amount: <strong className="text-gray-700 dark:text-slate-300">USD {order.total_amount}</strong> | Method: {order.payment_method}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2 w-full md:w-auto">
                                                        {order.status !== 'completed' && (
                                                            <>
                                                                <button
                                                                    disabled={updatingOrderId === order.id}
                                                                    onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                                                    className="btn-premium bg-accent text-white px-3 py-1.5 text-[10px] hover:bg-green-600 disabled:opacity-50"
                                                                >
                                                                    Mark Completed
                                                                </button>
                                                                <button
                                                                    disabled={updatingOrderId === order.id}
                                                                    onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                                                                    className="btn-premium bg-slate-100 border border-gray-200 text-gray-700 px-3 py-1.5 text-[10px] hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 disabled:opacity-50"
                                                                >
                                                                    Process Order
                                                                </button>
                                                            </>
                                                        )}
                                                        {order.status === 'completed' && (
                                                            <div className="text-xs text-accent font-bold flex items-center gap-1">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                <span>Handled Successfully</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'analytics' && (
                                <div className="space-y-6 animate-scale-in">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Sales Analytics</h2>

                                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                        <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Revenue</span>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">${analytics?.revenue.toLocaleString() ?? 0}</h3>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Completed Orders</span>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">{analytics?.completed_orders ?? 0}</h3>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Customers</span>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">{analytics?.customer_count ?? 0}</h3>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Low Stock</span>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-slate-100">{analytics?.low_stock_count ?? 0}</h3>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white border border-gray-100 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 h-80">
                                        {chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                                                    <YAxis stroke="#94A3B8" fontSize={10} />
                                                    <Tooltip />
                                                    <Area type="monotone" dataKey="revenue" stroke="#22C55E" fill="#22C55E" fillOpacity={0.15} strokeWidth={3} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-xs text-gray-400 font-semibold">No completed sales in the last 7 days yet</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SellerDashboard() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading...
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
