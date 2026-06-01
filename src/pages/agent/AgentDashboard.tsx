import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditService } from '../../services/auditService';
import type { AuditLogEntry } from '../../services/auditService';
import { promotionService } from '../../services/promotionService';
import { adminService } from '../../services/adminService';
import { supportService } from '../../services/supportService';
import api from '../../services/api';
import {
    CheckCircle, Clock, Search, RefreshCw, Shield, Activity,
    User, ShoppingBag, Wallet, Zap, AlertTriangle,
    TrendingUp, Users, BarChart2, MapPin, XCircle,
    CreditCard, Eye, PhoneCall, Mail, Check, LifeBuoy, Bot, Send,
    FileText, KeyRound, Phone, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { useLanguageField } from '../../hooks/useLanguageField';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageUtils';
import { Button } from '../../components/Button';

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

type Tab = 'marketing' | 'signups' | 'listings' | 'verifications' | 'chats' | 'history' | 'otp_lookup';

// ── Small stat card ─────────────────────────────────────────────────────────
const Stat: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string }> = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
        <div className={cn('w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-gray-400 font-semibold truncate">{label}</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none mt-0.5">{value}</p>
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

    // OTP Lookup state
    const [otpMode, setOtpMode] = useState<'phone' | 'email'>('phone');
    const [otpQuery, setOtpQuery] = useState('');
    const [otpResult, setOtpResult] = useState<{ found: boolean; code?: string; expires_in_seconds?: number; message: string } | null>(null);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpLogs, setOtpLogs] = useState<import('../../services/adminService').OtpLogEntry[]>([]);
    const [otpLogsLoading, setOtpLogsLoading] = useState(false);
    const [otpFilterEvent, setOtpFilterEvent] = useState('');
    const [otpFilterChannel, setOtpFilterChannel] = useState('');
    const [otpDateFrom, setOtpDateFrom] = useState('');
    const [otpDateTo, setOtpDateTo] = useState('');

    const fetchOtpLogs = useCallback(async (identifier?: string) => {
        setOtpLogsLoading(true);
        try {
            const params: Record<string, string> = {};
            if (identifier) params.identifier = identifier;
            if (otpFilterEvent) params.event_type = otpFilterEvent;
            if (otpFilterChannel) params.channel = otpFilterChannel;
            if (otpDateFrom) params.date_from = otpDateFrom;
            if (otpDateTo) params.date_to = otpDateTo;
            const res = await adminService.getOtpLogs({ ...params, limit: 100 });
            setOtpLogs(res.results);
        } catch {
            setOtpLogs([]);
        } finally {
            setOtpLogsLoading(false);
        }
    }, [otpFilterEvent, otpFilterChannel, otpDateFrom, otpDateTo]);

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
        // Also fetch full history for this identifier
        fetchOtpLogs(otpQuery.trim());
    }, [otpMode, otpQuery, fetchOtpLogs]);

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

    const { data: verificationRequests = [], isLoading: verificationsLoading, refetch: refetchVerifications } = useQuery({
        queryKey: ['agent-verifications'],
        queryFn: () => adminService.getVerificationRequests(),
        enabled: activeTab === 'verifications',
    });

    // ── Mutations ────────────────────────────────────────────────────────────

    const approveListingMutation = useMutation({
        mutationFn: (id: number) => api.post(`/promotions/agent/listings/${id}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-all-listings'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
        },
    });

    const rejectListingMutation = useMutation({
        mutationFn: (id: number) => api.post(`/promotions/agent/listings/${id}/reject`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-all-listings'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
        },
    });

    const verifyMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            adminService.moderateVerification(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agent-verifications'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
        }
    });

    // Support Chat State
    const [tickets, setTickets] = useState<any[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [chatFilter, setChatFilter] = useState<string>('open');
    const [replyInput, setReplyInput] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [adminNote, setAdminNote] = useState('');

    const fetchTickets = async () => {
        try {
            setTicketsLoading(true);
            const data = await supportService.getTickets({
                status: chatFilter === 'all' ? undefined : chatFilter
            });
            setTickets(data);
            
            // Sync selected ticket details if one is selected
            if (selectedTicket) {
                const updated = data.find((t: any) => t.id === selectedTicket.id);
                if (updated) {
                    setSelectedTicket(updated);
                }
            }
        } catch (err) {
            console.error('Failed to load tickets', err);
        } finally {
            setTicketsLoading(false);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'chats') {
            fetchTickets();
        }
    }, [activeTab, chatFilter]);

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyInput.trim() || !selectedTicket || sendingReply) return;
        try {
            setSendingReply(true);
            const updated = await supportService.replyToTicket(selectedTicket.id, replyInput);
            setReplyInput('');
            setSelectedTicket(updated);
            fetchTickets();
        } catch (error) {
            console.error('Failed to send reply', error);
        } finally {
            setSendingReply(false);
        }
    };

    const handleUpdateTicketStatus = async (ticketId: number, status: string) => {
        try {
            const updated = await supportService.updateTicket(ticketId, { status });
            setSelectedTicket(updated);
            fetchTickets();
        } catch (error) {
            console.error('Failed to update ticket status', error);
        }
    };

    const handleSaveNote = async () => {
        if (!selectedTicket) return;
        try {
            const updated = await supportService.updateTicket(selectedTicket.id, { admin_notes: adminNote });
            setSelectedTicket(updated);
            fetchTickets();
        } catch (error) {
            console.error('Failed to save notes', error);
        }
    };

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'marketing', label: 'Marketing',    icon: TrendingUp },
        { id: 'signups',   label: 'Signups',      icon: Users },
        { id: 'listings',  label: 'All Listings', icon: ShoppingBag },
        { id: 'verifications', label: 'Verifications', icon: Shield },
        { id: 'chats',     label: 'Support Chat', icon: LifeBuoy },
        { id: 'history',   label: 'History',      icon: CheckCircle },
        { id: 'otp_lookup', label: 'OTP Lookup',  icon: KeyRound },
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
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 mb-5">
                                        <div className="text-center sm:text-left">
                                            <p className="text-4xl sm:text-3xl font-black">{stats.total_users.toLocaleString()}</p>
                                            <p className="text-[10px] text-primary-200 font-semibold mt-1 uppercase tracking-wider">Total Signups</p>
                                        </div>
                                        <div className="text-center sm:text-left sm:border-x sm:border-white/20 sm:px-4">
                                            <p className="text-4xl sm:text-3xl font-black">{stats.users_with_ads.toLocaleString()}</p>
                                            <p className="text-[10px] text-primary-200 font-semibold mt-1 uppercase tracking-wider">Posted Ads</p>
                                        </div>
                                        <div className="text-center sm:text-right">
                                            <p className="text-4xl sm:text-3xl font-black">{stats.conversion_rate}%</p>
                                            <p className="text-[10px] text-primary-200 font-semibold mt-1 uppercase tracking-wider">Conversion</p>
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
                                        <div key={listing.id} className="px-4 py-4 sm:px-5 hover:bg-gray-50/70">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                {/* Left info */}
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className={cn(
                                                        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                                                        listing.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                                                    )}>
                                                        <ShoppingBag className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
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
                                                        <div className="flex items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-400 flex-wrap">
                                                            <span className="flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                <span className="font-medium text-gray-600">{listing.owner_name}</span>
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />{listing.owner_email}
                                                            </span>
                                                            {listing.owner_phone && (
                                                                <span className="flex items-center gap-1 whitespace-nowrap">
                                                                    <PhoneCall className="h-3 w-3" />{listing.owner_phone}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Meta row */}
                                                        <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-gray-400 flex-wrap">
                                                            <span className="font-bold text-gray-800 text-sm sm:text-[10px]">${listing.price?.toLocaleString()}</span>
                                                            {listing.location && (
                                                                <span className="flex items-center gap-0.5">
                                                                    <MapPin className="h-2.5 w-2.5" />{listing.location}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-0.5">
                                                                <Eye className="h-2.5 w-2.5" />{listing.views ?? 0}
                                                            </span>
                                                            <span className="whitespace-nowrap">{format(new Date(listing.created_at), 'MMM d, yyyy')}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 sm:flex-shrink-0 pt-2 sm:pt-0 border-t border-gray-50 sm:border-0">
                                                    {listing.status === 'pending' ? (
                                                        <>
                                                            <button
                                                                disabled={approveListingMutation.isPending}
                                                                onClick={() => approveListingMutation.mutate(listing.id)}
                                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 sm:py-1.5 text-[10px] font-bold bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 active:scale-95 transition-all shadow-sm"
                                                            >
                                                                <Check className="h-3 w-3" /> Approve
                                                            </button>
                                                            <button
                                                                disabled={rejectListingMutation.isPending}
                                                                onClick={() => { if (window.confirm(`Reject "${listing.title}"?`)) rejectListingMutation.mutate(listing.id); }}
                                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 sm:py-1.5 text-[10px] font-bold border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 active:scale-95 transition-all"
                                                            >
                                                                <XCircle className="h-3 w-3" /> Reject
                                                            </button>
                                                        </>
                                                    ) : listing.status === 'active' ? (
                                                        <button
                                                            disabled={rejectListingMutation.isPending}
                                                            onClick={() => { if (window.confirm(`Reject "${listing.title}"?`)) rejectListingMutation.mutate(listing.id); }}
                                                            className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 sm:py-1.5 text-[10px] font-bold border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 active:scale-95 transition-all"
                                                        >
                                                            <XCircle className="h-3 w-3" /> Reject Product
                                                        </button>
                                                    ) : listing.status === 'rejected' ? (
                                                        <span className="text-[10px] font-bold text-red-400">Rejected</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* VERIFICATIONS */}
                    {activeTab === 'verifications' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">Verification Requests</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {verificationRequests.filter((r: any) => r.status === 'pending').length} Pending
                                    </p>
                                </div>
                                <button onClick={() => refetchVerifications()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-primary-600 hover:rotate-180 transition-all duration-500">
                                    <RefreshCw size={15} />
                                </button>
                            </div>

                            {verificationsLoading ? (
                                <div className="py-20 flex items-center justify-center">
                                    <Clock className="animate-spin text-gray-300 h-6 w-6" />
                                </div>
                            ) : verificationRequests.length === 0 ? (
                                <div className="py-16 text-center text-gray-400 text-sm">No verification requests</div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {verificationRequests.map((req: any) => (
                                        <div key={req.id} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
                                            {/* Top row: avatar + name | doc badge + date | status */}
                                            <div className="flex items-center gap-3">
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 font-black text-sm border border-primary-100">
                                                    {(req.user?.full_name || 'U')[0].toUpperCase()}
                                                </div>

                                                {/* Name + contact */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                                        {req.user?.full_name || `User #${req.user_id}`}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                                        {req.user?.phone || req.user?.email || ''}
                                                    </p>
                                                </div>

                                                {/* Status badge — always visible, right-aligned */}
                                                <span className={cn(
                                                    "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                    req.status === 'approved' ? "bg-green-100 text-green-700" :
                                                    req.status === 'rejected' ? "bg-red-100 text-red-600" :
                                                    "bg-amber-100 text-amber-700"
                                                )}>
                                                    {req.status}
                                                </span>
                                            </div>

                                            {/* Second row: doc type + date + action buttons */}
                                            <div className="mt-3 ml-13 flex flex-wrap items-center gap-2" style={{ marginLeft: '52px' }}>
                                                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">
                                                    {req.document_type?.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                                                    {format(new Date(req.created_at), 'MMM d, yyyy')}
                                                </span>

                                                {/* Action buttons — only for pending */}
                                                {req.status === 'pending' && (
                                                    <div className="flex items-center gap-2 ml-auto">
                                                        <button
                                                            onClick={() => verifyMutation.mutate({ id: req.id, status: 'approved' })}
                                                            disabled={verifyMutation.isPending}
                                                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-green-100 flex items-center gap-1 whitespace-nowrap"
                                                        >
                                                            <Check className="w-3 h-3" /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => verifyMutation.mutate({ id: req.id, status: 'rejected' })}
                                                            disabled={verifyMutation.isPending}
                                                            className="px-4 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                                                        >
                                                            <XCircle className="w-3 h-3" /> Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


                    {/* SUPPORT CHATS */}
                    {activeTab === 'chats' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-[600px] flex">
                            {/* Tickets Sidebar */}
                            <div className="w-80 border-r border-gray-50 flex flex-col shrink-0">
                                <div className="p-4 border-b border-gray-50">
                                    <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                                        <LifeBuoy className="text-primary-500" size={18} />
                                        Inquiries & Chats
                                    </h3>
                                    <div className="flex gap-1 mt-3 bg-gray-50 p-0.5 rounded-xl">
                                        {['all', 'open', 'resolved', 'pending'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    setChatFilter(s);
                                                    setSelectedTicket(null);
                                                }}
                                                className={cn(
                                                    "flex-1 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                                                    chatFilter === s 
                                                        ? "bg-white text-primary-600 shadow-sm border border-gray-100" 
                                                        : "text-gray-400 hover:text-gray-600"
                                                )}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                                    {ticketsLoading ? (
                                        Array(4).fill(0).map((_, i) => (
                                            <div key={i} className="p-4 animate-pulse">
                                                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                                                <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                                            </div>
                                        ))
                                    ) : tickets.length === 0 ? (
                                        <div className="p-12 text-center text-gray-400 text-xs italic">
                                            No inquiries found
                                        </div>
                                    ) : (
                                        tickets.map((ticket: any) => (
                                            <button
                                                key={ticket.id}
                                                onClick={() => {
                                                    setSelectedTicket(ticket);
                                                    setAdminNote(ticket.admin_notes || '');
                                                }}
                                                className={cn(
                                                    "w-full p-4 text-left hover:bg-gray-50/50 transition-colors flex flex-col gap-1.5",
                                                    selectedTicket?.id === ticket.id ? "bg-primary-50/40 border-r-4 border-r-primary-500" : ""
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={cn(
                                                        "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider",
                                                        ticket.priority === 'high' ? "bg-red-50 text-red-600 border-red-100" :
                                                        ticket.priority === 'medium' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                        "bg-blue-50 text-blue-600 border-blue-100"
                                                    )}>
                                                        {ticket.priority}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 font-medium">
                                                        {new Date(ticket.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-gray-900 truncate w-full">{ticket.subject}</p>
                                                <p className="text-[11px] text-gray-500 line-clamp-1 w-full">{ticket.last_agent_response || 'No reply yet'}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className={cn(
                                                        "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md",
                                                        ticket.status === 'resolved' ? "bg-green-100 text-green-700" :
                                                        ticket.status === 'pending' ? "bg-amber-100 text-amber-700" :
                                                        "bg-blue-100 text-blue-700"
                                                    )}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Chat Details View */}
                            <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
                                {selectedTicket ? (
                                    <>
                                        {/* Chat Header */}
                                        <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-black text-sm shrink-0">
                                                    {selectedTicket.user_id ? 'U' : 'G'}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-extrabold text-gray-900 truncate">{selectedTicket.subject}</h4>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                        User ID: {selectedTicket.user_id || 'Guest'} • Status: <span className="font-bold uppercase text-primary-500">{selectedTicket.status}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedTicket.status !== 'resolved' && (
                                                    <button 
                                                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')}
                                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                                                    >
                                                        <CheckCircle size={14} /> Resolve
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Chat Area & Side Panel */}
                                        <div className="flex-1 flex overflow-hidden">
                                            {/* Chat History */}
                                            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
                                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                    {selectedTicket.chat_history?.map((msg: any, i: number) => (
                                                        <div key={i} className={cn(
                                                            "flex gap-2.5 max-w-[85%]",
                                                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                                        )}>
                                                            <div className={cn(
                                                                "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-sm",
                                                                msg.role === 'user' ? "bg-gray-400" : "bg-primary-500"
                                                            )}>
                                                                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className={cn(
                                                                    "px-3.5 py-2 rounded-2xl text-xs shadow-sm",
                                                                    msg.role === 'user' 
                                                                        ? "bg-white text-gray-800 border border-gray-100 rounded-tr-none" 
                                                                        : "bg-primary-500 text-white rounded-tl-none"
                                                                )}>
                                                                    {msg.content}
                                                                </div>
                                                                {msg.timestamp && (
                                                                    <span className={cn(
                                                                        "text-[8px] text-gray-400 mt-1",
                                                                        msg.role === 'user' ? "text-right" : "text-left"
                                                                    )}>
                                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Agent Reply Input Box */}
                                                <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={replyInput}
                                                        onChange={(e) => setReplyInput(e.target.value)}
                                                        placeholder="Type your manual response to user..."
                                                        className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-primary-500 transition-all"
                                                        disabled={sendingReply}
                                                    />
                                                    <button 
                                                        type="submit"
                                                        disabled={!replyInput.trim() || sendingReply}
                                                        className="w-8 h-8 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shrink-0"
                                                    >
                                                        <Send size={14} />
                                                    </button>
                                                </form>
                                            </div>

                                            {/* Notes / Internal Side Panel */}
                                            <div className="w-60 bg-white border-l border-gray-50 p-4 flex flex-col shrink-0 gap-3">
                                                <div className="text-gray-900 font-extrabold text-xs flex items-center gap-1.5">
                                                    <Clock size={14} className="text-amber-500" />
                                                    Internal Notes
                                                </div>
                                                <textarea
                                                    className="flex-1 w-full bg-gray-50 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                                                    placeholder="Add internal follow-up notes here..."
                                                    value={adminNote}
                                                    onChange={(e) => setAdminNote(e.target.value)}
                                                />
                                                <button 
                                                    onClick={handleSaveNote}
                                                    className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                                                >
                                                    Save Notes
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-primary-500 mb-4">
                                            <LifeBuoy size={32} />
                                        </div>
                                        <h4 className="text-base font-extrabold text-gray-900">Live Chat Follow-up</h4>
                                        <p className="text-gray-500 text-xs max-w-xs mt-1.5">Select a customer inquiry to view history, internal notes, and take over the chat manually.</p>
                                    </div>
                                )}
                            </div>
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

                    {/* OTP LOOKUP */}
                    {activeTab === 'otp_lookup' && (
                        <div className="space-y-4">
                            {/* ── Search bar ── */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200 shadow-sm p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 rounded-xl">
                                            <KeyRound className="h-5 w-5 text-amber-700" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">OTP Tracking & Verification Monitor</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Full OTP event history per user</p>
                                        </div>
                                    </div>
                                    {/* Phone / Email toggle */}
                                    <div className="flex bg-amber-100/60 p-0.5 rounded-xl border border-amber-200 self-start sm:self-center">
                                        {(['phone', 'email'] as const).map(m => (
                                            <button key={m} type="button"
                                                onClick={() => { setOtpMode(m); setOtpQuery(''); setOtpResult(null); setOtpLogs([]); }}
                                                className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                                                    otpMode === m ? "bg-white text-amber-800 shadow-sm" : "text-amber-700 hover:text-amber-900")}>
                                                {m === 'phone' ? <Phone className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                                                {m.charAt(0).toUpperCase() + m.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Search row */}
                                <div className="flex gap-2">
                                    <div className="flex-1 flex items-center gap-2 border border-amber-200 bg-white rounded-xl px-3 py-2.5 focus-within:border-amber-400 transition-colors">
                                        {otpMode === 'phone' ? <Phone className="h-4 w-4 text-gray-400 shrink-0" /> : <Mail className="h-4 w-4 text-gray-400 shrink-0" />}
                                        <input
                                            type={otpMode === 'phone' ? 'tel' : 'email'}
                                            value={otpQuery}
                                            onChange={e => { setOtpQuery(e.target.value); setOtpResult(null); }}
                                            onKeyDown={e => e.key === 'Enter' && handleOtpLookup()}
                                            placeholder={otpMode === 'phone' ? '+254712345678 or 0712345678' : 'customer@email.com'}
                                            className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
                                        />
                                    </div>
                                    <Button className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 shrink-0"
                                        disabled={!otpQuery.trim() || otpLoading} onClick={handleOtpLookup}>
                                        {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                                    </Button>
                                </div>

                                {/* Live OTP result */}
                                {otpResult && (
                                    <div className={cn("mt-3 p-4 rounded-xl border text-sm",
                                        otpResult.found ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200")}>
                                        {otpResult.found ? (
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-0.5">Active OTP Code</p>
                                                    <p className="text-2xl font-black font-mono tracking-widest text-green-900">{otpResult.code}</p>
                                                </div>
                                                <div className="ml-auto text-right">
                                                    <p className="text-[10px] text-green-600 font-bold uppercase">Expires in</p>
                                                    <p className="text-lg font-black text-green-800">{otpResult.expires_in_seconds}s</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                                                <p className="text-xs">{otpResult.message}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── Filters ── */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Event Type</p>
                                    <select value={otpFilterEvent} onChange={e => setOtpFilterEvent(e.target.value)}
                                        className="border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-primary-400">
                                        <option value="">All</option>
                                        {['sent','resent','verified','failed','expired','attempt_failed'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Channel</p>
                                    <select value={otpFilterChannel} onChange={e => setOtpFilterChannel(e.target.value)}
                                        className="border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-primary-400">
                                        <option value="">All</option>
                                        <option value="sms">SMS</option>
                                        <option value="email">Email</option>
                                    </select>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">From</p>
                                    <input type="date" value={otpDateFrom} onChange={e => setOtpDateFrom(e.target.value)}
                                        className="border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-primary-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">To</p>
                                    <input type="date" value={otpDateTo} onChange={e => setOtpDateTo(e.target.value)}
                                        className="border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-primary-400" />
                                </div>
                                <button onClick={() => fetchOtpLogs(otpQuery.trim() || undefined)}
                                    className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5">
                                    <Search className="h-3.5 w-3.5" /> Filter
                                </button>
                                <button onClick={() => { setOtpFilterEvent(''); setOtpFilterChannel(''); setOtpDateFrom(''); setOtpDateTo(''); setOtpLogs([]); }}
                                    className="px-3 py-1.5 text-gray-400 hover:text-gray-600 text-xs font-bold transition-colors">
                                    Clear
                                </button>
                            </div>

                            {/* ── Event Timeline ── */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-gray-900">Event Timeline</h4>
                                    <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2.5 py-1 rounded-full">
                                        {otpLogs.length} events
                                    </span>
                                </div>

                                {otpLogsLoading ? (
                                    <div className="py-12 flex items-center justify-center gap-2 text-gray-400">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="text-xs">Loading history...</span>
                                    </div>
                                ) : otpLogs.length === 0 ? (
                                    <div className="py-14 text-center text-gray-400">
                                        <KeyRound className="h-8 w-8 mx-auto mb-3 opacity-30" />
                                        <p className="text-xs font-medium">Search by phone or email to see OTP history</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {otpLogs.map((entry, idx) => {
                                            const eventColors: Record<string, string> = {
                                                sent: 'bg-blue-100 text-blue-700',
                                                resent: 'bg-indigo-100 text-indigo-700',
                                                verified: 'bg-green-100 text-green-700',
                                                failed: 'bg-red-100 text-red-600',
                                                expired: 'bg-gray-100 text-gray-500',
                                                attempt_failed: 'bg-orange-100 text-orange-600',
                                            };
                                            const dotColors: Record<string, string> = {
                                                sent: 'bg-blue-400',
                                                resent: 'bg-indigo-400',
                                                verified: 'bg-green-400',
                                                failed: 'bg-red-400',
                                                expired: 'bg-gray-300',
                                                attempt_failed: 'bg-orange-400',
                                            };
                                            const isLast = idx === otpLogs.length - 1;
                                            return (
                                                <div key={entry.id} className="px-5 py-3.5 flex gap-4 hover:bg-gray-50/60 transition-colors">
                                                    {/* Timeline dot + line */}
                                                    <div className="flex flex-col items-center shrink-0" style={{ width: 16 }}>
                                                        <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", dotColors[entry.event_type] || 'bg-gray-300')} />
                                                        {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                                                    </div>
                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider", eventColors[entry.event_type] || 'bg-gray-100 text-gray-500')}>
                                                                {entry.event_type.replace('_', ' ')}
                                                            </span>
                                                            <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full uppercase">
                                                                {entry.channel}
                                                            </span>
                                                            {entry.attempt_count > 0 && (
                                                                <span className="text-[10px] text-gray-400 font-medium">
                                                                    Attempt #{entry.attempt_count}
                                                                </span>
                                                            )}
                                                            {entry.status === 'failed' && (
                                                                <span className="text-[10px] text-red-400 font-bold">● Failed</span>
                                                            )}
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap gap-3 items-center">
                                                            <p className="text-[11px] text-gray-500 font-medium">{entry.identifier}</p>
                                                            <p className="text-[10px] text-gray-400">
                                                                {format(new Date(entry.created_at), 'MMM d, yyyy · HH:mm:ss')}
                                                            </p>
                                                            {entry.expires_at && (
                                                                <p className="text-[10px] text-amber-500 font-medium">
                                                                    Expires {format(new Date(entry.expires_at), 'HH:mm:ss')}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {entry.meta && Object.keys(entry.meta).length > 0 && (
                                                            <p className="mt-0.5 text-[10px] text-gray-400 font-mono truncate">
                                                                {Object.entries(entry.meta).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
