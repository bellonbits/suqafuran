"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, FolderHeart, BarChart3, Settings, Plus, Eye, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { businessService } from '../../services/business';
import { listingsService } from '../../services/listings';
import type { BusinessProduct, Order } from '../../types';

// Mock graph analytics data
const salesData = [
    { name: 'Jan', sales: 400, views: 1200 },
    { name: 'Feb', sales: 600, views: 1800 },
    { name: 'Mar', sales: 900, views: 2400 },
    { name: 'Apr', sales: 1400, views: 3100 },
    { name: 'May', sales: 2100, views: 4200 },
    { name: 'Jun', sales: 2450, views: 5600 },
];

export default function SellerDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'analytics'>('overview');
    
    // Inventory and Orders list
    const [products, setProducts] = useState<BusinessProduct[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    
    // New product dialog state
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductStock, setNewProductStock] = useState('10');
    
    useEffect(() => {
        // Load stats
        const loadDashboardStats = async () => {
            try {
                const prodList = await businessService.getProducts('mock-business-id');
                setProducts(prodList);
            } catch {
                // Mock products if API empty
                setProducts([
                    { id: 1, business_id: 'b-1', name_en: 'Premium Sneakers Classic', price: 99, stock_level: 12, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop'], is_active: true },
                    { id: 2, business_id: 'b-1', name_en: 'Bluetooth Headphone Pro', price: 149, stock_level: 5, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop'], is_active: true },
                    { id: 3, business_id: 'b-1', name_en: 'Leather Travel Duffle Bag', price: 180, stock_level: 0, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=200&auto=format&fit=crop'], is_active: false }
                ]);
            }

            try {
                const ordList = await businessService.getOrders('mock-business-id');
                setOrders(ordList);
            } catch {
                // Mock orders if API empty
                setOrders([
                    { id: 10001, business_id: 'b-1', customer_id: 102, status: 'pending', total_amount: 198, payment_status: 'unpaid', payment_method: 'Pay on Delivery', items: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                    { id: 10002, business_id: 'b-1', customer_id: 103, status: 'processing', total_amount: 149, payment_status: 'unpaid', payment_method: 'Pay on Delivery', items: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                    { id: 10003, business_id: 'b-1', customer_id: 104, status: 'completed', total_amount: 180, payment_status: 'paid', payment_method: 'Seller Agreed', items: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                ]);
            }
        };
        loadDashboardStats();
    }, []);

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProductName.trim() || !newProductPrice.trim()) return;

        const newProd: BusinessProduct = {
            id: Date.now(),
            business_id: 'b-1',
            name_en: newProductName,
            price: Number(newProductPrice),
            stock_level: Number(newProductStock),
            images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop'],
            is_active: true
        };

        setProducts(prev => [newProd, ...prev]);
        setNewProductName('');
        setNewProductPrice('');
        setNewProductStock('10');
    };

    const handleUpdateOrderStatus = (orderId: number, nextStatus: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded') => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-8">
                
                {/* Left Side SaaS tabs */}
                <aside className="w-full md:w-60 shrink-0 space-y-2">
                    <div className="p-4 bg-slate-900 text-white rounded-3xl mb-4">
                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">SaaS Hub</span>
                        <h2 className="text-sm font-black font-poppins mt-0.5">Ahmed's Shop</h2>
                    </div>

                    {[
                        { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
                        { id: 'products', name: 'Inventory Products', icon: FolderHeart },
                        { id: 'orders', name: 'Order Statuses', icon: ShoppingBag },
                        { id: 'analytics', name: 'Sales Analytics', icon: BarChart3 }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isCurrent = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left text-xs font-black transition-all cursor-pointer ${isCurrent ? 'bg-primary text-white shadow shadow-primary/20' : 'text-gray-500 hover:bg-slate-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                            >
                                <Icon className="h-4.5 w-4.5" />
                                <span>{tab.name}</span>
                            </button>
                        );
                    })}
                </aside>

                {/* Right Side Content Panel */}
                <main className="flex-1 space-y-8">
                    
                    {activeTab === 'overview' && (
                        /* Dashboard Overview */
                        <div className="space-y-8 animate-fade-in-up">
                            {/* Metrics widgets */}
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-2">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Sales Revenue</span>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">$2,450</h3>
                                    <span className="text-[9px] text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-full">+12.5% this week</span>
                                </div>
                                <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-2">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Store Views</span>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">1,402</h3>
                                    <span className="text-[9px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">+8.2% this week</span>
                                </div>
                                <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-2">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Orders</span>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                                        {orders.filter(o => o.status !== 'completed').length}
                                    </h3>
                                    <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">Requires attention</span>
                                </div>
                                <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-2">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Inventory Items</span>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                                        {products.length}
                                    </h3>
                                    <span className="text-[9px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full">
                                        {products.filter(p => p.stock_level === 0).length} out of stock
                                    </span>
                                </div>
                            </div>

                            {/* Performance chart */}
                            <div className="p-6 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-4">
                                <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 font-poppins">Sales & Traffic Analytics</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15}/>
                                            <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false}/>
                                            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false}/>
                                            <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}/>
                                            <Area type="monotone" dataKey="sales" stroke="#38BDF8" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        /* Inventory Manager List */
                        <div className="space-y-6 animate-scale-in">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Inventory Manager</h2>
                            </div>

                            {/* Add new product panel */}
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
                                <button type="submit" className="btn-premium bg-primary text-white px-5 py-3 text-xs w-full md:w-auto shrink-0 shadow-md shadow-primary/20 hover:bg-primary-dark">
                                    <Plus className="h-4 w-4" />
                                    <span>Add Product</span>
                                </button>
                            </form>

                            {/* Products Grid list */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {products.map(prod => (
                                    <div key={prod.id} className="p-4 bg-white border border-gray-100 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex gap-4">
                                        <img src={prod.images[0]} alt="" className="h-16 w-16 rounded-2xl object-cover shrink-0" />
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
                                                <span className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold">Active</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        /* Orders manager list */
                        <div className="space-y-6 animate-scale-in">
                            <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Manage Customer Orders</h2>
                            
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

                                        {/* Status controls */}
                                        <div className="flex gap-2 w-full md:w-auto">
                                            {order.status !== 'completed' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                                        className="btn-premium bg-accent text-white px-3 py-1.5 text-[10px] hover:bg-green-600"
                                                    >
                                                        Mark Completed
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                                                        className="btn-premium bg-slate-100 border border-gray-200 text-gray-700 px-3 py-1.5 text-[10px] hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
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
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        /* Detailed charts analytics */
                        <div className="space-y-6 animate-scale-in">
                            <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Sales & View Trends</h2>
                            <div className="p-6 bg-white border border-gray-100 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={10}/>
                                        <YAxis stroke="#94A3B8" fontSize={10}/>
                                        <Tooltip />
                                        <Area type="monotone" dataKey="views" stroke="#22C55E" fill="#22C55E" fillOpacity={0.15} strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
