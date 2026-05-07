import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditService } from '../../services/auditService';
import type { AuditLogEntry } from '../../services/auditService';
import { promotionService } from '../../services/promotionService';
import api from '../../services/api';
import {
    CheckCircle, Clock, Search, RefreshCw, Shield, Activity,
    User, ShoppingBag, Wallet, Zap, AlertTriangle,
    TrendingUp, Users, BarChart2, MapPin, XCircle,
    CreditCard, Eye, PhoneCall, Mail, Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { useLanguageField } from '../../hooks/useLanguageField';
import { cn } from '../../utils/cn';

// ── Types ──────────────────────────────────────────────────────────────────
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
    updated_at: string;
    owner_id: number;
    owner_name: string;
    owner_email: string;
    owner_phone: string | null;
    price: number;
    location: string;
    boost_level: number;
    views: number;
}

// ── Audit colour map ────────────────────────────────────────────────────────
const ACTION_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    USER_SIGNUP:          { icon: User,          color: 'text-green-400',   bg: 'bg-green-500/10',   label: 'New Signup' },
    USER_LOGIN:           { icon: User,          color: 'text-primary-400', bg: 'bg-primary-500/10', label: 'Login' },
    CREATE_LISTING:       { icon: ShoppingBag,   color: 'text-orange-400',  bg: 'bg-orange-500/10',  label: 'New Ad' },
    MATCH_PAYMENT:        { icon: CreditCard,    color: 'text-primary-400', bg: 'bg-primary-500/10', label: 'Payment Matched' },
    ACTIVATE_PROMOTION:   { icon: Zap,           color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  label: 'Promo Activated' },
    REJECT_TRANSACTION:   { icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Tx Rejected' },
    WALLET_DEPOSIT:       { icon: Wallet,        color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Deposit' },
    VOUCHER_REDEEMED:     { icon: CheckCircle,   color: 'text-purple-400',  bg: 'bg-purple-500/10',  label: 'Voucher Used' },
    END_LISTING:          { icon: XCircle,       color: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Listing Ended' },
    REACTIVATE_LISTING:   { icon: CheckCircle,   color: 'text-green-400',   bg: 'bg-green-500/10',   label: 'Reactivated' },
};

const STATUS_STYLES: Record<string, string> = {
    active:   'bg-green-100 text-green-700',
    ended:    'bg-gray-100 text-gray-500',
    pending:  'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-600',
    sold:     'bg-blue-100 text-blue-700',
};

type Tab = 'marketing' | 'signups' | 'listings' | 'history';

// ── Small stat card ─────────────────────────────────────────────────────────
const Stat: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string }> = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
            <Icon className="h-5 w-5" />
        </div>
        <div>
            <p className="text-xs text-gray-400 font-semibold">{label}</p>
            <p className="text-2xl font-black text-gray-900 leading-none mt-0.5">{value}</p>
        </div>
    </div>
);

// ── Main ────────────────────────────────────────────────────────────────────
const AgentDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>('marketing');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const { getField } = useLanguageField();

    // ── Queries ─────────────────────────────────────────────────────────────
    const { data: stats, isLoading: statsLoading } = useQuery<ConversionStats>({
        queryKey: ['agent-conversions'],
        queryFn: () => api.get('/promotions/agent/conversions').then(r => r.data),
        enabled: activeTab === 'marketing',
        refetchInterval: 30000,
    });

    const { data: signups = [], isLoading: signupsLoading, refetch: refetchSignups } = useQuery<SignupUser[]>({
        queryKey: ['agent-signups', search],
        queryFn: () => api.get(`/promotions/agent/signups?search=${encodeURIComponent(search)}&limit=80`).then(r => r.data),
        enabled: activeTab === 'signups',
    });

    const { data: allListings = [], isLoading: listingsLoading, refetch: refetchListings } = useQuery<AgentListing[]>({
        queryKey: ['agent-all-listings', search, statusFilter],
        queryFn: () => api.get(
            `/promotions/agent/all-listings?search=${encodeURIComponent(search)}&status_filter=${statusFilter}&limit=100`
        ).then(r => r.data),
        enabled: activeTab === 'listings',
    });

    const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
        queryKey: ['agent-history'],
        queryFn: promotionService.getAgentHistory,
        enabled: activeTab === 'history',
    });

    const { data: auditLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: () => auditService.getLogs({ limit: 30 }),
        refetchInterval: 10000,
    });

    // ── Mutations ────────────────────────────────────────────────────────────
    const endMutation = useMutation({
        mutationFn: (id: number) => api.post(`/promotions/agent/listings/${id}/end`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-all-listings'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
            queryClient.invalidateQueries({ queryKey: ['agent-conversions'] });
        },
    });

    const reactivateMutation = useMutation({
        mutationFn: (id: number) => api.post(`/promotions/agent/listings/${id}/reactivate`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-all-listings'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
            queryClient.invalidateQueries({ queryKey: ['agent-conversions'] });
        },
    });

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'marketing', label: 'Marketing',    icon: TrendingUp },
        { id: 'signups',   label: 'Signups',      icon: Users },
        { id: 'listings',  label: 'All Listings', icon: ShoppingBag },
        { id: 'history',   label: 'History',      icon: CheckCircle },
    ];

    const statusOptions = ['', 'active', 'ended', 'pending', 'rejected', 'sold'];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Shield className="text-primary-600" />
                        Agent Command Center
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Marketing insights, signups and full listing database</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live</span>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 overflow-x-auto mb-8 w-fit gap-0.5">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearch(''); setStatusFilter(''); }}
                        className={cn(
                            'px-5 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                            activeTab === tab.id
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <tab.icon size={13} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Left ───────────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* MARKETING */}
                    {activeTab === 'marketing' && (
                        statsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Clock className="animate-spin text-gray-300 h-8 w-8" />
                            </div>
                        ) : stats ? (
                            <>
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
                                    <div className="bg-white/20 rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-white h-full rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min(stats.conversion_rate, 100)}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[9px] text-primary-300 mt-1.5 font-semibold">
                                        <span>0%</span><span>Target: 50%</span><span>100%</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <Stat label="Signups Today"   value={stats.signups_today}    icon={Users}       color="bg-green-50 text-green-600" />
                                    <Stat label="Signups / Week"  value={stats.signups_week}     icon={TrendingUp}  color="bg-blue-50 text-blue-600" />
                                    <Stat label="Ads Today"       value={stats.ads_today}        icon={ShoppingBag} color="bg-orange-50 text-orange-600" />
                                    <Stat label="Active Listings" value={stats.active_listings}  icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
                                </div>
                            </>
                        ) : null
                    )}

                    {/* SIGNUPS */}
                    {activeTab === 'signups' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-3">
                                <h3 className="font-bold text-gray-900">Signed Up Users</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-52">
                                        <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                        <input value={search} onChange={e => setSearch(e.target.value)}
                                            placeholder="Name or email…"
                                            className="bg-transparent text-xs outline-none w-full text-gray-700 placeholder-gray-400" />
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
                                        <div key={u.id} className="px-5 py-4 hover:bg-gray-50/70 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                                    {(u.full_name || 'U')[0].toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{u.full_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" />{u.email}</span>
                                                        {u.phone && <span className="flex items-center gap-0.5"><PhoneCall className="h-2.5 w-2.5" />{u.phone}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-400">{format(new Date(u.created_at), 'MMM d, yyyy')}</p>
                                                    <span className={cn(
                                                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                                        u.has_posted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                    )}>
                                                        {u.ad_count} ad{u.ad_count !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <span className={cn('w-2 h-2 rounded-full', u.is_active ? 'bg-green-500' : 'bg-red-400')} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ALL LISTINGS — full database view */}
                    {activeTab === 'listings' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="font-bold text-gray-900">Listing Database</h3>
                                    <button onClick={() => refetchListings()} className="text-primary-600 hover:rotate-180 transition-all duration-500">
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Search */}
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-40">
                                        <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                        <input value={search} onChange={e => setSearch(e.target.value)}
                                            placeholder="Title or owner…"
                                            className="bg-transparent text-xs outline-none w-full text-gray-700 placeholder-gray-400" />
                                    </div>
                                    {/* Status filter */}
                                    <div className="flex gap-1.5 flex-wrap">
                                        {statusOptions.map(s => (
                                            <button key={s}
                                                onClick={() => setStatusFilter(s)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all',
                                                    statusFilter === s
                                                        ? 'bg-primary-500 text-white'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                )}>
                                                {s || 'All'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400">{allListings.length} listings</p>
                            </div>

                            {listingsLoading ? (
                                <div className="p-20 text-center"><Clock className="animate-spin mx-auto text-gray-300 h-6 w-6" /></div>
                            ) : allListings.length === 0 ? (
                                <div className="p-16 text-center text-gray-400 text-sm">No listings found</div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {allListings.map(listing => (
                                        <div key={listing.id} className="px-5 py-4 hover:bg-gray-50/70">
                                            <div className="flex items-start justify-between gap-3">
                                                {/* Left info */}
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className={cn(
                                                        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                                                        listing.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                                                    )}>
                                                        <ShoppingBag className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
                                                            <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', STATUS_STYLES[listing.status] || 'bg-gray-100 text-gray-500')}>
                                                                {listing.status}
                                                            </span>
                                                            {listing.boost_level > 0 && (
                                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                                                    Boost {listing.boost_level}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Owner row */}
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                                                            <span className="flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                <span className="font-medium text-gray-600">{listing.owner_name}</span>
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />{listing.owner_email}
                                                            </span>
                                                            {listing.owner_phone && (
                                                                <span className="flex items-center gap-1">
                                                                    <PhoneCall className="h-3 w-3" />{listing.owner_phone}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Meta row */}
                                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 flex-wrap">
                                                            <span className="font-bold text-gray-700">${listing.price?.toLocaleString()}</span>
                                                            {listing.location && (
                                                                <span className="flex items-center gap-0.5">
                                                                    <MapPin className="h-2.5 w-2.5" />{listing.location}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-0.5">
                                                                <Eye className="h-2.5 w-2.5" />{listing.views ?? 0} views
                                                            </span>
                                                            <span>{format(new Date(listing.created_at), 'MMM d, yyyy')}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {listing.is_active ? (
                                                        <button
                                                            disabled={endMutation.isPending}
                                                            onClick={() => { if (window.confirm(`End "${listing.title}"?`)) endMutation.mutate(listing.id); }}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                                                        >
                                                            <XCircle className="h-3 w-3" /> End
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled={reactivateMutation.isPending}
                                                            onClick={() => reactivateMutation.mutate(listing.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold border border-green-200 text-green-600 rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50"
                                                        >
                                                            <Check className="h-3 w-3" /> Reactivate
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* HISTORY */}
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

                {/* ── Right: Live feed ────────────────────────────────────── */}
                <div className="space-y-6">
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

                        <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide">
                            {logsLoading ? (
                                <div className="text-center py-8 text-gray-600 text-xs">Loading…</div>
                            ) : !auditLogs || auditLogs.length === 0 ? (
                                <p className="text-xs text-gray-300">Listening for events…</p>
                            ) : auditLogs.map((log: AuditLogEntry) => {
                                const meta = ACTION_META[log.action] || { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-500/10', label: log.action };
                                const Icon = meta.icon;
                                return (
                                    <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        className="flex items-start gap-3">
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
