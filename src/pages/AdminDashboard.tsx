import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguageField } from '../hooks/useLanguageField';
import { toast } from 'react-hot-toast';
import api from '../services/api';

import { adminService, type AdminStats } from '../services/adminService';
import {
    Check, X, AlertOctagon, Users,
    BarChart3, ShieldCheck, Loader2,
    UserCog, Plus, Trash2, Mail, Store, Globe,
    Phone, KeyRound, AlertTriangle,
    ShoppingBag, Megaphone, Flag, LifeBuoy, Layers,
    ArrowRight, Activity, Zap, Edit3
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/Button';
import { getImageUrl } from '../utils/imageUtils';

// ── Quick-nav hub cards ──────────────────────────────────────────────────────
const HUB_ITEMS = [
    {
        label: 'User Management',
        desc: 'Edit accounts, shop details & banners',
        icon: Users,
        color: 'from-violet-500 to-indigo-600',
        bg: 'bg-violet-50',
        iconColor: 'text-violet-600',
        path: '/admin-dashboard/users',
        badge: null,
    },
    {
        label: 'Listings',
        desc: 'Review & moderate all marketplace ads',
        icon: ShoppingBag,
        color: 'from-sky-500 to-cyan-600',
        bg: 'bg-sky-50',
        iconColor: 'text-sky-600',
        path: '/admin-dashboard/listings',
        badge: null,
    },
    {
        label: 'Verifications',
        desc: 'ID & document verification queue',
        icon: ShieldCheck,
        color: 'from-amber-500 to-orange-600',
        bg: 'bg-amber-50',
        iconColor: 'text-amber-600',
        path: '/admin-dashboard/verifications',
        badge: 'pending',
    },
    {
        label: 'Promotions',
        desc: 'Manage boost packages & upgrades',
        icon: Zap,
        color: 'from-green-500 to-emerald-600',
        bg: 'bg-green-50',
        iconColor: 'text-green-600',
        path: '/admin-dashboard/promotions',
        badge: 'promotions',
    },
    {
        label: 'Categories',
        desc: 'Manage marketplace categories',
        icon: Layers,
        color: 'from-pink-500 to-rose-600',
        bg: 'bg-pink-50',
        iconColor: 'text-pink-600',
        path: '/admin-dashboard/categories',
        badge: null,
    },
    {
        label: 'Marketing',
        desc: 'Vouchers, promo codes & campaigns',
        icon: Megaphone,
        color: 'from-orange-500 to-amber-600',
        bg: 'bg-orange-50',
        iconColor: 'text-orange-600',
        path: '/admin-dashboard/marketing',
        badge: null,
    },
    {
        label: 'Abuse Reports',
        desc: 'Review flagged users & listings',
        icon: Flag,
        color: 'from-red-500 to-rose-600',
        bg: 'bg-red-50',
        iconColor: 'text-red-600',
        path: '/admin-dashboard/reports',
        badge: null,
    },
    {
        label: 'Support',
        desc: 'Manage customer support tickets',
        icon: LifeBuoy,
        color: 'from-teal-500 to-cyan-600',
        bg: 'bg-teal-50',
        iconColor: 'text-teal-600',
        path: '/admin-dashboard/support',
        badge: null,
    },
    {
        label: 'Web Editor',
        desc: 'Edit site content & landing pages',
        icon: Globe,
        color: 'from-indigo-500 to-violet-600',
        bg: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        path: '/admin-dashboard/editor',
        badge: null,
    },
];

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { getField } = useLanguageField();
    const [agentEmail, setAgentEmail] = useState('');
    const [agentError, setAgentError] = useState<string | null>(null);

    // OTP Lookup state
    const [otpMode, setOtpMode] = useState<'phone' | 'email'>('phone');
    const [otpQuery, setOtpQuery] = useState('');
    const [otpResult, setOtpResult] = useState<{ found: boolean; code?: string; expires_in_seconds?: number; message: string } | null>(null);
    const [otpLoading, setOtpLoading] = useState(false);

    const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
        queryKey: ['admin-stats'],
        queryFn: adminService.getStats,
    });

    const { data: pendingAds, isLoading: adsLoading } = useQuery({
        queryKey: ['admin-queue'],
        queryFn: adminService.getModerationQueue,
    });

    const { data: verificationRequests, isLoading: verificationsLoading } = useQuery({
        queryKey: ['admin-verifications'],
        queryFn: adminService.getVerificationRequests,
    });

    const { data: userTotal = 0 } = useQuery({
        queryKey: ['admin-users-count'],
        queryFn: () => adminService.getUserCount(),
    });

    const verifyMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            adminService.moderateVerification(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
    });

    const moderateMutation = useMutation({
        mutationFn: ({ id, approve }: { id: number; approve: boolean }) =>
            adminService.moderateListing(id, approve),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
    });

    const handleOtpLookup = useCallback(async () => {
        if (!otpQuery.trim()) return;
        setOtpLoading(true);
        setOtpResult(null);
        try {
            const params = otpMode === 'phone'
                ? { phone: otpQuery.trim() }
                : { email: otpQuery.trim() };
            const result = await adminService.getOtp(params);
            setOtpResult(result);
        } catch (err: any) {
            setOtpResult({ found: false, message: err?.response?.data?.detail || 'Lookup failed' });
        } finally {
            setOtpLoading(false);
        }
    }, [otpMode, otpQuery]);

    const { data: agents = [], isLoading: agentsLoading } = useQuery<any[]>({
        queryKey: ['admin-agents'],
        queryFn: () => api.get('/admin/agents').then(r => r.data),
    });

    const addAgentMutation = useMutation({
        mutationFn: (email: string) => api.post('/admin/agents/add', { email }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
            setAgentEmail('');
            setAgentError(null);
            toast.success('Agent access granted');
        },
        onError: (err: any) => {
            setAgentError(err.response?.data?.detail || 'Failed to add agent');
        },
    });

    const removeAgentMutation = useMutation({
        mutationFn: (email: string) => api.post('/admin/agents/remove', { email }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
            toast.success('Agent access revoked');
        },
    });

    const { data: businessQueue, isLoading: businessQueueLoading } = useQuery({
        queryKey: ['admin-businesses-queue'],
        queryFn: adminService.getBusinessesQueue,
    });

    const moderateBusinessMutation = useMutation({
        mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
            approve
                ? adminService.approveBusiness(id)
                : adminService.disapproveBusiness(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-businesses-queue'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            toast.success('Business nearby status updated!');
        },
        onError: () => toast.error('Failed to update business status'),
    });

    const pendingVerifs = verificationRequests?.filter((r: any) => r.status === 'pending').length || 0;
    const pendingBiz = businessQueue?.filter((b: any) => !b.is_approved).length || 0;

    // Stat cards data
    const STAT_CARDS = [
        {
            label: 'Total Users',
            value: statsLoading ? '…' : (stats?.total_users ?? 0).toLocaleString(),
            icon: Users,
            gradient: 'from-violet-500 to-indigo-600',
            bg: 'bg-violet-500/10',
            color: 'text-violet-600',
        },
        {
            label: 'Active Listings',
            value: statsLoading ? '…' : (stats?.active_listings ?? 0).toLocaleString(),
            icon: ShoppingBag,
            gradient: 'from-sky-500 to-cyan-600',
            bg: 'bg-sky-500/10',
            color: 'text-sky-600',
        },
        {
            label: 'Total Listings',
            value: statsLoading ? '…' : (stats?.total_listings ?? 0).toLocaleString(),
            icon: BarChart3,
            gradient: 'from-teal-500 to-emerald-600',
            bg: 'bg-teal-500/10',
            color: 'text-teal-600',
        },
        {
            label: 'Pending Ads',
            value: statsLoading ? '…' : (stats?.pending_listings ?? 0).toLocaleString(),
            icon: AlertOctagon,
            gradient: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-500/10',
            color: 'text-amber-600',
        },
        {
            label: 'Pending Promos',
            value: statsLoading ? '…' : (stats?.pending_promotions ?? 0).toLocaleString(),
            icon: Zap,
            gradient: 'from-green-500 to-emerald-600',
            bg: 'bg-green-500/10',
            color: 'text-green-600',
        },
    ];

    return (
        <div className="space-y-8 pb-10 px-4 md:px-0">

            {/* ── PREMIUM Hero Header ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 p-8 md:p-12 text-white shadow-2xl">
                {/* Animated decorative elements */}
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
                <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-8 bg-gradient-to-b from-violet-400 to-indigo-600 rounded-full" />
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Platform Control Center</p>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-violet-300">Admin Dashboard</h1>
                        <p className="text-indigo-200/60 mt-4 text-sm md:text-base flex flex-wrap gap-4">
                            <span>📊 {userTotal.toLocaleString()} Users</span>
                            <span>📝 {statsLoading ? '…' : (stats?.total_listings ?? 0).toLocaleString()} Listings</span>
                            <span>⚠️ {statsLoading ? '…' : (stats?.pending_listings ?? 0)} Pending</span>
                        </p>
                    </div>

                    {/* Quick access buttons */}
                    <div className="flex flex-wrap gap-3 pt-4">
                        <Link to="/admin-dashboard/users" className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-white/10">
                            <Users className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            Users & Shops
                        </Link>
                        <Link to="/agent-dashboard" className="group flex items-center gap-2 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-500/40 hover:shadow-xl hover:shadow-violet-400/50">
                            <Activity className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            Agent Portal
                        </Link>
                        <Link to="/admin-dashboard/verifications" className="group flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-100 text-sm font-bold px-6 py-3 rounded-xl transition-all">
                            <ShieldCheck className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            Verifications
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── PREMIUM Stat Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {STAT_CARDS.map((s) => (
                    <div key={s.label} className={cn(
                        "relative group rounded-2xl border bg-gradient-to-br p-5 md:p-6 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                        "border-gradient-to-br",
                        s.bg
                    )}>
                        {/* Background gradient */}
                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 group-hover:opacity-60 transition-opacity", s.bg)} />
                        <div className={cn("absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 group-hover:opacity-40 transition-opacity", s.bg)} />

                        <div className="relative flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">{s.value}</p>
                                <p className="text-xs md:text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-2">{s.label}</p>
                            </div>
                            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-all', s.bg)}>
                                <s.icon className={cn('h-6 w-6 group-hover:scale-110 transition-transform', s.color)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── PREMIUM Module Hub Grid ─────────────────────────────────────────── */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 mb-1 flex items-center gap-3">
                            <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-full" />
                            Management Modules
                        </h2>
                        <p className="text-sm text-gray-500">Quick access to all admin tools and features</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {HUB_ITEMS.map((item) => {
                        const badgeCount =
                            item.badge === 'pending' ? pendingVerifs
                            : item.badge === 'promotions' ? (stats?.pending_promotions ?? 0)
                            : 0;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="group relative bg-white rounded-xl md:rounded-2xl border border-gray-200 hover:border-gray-300 p-5 md:p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3 overflow-hidden"
                            >
                                {/* Background gradient effect */}
                                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity', item.bg)} />

                                {/* Notification badge */}
                                {badgeCount > 0 && (
                                    <div className="absolute top-4 right-4">
                                        <span className={cn(
                                            "min-w-6 h-6 px-2 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-lg",
                                            item.badge === 'pending' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-amber-500 to-orange-600'
                                        )}>
                                            {badgeCount > 99 ? '99+' : badgeCount}
                                        </span>
                                    </div>
                                )}

                                <div className="relative">
                                    <div className={cn('w-12 h-12 rounded-lg md:rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all group-hover:scale-110', item.bg)}>
                                        <item.icon className={cn('h-6 w-6 md:h-7 md:w-7', item.iconColor)} />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <p className="text-sm md:text-base font-black text-gray-900">{item.label}</p>
                                    <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">{item.desc}</p>
                                </div>

                                <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600 transition-all pt-2">
                                    <span className="text-xs font-semibold">Enter</span>
                                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* ── Shop & Account Edit Feature Banner ──────────────────────── */}
            <div
                onClick={() => navigate('/admin-dashboard/users')}
                className="cursor-pointer group relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 md:p-8 text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
            >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Store className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1">Admin Tool</p>
                            <h3 className="text-xl font-black">Edit Customer Shop & Account Details</h3>
                            <p className="text-blue-100/80 text-sm mt-1">Update shop banners, profile images, business info, trust scores and account status for any user.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap flex-shrink-0">
                        <Edit3 className="h-4 w-4" />
                        Open User Manager
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
                <div className="relative mt-4 flex flex-wrap gap-2">
                    {['Shop Banner', 'Account Info', 'Product Images', 'Trust Score', 'Verified Status', 'Business Name'].map(tag => (
                        <span key={tag} className="text-[10px] font-bold bg-white/15 px-2.5 py-1 rounded-full border border-white/20">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Two-column: Moderation Queue + Verifications ─────────────── */}
            <div className="grid lg:grid-cols-2 gap-6">

                {/* Moderation Queue */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                                <AlertOctagon className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-gray-900">Moderation Queue</h2>
                                <p className="text-[10px] text-gray-400">{pendingAds?.length || 0} pending</p>
                            </div>
                        </div>
                        <Link to="/admin-dashboard/listings" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        {adsLoading ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
                        ) : !pendingAds?.length ? (
                            <div className="py-12 text-center">
                                <Check className="w-10 h-10 text-green-400 mx-auto mb-2 opacity-40" />
                                <p className="text-sm text-gray-400 italic">Queue is clean ✓</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <tbody className="divide-y divide-gray-50">
                                    {pendingAds.slice(0, 6).map((ad: any) => (
                                        <tr key={ad.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                        {ad.images?.[0]
                                                            ? <img src={getImageUrl(ad.images[0])} alt="" className="w-full h-full object-cover" />
                                                            : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag className="h-4 w-4" /></div>
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 truncate max-w-[140px]">{getField(ad, 'title')}</p>
                                                        <p className="text-[10px] text-gray-400">{ad.owner?.full_name || `#${ad.owner_id}`}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => moderateMutation.mutate({ id: ad.id, approve: false })}
                                                        disabled={moderateMutation.isPending}
                                                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => moderateMutation.mutate({ id: ad.id, approve: true })}
                                                        disabled={moderateMutation.isPending}
                                                        className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

                {/* Verification Requests */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-gray-900">Verification Requests</h2>
                                <p className="text-[10px] text-gray-400">{pendingVerifs} pending</p>
                            </div>
                        </div>
                        <Link to="/admin-dashboard/verifications" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        {verificationsLoading ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
                        ) : !verificationRequests?.length ? (
                            <div className="py-12 text-center">
                                <ShieldCheck className="w-10 h-10 text-green-400 mx-auto mb-2 opacity-40" />
                                <p className="text-sm text-gray-400 italic">No pending verifications</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <tbody className="divide-y divide-gray-50">
                                    {verificationRequests.slice(0, 6).map((req: any) => (
                                        <tr key={req.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-3">
                                                <p className="text-xs font-bold text-gray-900">{req.user?.full_name || `#${req.user_id}`}</p>
                                                <p className="text-[10px] text-gray-400 uppercase">{req.document_type}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                                                    req.status === 'pending' ? "bg-amber-100 text-amber-700"
                                                    : req.status === 'approved' ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-600"
                                                )}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            {req.status === 'pending' && (
                                                <td className="px-3 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => verifyMutation.mutate({ id: req.id, status: 'rejected' })}
                                                            disabled={verifyMutation.isPending}
                                                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => verifyMutation.mutate({ id: req.id, status: 'approved' })}
                                                            disabled={verifyMutation.isPending}
                                                            className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>

            {/* ── Business Nearby Approvals ──────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Store className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900">Business Nearby Approvals</h2>
                            <p className="text-[10px] text-gray-400">{pendingBiz} pending opt-in</p>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {businessQueueLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
                    ) : !businessQueue?.length ? (
                        <div className="py-12 text-center text-gray-400 italic text-sm">No opt-in requests found.</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {['Business', 'Category', 'Address', 'Trust', 'Status', ''].map(h => (
                                        <th key={h} className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {businessQueue.map((b: any) => (
                                    <tr key={b.id} className="hover:bg-gray-50/60 transition-colors text-sm">
                                        <td className="px-5 py-3">
                                            <p className="font-bold text-gray-900">{b.name}</p>
                                            <a href={`/shop/${b.slug}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline">
                                                /shop/{b.slug}
                                            </a>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 capitalize">{b.category}</td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">{b.address || '—'}</td>
                                        <td className="px-5 py-3 font-bold text-gray-700">{b.trust_score}/100</td>
                                        <td className="px-5 py-3">
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                                                b.is_approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                            )}>
                                                {b.is_approved ? 'Approved' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {b.is_approved ? (
                                                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs rounded-lg text-red-500 border-red-100 hover:bg-red-50"
                                                        onClick={() => moderateBusinessMutation.mutate({ id: b.id, approve: false })}
                                                        disabled={moderateBusinessMutation.isPending}>
                                                        Revoke
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button size="sm" variant="outline" className="h-7 px-3 text-xs rounded-lg text-red-500 border-red-100 hover:bg-red-50"
                                                            onClick={() => moderateBusinessMutation.mutate({ id: b.id, approve: false })}
                                                            disabled={moderateBusinessMutation.isPending}>
                                                            Reject
                                                        </Button>
                                                        <Button size="sm" className="h-7 px-3 text-xs rounded-lg"
                                                            onClick={() => moderateBusinessMutation.mutate({ id: b.id, approve: true })}
                                                            disabled={moderateBusinessMutation.isPending}>
                                                            Approve
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {/* ── Agent Management + OTP Lookup ─────────────────────────── */}
            <div className="grid lg:grid-cols-2 gap-6">

                {/* Agent Management */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                            <UserCog className="h-4 w-4 text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900">Agent Management</h2>
                            <p className="text-[10px] text-gray-400">Grant / revoke agent access by email</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-5">
                        {/* Add form */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Add Agent by Email</label>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-violet-400 transition-colors bg-gray-50">
                                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                                    <input
                                        type="email"
                                        value={agentEmail}
                                        onChange={e => { setAgentEmail(e.target.value); setAgentError(null); }}
                                        placeholder="user@example.com"
                                        className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
                                        onKeyDown={e => e.key === 'Enter' && agentEmail && addAgentMutation.mutate(agentEmail)}
                                    />
                                </div>
                                <Button
                                    className="rounded-xl px-4 gap-1.5 shrink-0 bg-violet-600 hover:bg-violet-700"
                                    disabled={!agentEmail || addAgentMutation.isPending}
                                    onClick={() => addAgentMutation.mutate(agentEmail)}
                                >
                                    {addAgentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </Button>
                            </div>
                            {agentError && <p className="text-xs text-red-500 font-medium mt-1.5">{agentError}</p>}
                        </div>

                        {/* Current agents */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
                                Current Agents ({agents.length})
                            </label>
                            {agentsLoading ? (
                                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-violet-400" /></div>
                            ) : !agents.length ? (
                                <p className="text-sm text-gray-400 italic py-2">No agents configured yet.</p>
                            ) : (
                                <div className="space-y-2 max-h-52 overflow-y-auto">
                                    {agents.map((agent: any) => (
                                        <div key={agent.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-black text-xs shrink-0">
                                                    {(agent.full_name || 'A')[0].toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{agent.full_name || '—'}</p>
                                                    <p className="text-[10px] text-gray-400 truncate">{agent.email}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { if (window.confirm(`Remove agent access for ${agent.email}?`)) removeAgentMutation.mutate(agent.email); }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* OTP Lookup */}
                <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-amber-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                            <KeyRound className="h-4 w-4 text-amber-700" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900">OTP Lookup Tool</h2>
                            <p className="text-[10px] text-gray-500">Help users who didn't receive their code</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Mode toggle */}
                        <div className="flex bg-amber-100/60 p-0.5 rounded-xl border border-amber-200 self-start w-fit">
                            {(['phone', 'email'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => { setOtpMode(mode); setOtpQuery(''); setOtpResult(null); }}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                                        otpMode === mode ? "bg-white text-amber-800 shadow-sm" : "text-amber-700 hover:text-amber-900"
                                    )}
                                >
                                    {mode === 'phone' ? <Phone className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center gap-2 border border-amber-200 bg-white rounded-xl px-3 py-2.5 focus-within:border-amber-400 transition-colors">
                                {otpMode === 'phone' ? <Phone className="h-4 w-4 text-gray-400 shrink-0" /> : <Mail className="h-4 w-4 text-gray-400 shrink-0" />}
                                <input
                                    type={otpMode === 'phone' ? 'tel' : 'email'}
                                    value={otpQuery}
                                    onChange={e => { setOtpQuery(e.target.value); setOtpResult(null); }}
                                    onKeyDown={e => e.key === 'Enter' && handleOtpLookup()}
                                    placeholder={otpMode === 'phone' ? '+254712345678' : 'customer@email.com'}
                                    className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
                                />
                            </div>
                            <Button
                                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 shrink-0"
                                disabled={!otpQuery.trim() || otpLoading}
                                onClick={handleOtpLookup}
                            >
                                {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Look Up'}
                            </Button>
                        </div>

                        {otpResult && (
                            <div className={cn(
                                "p-4 rounded-xl border text-sm",
                                otpResult.found ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"
                            )}>
                                {otpResult.found ? (
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-0.5">Active OTP</p>
                                            <p className="text-3xl font-black font-mono tracking-widest text-green-900">{otpResult.code}</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-[10px] text-green-600">Expires in</p>
                                            <p className="text-lg font-bold text-green-800">{otpResult.expires_in_seconds}s</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                        <p>{otpResult.message}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export { AdminDashboard };
