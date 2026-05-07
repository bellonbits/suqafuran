import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { promotionService } from '../../services/promotionService';
import { auditService } from '../../services/auditService';
import type { AuditLogEntry } from '../../services/auditService';
import api from '../../services/api';
import { Button } from '../../components/Button';
import {
    CreditCard, CheckCircle, Clock, ArrowRight, Check, X, Search,
    RefreshCw, Shield, Activity, User, ShoppingBag, Wallet, Zap,
    AlertTriangle, Terminal, TrendingUp, Users, BarChart2, MapPin,
    XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { useLanguageField } from '../../hooks/useLanguageField';
import { cn } from '../../utils/cn';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ConversionStats {
    total_users: number;
    users_with_ads: number;
    conversion_rate: number;
    signups_today: number;
    signups_week: number;
    ads_today: number;
    ads_week: number;
    active_listings: number;
}

interface SignupUser {
    id: number;
    full_name: string;
    email: string;
    phone: string | null;
    created_at: string;
    is_active: boolean;
    ad_count: number;
    has_posted: boolean;
}

interface AgentListing {
    id: number;
    title: string;
    is_active: boolean;
    status: string;
    created_at: string;
    owner_name: string;
    owner_email: string;
    price: number;
    location: string;
}

// ── Audit meta ─────────────────────────────────────────────────────────────
const ACTION_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    USER_SIGNUP:        { icon: User,          color: 'text-green-400',   bg: 'bg-green-500/10',   label: 'New Signup' },
    USER_LOGIN:         { icon: User,          color: 'text-primary-400', bg: 'bg-primary-500/10', label: 'Login' },
    CREATE_LISTING:     { icon: ShoppingBag,   color: 'text-orange-400',  bg: 'bg-orange-500/10',  label: 'New Ad' },
    MATCH_PAYMENT:      { icon: CreditCard,    color: 'text-primary-400', bg: 'bg-primary-500/10', label: 'Payment Matched' },
    ACTIVATE_PROMOTION: { icon: Zap,           color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  label: 'Promo Activated' },
    REJECT_TRANSACTION: { icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Tx Rejected' },
    WALLET_DEPOSIT:     { icon: Wallet,        color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Deposit' },
    VOUCHER_REDEEMED:   { icon: CheckCircle,   color: 'text-purple-400',  bg: 'bg-purple-500/10',  label: 'Voucher Used' },
    END_LISTING:        { icon: XCircle,       color: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Listing Ended' },
};

type Tab = 'marketing' | 'signups' | 'listings' | 'queue' | 'orders' | 'history';

// ── Stat card ──────────────────────────────────────────────────────────────
const Stat: React.FC<{ label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }> = ({ label, value, sub, icon: Icon, color }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
            <Icon className="h-5 w-5" />
        </div>
        <div>
            <p className="text-xs text-gray-400 font-semibold">{label}</p>
            <p className="text-2xl font-black text-gray-900 leading-none mt-0.5">{value}</p>
            {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

// ── Main component ─────────────────────────────────────────────────────────
const AgentDashboard: React.FC = () => {
    useTranslation();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>('marketing');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [search, setSearch] = useState('');
    const { getField } = useLanguageField();

    // ── Queries ──────────────────────────────────────────────────────────────
    const { data: stats, isLoading: statsLoading } = useQuery<ConversionStats>({
        queryKey: ['agent-conversions'],
        queryFn: () => api.get('/promotions/agent/conversions').then(r => r.data),
        enabled: activeTab === 'marketing',
        refetchInterval: 30000,
    });

    const { data: signups = [], isLoading: signupsLoading, refetch: refetchSignups } = useQuery<SignupUser[]>({
        queryKey: ['agent-signups', search],
        queryFn: () => api.get(`/promotions/agent/signups?search=${encodeURIComponent(search)}&limit=60`).then(r => r.data),
        enabled: activeTab === 'signups',
    });

    const { data: allListings = [], isLoading: listingsLoading, refetch: refetchListings } = useQuery<AgentListing[]>({
        queryKey: ['agent-all-listings', search],
        queryFn: () => api.get(`/promotions/agent/all-listings?search=${encodeURIComponent(search)}&limit=60`).then(r => r.data),
        enabled: activeTab === 'listings',
    });

    const { data: queue, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
        queryKey: ['payment-queue'],
        queryFn: promotionService.getPaymentQueue,
        enabled: activeTab === 'queue',
        refetchInterval: 15000,
    });

    const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
        queryKey: ['pending-orders'],
        queryFn: promotionService.getPendingOrders,
        enabled: activeTab === 'orders' || activeTab === 'queue',
    });

    const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
        queryKey: ['agent-history'],
        queryFn: promotionService.getAgentHistory,
        enabled: activeTab === 'history',
    });

    const { data: auditLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: () => auditService.getLogs({ limit: 25 }),
        refetchInterval: 10000,
    });

    // ── Mutations ────────────────────────────────────────────────────────────
    const matchMutation = useMutation({
        mutationFn: (data: { orderId: number; txId: number }) =>
            promotionService.matchPayment(data.orderId, data.txId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-queue'] });
            queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
            setSelectedOrder(null);
            setActiveTab('orders');
        },
    });

    const activateMutation = useMutation({
        mutationFn: (orderId: number) => promotionService.agentActivate(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
            queryClient.invalidateQueries({ queryKey: ['agent-history'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
            setActiveTab('history');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (txId: number) => promotionService.rejectTransaction(txId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-queue'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
        },
    });

    const endListingMutation = useMutation({
        mutationFn: (id: number) => api.post(`/promotions/agent/listings/${id}/end`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-all-listings'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
            queryClient.invalidateQueries({ queryKey: ['agent-conversions'] });
        },
    });

    const handleDiag = async (promoId: number) => {
        try {
            const data = await promotionService.getDebugPayment(promoId);
            alert(JSON.stringify(data, null, 2));
        } catch {
            alert('Failed to fetch diagnostics');
        }
    };

    const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
        { id: 'marketing', label: 'Marketing',     icon: TrendingUp },
        { id: 'signups',   label: 'Signups',       icon: Users },
        { id: 'listings',  label: 'All Listings',  icon: ShoppingBag },
        { id: 'queue',     label: 'Payments',      icon: CreditCard, count: queue?.length },
        { id: 'orders',    label: 'Orders',        icon: Clock, count: orders?.filter((o: any) => o.status === 'pending').length },
        { id: 'history',   label: 'History',       icon: CheckCircle },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Shield className="text-primary-600" />
                        Agent Command Center
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Marketing insights, signups, listings, and payment operations</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live</span>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 overflow-x-auto mb-8 w-fit gap-0.5">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                        className={cn(
                            'px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === tab.id
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <tab.icon size={13} />
                        {tab.label}
                        {tab.count != null && tab.count > 0 && (
                            <span className={cn(
                                'text-[8px] font-black px-1.5 py-0.5 rounded-full',
                                activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
                            )}>{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Left: main content ────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* ── MARKETING TAB ── */}
                    {activeTab === 'marketing' && (
                        <>
                            {statsLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Clock className="animate-spin text-gray-300 h-8 w-8" />
                                </div>
                            ) : stats ? (
                                <>
                                    {/* Conversion funnel card */}
                                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-6 text-white">
                                        <div className="flex items-center gap-2 mb-4">
                                            <BarChart2 className="h-5 w-5 text-primary-200" />
                                            <h3 className="font-bold text-sm">Conversion Funnel</h3>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 mb-5">
                                            <div className="text-center">
                                                <p className="text-3xl font-black">{stats.total_users.toLocaleString()}</p>
                                                <p className="text-[10px] text-primary-200 font-semibold mt-1">Total Signups</p>
                                            </div>
                                            <div className="text-center border-x border-white/20">
                                                <p className="text-3xl font-black">{stats.users_with_ads.toLocaleString()}</p>
                                                <p className="text-[10px] text-primary-200 font-semibold mt-1">Posted Ads</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-3xl font-black">{stats.conversion_rate}%</p>
                                                <p className="text-[10px] text-primary-200 font-semibold mt-1">Conversion</p>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="bg-white/20 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-white h-full rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(stats.conversion_rate, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[9px] text-primary-300 mt-1.5 font-semibold">
                                            <span>0%</span>
                                            <span>Target: 50%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <Stat label="Signups Today"  value={stats.signups_today}  icon={Users}       color="bg-green-50 text-green-600" />
                                        <Stat label="Signups / Week" value={stats.signups_week}  icon={TrendingUp}   color="bg-blue-50 text-blue-600" />
                                        <Stat label="Ads Today"      value={stats.ads_today}      icon={ShoppingBag} color="bg-orange-50 text-orange-600" />
                                        <Stat label="Active Listings" value={stats.active_listings} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
                                    </div>
                                </>
                            ) : null}
                        </>
                    )}

                    {/* ── SIGNUPS TAB ── */}
                    {activeTab === 'signups' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-3">
                                <h3 className="font-bold text-gray-900">Signed Up Users</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-52">
                                        <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                        <input
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Search name or email…"
                                            className="bg-transparent text-xs outline-none w-full text-gray-700 placeholder-gray-400"
                                        />
                                    </div>
                                    <button onClick={() => refetchSignups()} className="text-primary-600 hover:rotate-180 transition-all duration-500">
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>

                            {signupsLoading ? (
                                <div className="p-20 text-center"><Clock className="animate-spin mx-auto text-gray-300 h-6 w-6" /></div>
                            ) : signups.length === 0 ? (
                                <div className="p-16 text-center text-gray-400 text-sm">No users found</div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {signups.map(u => (
                                        <div key={u.id} className="px-5 py-3.5 hover:bg-gray-50 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                                    {(u.full_name || 'U')[0].toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{u.full_name}</p>
                                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0 text-right">
                                                <div>
                                                    <p className="text-[10px] text-gray-400">{format(new Date(u.created_at), 'MMM d, yyyy')}</p>
                                                    <span className={cn(
                                                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                                        u.has_posted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                    )}>
                                                        {u.ad_count} ad{u.ad_count !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <span className={cn(
                                                    'w-2 h-2 rounded-full flex-shrink-0',
                                                    u.is_active ? 'bg-green-500' : 'bg-red-400'
                                                )} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── ALL LISTINGS TAB ── */}
                    {activeTab === 'listings' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-3">
                                <h3 className="font-bold text-gray-900">All Listings</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-52">
                                        <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                        <input
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            placeholder="Search title…"
                                            className="bg-transparent text-xs outline-none w-full text-gray-700 placeholder-gray-400"
                                        />
                                    </div>
                                    <button onClick={() => refetchListings()} className="text-primary-600 hover:rotate-180 transition-all duration-500">
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>

                            {listingsLoading ? (
                                <div className="p-20 text-center"><Clock className="animate-spin mx-auto text-gray-300 h-6 w-6" /></div>
                            ) : allListings.length === 0 ? (
                                <div className="p-16 text-center text-gray-400 text-sm">No listings found</div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {allListings.map(listing => (
                                        <div key={listing.id} className="px-5 py-3.5 hover:bg-gray-50 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn(
                                                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                                                    listing.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                                                )}>
                                                    <ShoppingBag className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <span>{listing.owner_name}</span>
                                                        {listing.location && (
                                                            <>
                                                                <span>·</span>
                                                                <span className="flex items-center gap-0.5">
                                                                    <MapPin className="h-2.5 w-2.5" />{listing.location}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className="text-right mr-1">
                                                    <p className="text-xs font-bold text-gray-900">${listing.price?.toLocaleString()}</p>
                                                    <span className={cn(
                                                        'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                                                        listing.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                    )}>
                                                        {listing.status}
                                                    </span>
                                                </div>
                                                {listing.is_active && (
                                                    <button
                                                        disabled={endListingMutation.isPending}
                                                        onClick={() => {
                                                            if (window.confirm(`End listing "${listing.title}"?`)) {
                                                                endListingMutation.mutate(listing.id);
                                                            }
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                                                    >
                                                        <XCircle className="h-3 w-3" />
                                                        End
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PAYMENT QUEUE TAB ── */}
                    {activeTab === 'queue' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Incoming Payments</h3>
                                <button onClick={() => refetchQueue()} className="text-primary-600 hover:rotate-180 transition-all duration-500">
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {queueLoading ? (
                                    <div className="p-20 text-center"><Clock className="animate-spin mx-auto text-gray-300" /></div>
                                ) : queue?.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <CreditCard className="mx-auto text-gray-200 mb-3" size={30} />
                                        <p className="text-sm font-black text-gray-300 uppercase tracking-widest">No unmatched payments</p>
                                    </div>
                                ) : queue?.map((tx: any) => (
                                    <div key={tx.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                                                <CreditCard size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">${tx.amount}</div>
                                                <div className="text-xs text-gray-500">{tx.phone} · {format(new Date(tx.timestamp), 'HH:mm')}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" className="h-9 px-4 rounded-lg text-[10px] font-bold border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                                onClick={() => { if (window.confirm('Reject this payment?')) rejectMutation.mutate(tx.id); }}
                                                isLoading={rejectMutation.isPending && rejectMutation.variables === tx.id}>
                                                <X size={14} className="mr-1" /> Reject
                                            </Button>
                                            <Button variant="primary" className="h-9 px-4 rounded-lg text-[10px] font-bold"
                                                onClick={() => setSelectedOrder({ txId: tx.id, amount: tx.amount, phone: tx.phone })}>
                                                Match
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── ORDERS TAB ── */}
                    {activeTab === 'orders' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Verification Queue</h3>
                                <button onClick={() => refetchOrders()} className="text-primary-600 hover:rotate-180 transition-all duration-500">
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {ordersLoading ? (
                                    <div className="p-20 text-center"><Clock className="animate-spin mx-auto text-gray-300" /></div>
                                ) : orders?.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <Clock className="mx-auto text-gray-200 mb-3" size={30} />
                                        <p className="text-sm font-black text-gray-300 uppercase tracking-widest">No pending orders</p>
                                    </div>
                                ) : orders?.map((order: any) => (
                                    <div key={order.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400')}>
                                                {order.status === 'pending' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{getField(order, 'listing_title')}</div>
                                                <div className="text-xs text-gray-500">{getField(order, 'plan_name')} · ${order.amount} · {order.payment_phone}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {order.status === 'pending' ? (
                                                <Button className="h-9 px-4 rounded-lg text-xs font-bold bg-green-600 shadow-md shadow-green-200 text-white"
                                                    onClick={() => activateMutation.mutate(order.id)}
                                                    isLoading={activateMutation.isPending && activateMutation.variables === order.id}>
                                                    <Zap size={14} className="mr-1" /> Activate
                                                </Button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="h-9 px-3 rounded-lg border-gray-200 text-gray-400" onClick={() => handleDiag(order.id)}>
                                                        <Terminal size={14} />
                                                    </Button>
                                                    <div className="px-3 py-2 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center">Waiting</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── HISTORY TAB ── */}
                    {activeTab === 'history' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Activation History</h3>
                                <button onClick={() => refetchHistory()} className="text-primary-600 hover:rotate-180 transition-all duration-500">
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {historyLoading ? (
                                    <div className="p-20 text-center"><Clock className="animate-spin mx-auto text-gray-300" /></div>
                                ) : !history || history.length === 0 ? (
                                    <div className="p-16 text-center text-gray-400 text-sm">No history found</div>
                                ) : history.map((item: any) => (
                                    <div key={item.id} className="p-4 flex items-center justify-between hover:opacity-100 opacity-80 transition-opacity">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                                <Check size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{getField(item, 'listing_title')}</div>
                                                <div className="text-xs text-gray-500">{getField(item, 'plan_name')} · ${item.amount}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(item.updated_at), 'MMM d, HH:mm')}</div>
                                            <div className="text-[10px] text-primary-600 font-bold">{item.promotion_code}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right: match panel + live feed ───────────────────────── */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {selectedOrder ? (
                            <motion.div key="match" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                className="bg-primary-600 rounded-3xl p-6 text-white shadow-xl shadow-primary-200">
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm"><CreditCard size={18} /> Match Payment</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="bg-primary-300/30 p-4 rounded-2xl border border-primary-300/30">
                                        <div className="text-[10px] uppercase font-bold opacity-60 mb-1">Incoming Payment</div>
                                        <div className="text-xl font-black">${selectedOrder.amount}</div>
                                        <div className="text-xs opacity-80">{selectedOrder.phone}</div>
                                    </div>
                                    <ArrowRight className="mx-auto opacity-40" />
                                    <div>
                                        <label className="text-[10px] uppercase font-bold opacity-60 mb-2 block">Link to Pending Order</label>
                                        <select
                                            className="w-full bg-primary-700 border-none rounded-xl text-sm font-bold outline-none text-white py-3 appearance-none px-4"
                                            onChange={e => setSelectedOrder({ ...selectedOrder, targetId: Number(e.target.value) })}
                                        >
                                            <option value="">Select order…</option>
                                            {orders?.filter((o: any) => o.status === 'waiting_for_payment' || o.status === 'pending').map((o: any) => (
                                                <option key={o.id} value={o.id} className="bg-white text-gray-900">
                                                    {getField(o, 'listing_title')} (${o.amount}) - {o.payment_phone}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button className="flex-1 bg-white text-primary-600 font-bold h-11 rounded-xl"
                                        disabled={!selectedOrder.targetId || matchMutation.isPending}
                                        onClick={() => matchMutation.mutate({ orderId: selectedOrder.targetId, txId: selectedOrder.txId })}
                                        isLoading={matchMutation.isPending}>
                                        Confirm Match
                                    </Button>
                                    <button onClick={() => setSelectedOrder(null)}
                                        className="w-11 h-11 rounded-xl bg-primary-300/30 flex items-center justify-center hover:bg-primary-300/50 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="bg-white rounded-3xl p-8 border border-gray-100 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <Search size={32} />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2 text-sm">Select an Action</h4>
                                <p className="text-[10px] text-gray-400 leading-relaxed px-4">
                                    Pick a payment from the queue to match it to an order, or browse signups and listings.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Live activity feed */}
                    <div className="bg-gray-900 rounded-3xl p-6 text-white overflow-hidden relative">
                        <Shield className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-green-400 animate-pulse" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-300">Live Activity</h4>
                            </div>
                            <button onClick={() => refetchLogs()} className="text-gray-500 hover:text-white transition-colors hover:rotate-180 duration-500">
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-hide">
                            {logsLoading ? (
                                <div className="text-center py-8 text-gray-600 text-xs">Loading…</div>
                            ) : !auditLogs || auditLogs.length === 0 ? (
                                <div className="flex gap-3">
                                    <div className="w-1 bg-primary-500 rounded-full shrink-0" />
                                    <p className="text-xs text-gray-300">Listening for events…</p>
                                </div>
                            ) : auditLogs.map((log: AuditLogEntry) => {
                                const meta = ACTION_META[log.action] || { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-500/10', label: log.action };
                                const Icon = meta.icon;
                                return (
                                    <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3">
                                        <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5', meta.bg)}>
                                            <Icon size={12} className={meta.color} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className={cn('text-[9px] font-black uppercase tracking-widest mb-0.5', meta.color)}>
                                                {meta.label}
                                                {log.user_name && <span className="text-gray-500 ml-1 font-bold normal-case tracking-normal">· {log.user_name}</span>}
                                            </div>
                                            <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{log.details}</p>
                                            <div className="text-[9px] text-gray-600 mt-0.5">
                                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AgentDashboard;
