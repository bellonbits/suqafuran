"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ShieldCheck, LifeBuoy, CheckCircle2, XCircle, Clock, Send, ImageIcon, ArrowLeft, Inbox,
    LayoutGrid, TrendingUp, Users, ClipboardList, History as HistoryIcon, KeyRound, RefreshCw,
    LogIn, UserPlus, ShoppingBag, Search, PauseCircle, PlayCircle, Loader2, Radio,
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuth';
import { useAuthModal } from '../../../store/useAuthModal';
import { verificationsService } from '../../../services/verifications';
import { supportService } from '../../../services/support';
import { adminService } from '../../../services/admin';
import type {
    VerificationRequest, SupportTicket, SupportStats, AgentConversions, AgentSignup,
    AgentListingRow, PromotionRead, OtpLookupResult,
} from '../../../types';

type Tab = 'marketing' | 'signups' | 'listings' | 'verifications' | 'tickets' | 'history' | 'otp';

interface LiveEvent {
    id: string;
    kind: 'login' | 'signup' | 'ad' | 'other';
    title: string;
    description: string;
    timestamp: string;
}

export default function AgentDashboard() {
    const router = useRouter();
    const { user, isAuthenticated, isHydrated } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const [activeTab, setActiveTab] = useState<Tab>('marketing');
    const hasAccess = !!user && (user.is_agent || user.is_admin);

    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [stats, setStats] = useState<SupportStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [actingOnId, setActingOnId] = useState<number | string | null>(null);

    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [ticketFilter, setTicketFilter] = useState<string>('');

    const [conversions, setConversions] = useState<AgentConversions | null>(null);
    const [liveFeed, setLiveFeed] = useState<LiveEvent[]>([]);
    const [signups, setSignups] = useState<AgentSignup[]>([]);
    const [signupSearch, setSignupSearch] = useState('');
    const [agentListings, setAgentListings] = useState<AgentListingRow[]>([]);
    const [listingSearch, setListingSearch] = useState('');
    const [listingStatusFilter, setListingStatusFilter] = useState('');
    const [history, setHistory] = useState<PromotionRead[]>([]);

    const [otpChannel, setOtpChannel] = useState<'email' | 'phone'>('email');
    const [otpValue, setOtpValue] = useState('');
    const [otpResult, setOtpResult] = useState<OtpLookupResult | null>(null);

    useEffect(() => {
        if (!isHydrated) return;
        if (!isAuthenticated) {
            openAuthModal('signin');
            router.replace('/');
            return;
        }
        if (!hasAccess) {
            router.replace('/');
        }
    }, [isHydrated, isAuthenticated, hasAccess, router]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated || !hasAccess) return;

        async function loadData() {
            setLoading(true);
            try {
                const [reqs, tix, st] = await Promise.all([
                    verificationsService.listRequests({ limit: 100 }),
                    supportService.listTickets({ limit: 100, status: ticketFilter || undefined }),
                    supportService.getStats(),
                ]);
                setRequests(reqs);
                setTickets(tix);
                setStats(st);
            } catch (err) {
                console.error('Failed to load agent dashboard data', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [isHydrated, isAuthenticated, hasAccess, ticketFilter]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated || !hasAccess || activeTab !== 'marketing') return;
        loadMarketing();
    }, [isHydrated, isAuthenticated, hasAccess, activeTab]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated || !hasAccess || activeTab !== 'signups') return;
        adminService.getAgentSignups({ limit: 50, search: signupSearch || undefined }).then(setSignups).catch(err => console.error('Failed to load signups', err));
    }, [isHydrated, isAuthenticated, hasAccess, activeTab]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated || !hasAccess || activeTab !== 'listings') return;
        loadAgentListings();
    }, [isHydrated, isAuthenticated, hasAccess, activeTab]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated || !hasAccess || activeTab !== 'history') return;
        adminService.getAgentHistory(50).then(setHistory).catch(err => console.error('Failed to load history', err));
    }, [isHydrated, isAuthenticated, hasAccess, activeTab]);

    async function loadMarketing() {
        try {
            const [conv, signupRows, listingRows] = await Promise.all([
                adminService.getAgentConversions(),
                adminService.getAgentSignups({ limit: 10 }),
                adminService.getAgentAllListings({ limit: 10 }),
            ]);
            setConversions(conv);

            let events: LiveEvent[] = [];
            if (user?.is_admin) {
                try {
                    const logs = await adminService.getAuditLogs({ limit: 15 });
                    events = logs.map(l => ({
                        id: `log-${l.id}`,
                        kind: l.action === 'USER_LOGIN' ? 'login' : l.action === 'USER_SIGNUP' ? 'signup' : l.action === 'CREATE_LISTING' ? 'ad' : 'other',
                        title: l.action.replace(/_/g, ' '),
                        description: l.details || l.user_name || l.user_email || '',
                        timestamp: l.timestamp,
                    }));
                } catch {
                    events = [];
                }
            }
            if (events.length === 0) {
                const signupEvents: LiveEvent[] = signupRows.map(s => ({
                    id: `signup-${s.id}`,
                    kind: 'signup',
                    title: 'New signup',
                    description: `New user: ${s.full_name} (${s.email})`,
                    timestamp: s.created_at,
                }));
                const adEvents: LiveEvent[] = listingRows.map(l => ({
                    id: `ad-${l.id}`,
                    kind: 'ad',
                    title: 'New ad',
                    description: `${l.owner_name || 'Seller'} · listing "${l.title}"`,
                    timestamp: l.created_at,
                }));
                events = [...signupEvents, ...adEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            }
            setLiveFeed(events);
        } catch (err) {
            console.error('Failed to load marketing overview', err);
        }
    }

    async function loadAgentListings() {
        try {
            setAgentListings(await adminService.getAgentAllListings({ limit: 100, search: listingSearch || undefined, status_filter: listingStatusFilter || undefined }));
        } catch (err) {
            console.error('Failed to load agent listings', err);
        }
    }

    const pendingRequests = requests.filter(r => r.status === 'pending');

    const handleVerificationAction = async (id: number, status: 'approved' | 'rejected') => {
        setActingOnId(id);
        try {
            await verificationsService.updateStatus(id, status);
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        } catch (err) {
            console.error('Failed to update verification request', err);
        } finally {
            setActingOnId(null);
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyText.trim()) return;
        try {
            const updated = await supportService.replyToTicket(selectedTicket.id, replyText.trim());
            setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
            setSelectedTicket(updated);
            setReplyText('');
        } catch (err) {
            console.error('Failed to send reply', err);
        }
    };

    const handleResolve = async (id: number) => {
        try {
            const updated = await supportService.updateTicket(id, { status: 'resolved' });
            setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
            setSelectedTicket(prev => prev?.id === id ? updated : prev);
        } catch (err) {
            console.error('Failed to resolve ticket', err);
        }
    };

    const handleSignupSearch = (e: React.FormEvent) => {
        e.preventDefault();
        adminService.getAgentSignups({ limit: 50, search: signupSearch || undefined }).then(setSignups).catch(err => console.error('Search failed', err));
    };

    const handleListingFilter = (e: React.FormEvent) => {
        e.preventDefault();
        loadAgentListings();
    };

    const handleListingAction = async (id: number, action: 'end' | 'reactivate' | 'approve' | 'reject') => {
        setActingOnId(id);
        try {
            if (action === 'end') await adminService.endListing(id);
            if (action === 'reactivate') await adminService.reactivateListing(id);
            if (action === 'approve') await adminService.approveListingAgent(id);
            if (action === 'reject') await adminService.rejectListingAgent(id);
            await loadAgentListings();
        } catch (err) {
            console.error('Failed to update listing', err);
        } finally {
            setActingOnId(null);
        }
    };

    const handleOtpLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpValue.trim()) return;
        setActingOnId('otp');
        setOtpResult(null);
        try {
            const params = otpChannel === 'email' ? { email: otpValue.trim() } : { phone: otpValue.trim() };
            setOtpResult(await adminService.lookupOtp(params));
        } catch (err) {
            console.error('OTP lookup failed', err);
        } finally {
            setActingOnId(null);
        }
    };

    if (!isHydrated || !isAuthenticated || !hasAccess) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-gray-400">
                Checking access...
            </div>
        );
    }

    const tabs: { id: Tab; name: string; icon: React.ElementType }[] = [
        { id: 'marketing', name: 'Marketing', icon: TrendingUp },
        { id: 'signups', name: 'Signups', icon: Users },
        { id: 'listings', name: 'All Listings', icon: ClipboardList },
        { id: 'verifications', name: `Verifications${pendingRequests.length ? ` (${pendingRequests.length})` : ''}`, icon: ShieldCheck },
        { id: 'tickets', name: 'Support Chat', icon: LifeBuoy },
        { id: 'history', name: 'History', icon: HistoryIcon },
        ...(user?.is_admin ? [{ id: 'otp' as Tab, name: 'OTP Lookup', icon: KeyRound }] : []),
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-slate-100 font-poppins">Agent Command Center</h1>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">Marketing insights, signups and full listing database</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            Live
                        </span>
                        {user?.is_admin && (
                            <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 text-[10px] font-black">
                                <LayoutGrid className="h-3.5 w-3.5" /> Admin Console
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isCurrent = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${isCurrent ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-slate-800' : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'}`}
                            >
                                <Icon className="h-3.5 w-3.5" /> {tab.name}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'marketing' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-up">
                        <div className="lg:col-span-2 space-y-5">
                            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-white space-y-5">
                                <h3 className="text-sm font-black flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Conversion Funnel</h3>
                                <div className="grid grid-cols-3 divide-x divide-white/20">
                                    <div>
                                        <p className="text-3xl font-black">{conversions?.total_users ?? 0}</p>
                                        <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Total Signups</p>
                                    </div>
                                    <div className="pl-4">
                                        <p className="text-3xl font-black">{conversions?.users_with_ads ?? 0}</p>
                                        <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Posted Ads</p>
                                    </div>
                                    <div className="pl-4">
                                        <p className="text-3xl font-black">{conversions ? Math.round(conversions.conversion_rate) : 0}%</p>
                                        <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">Conversion</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                                        <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, conversions?.conversion_rate ?? 0)}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold opacity-80">
                                        <span>0%</span>
                                        <span>Target: 50%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                <MiniStat icon={Users} label="Signups Today" value={conversions?.signups_today ?? 0} />
                                <MiniStat icon={TrendingUp} label="Signups / Week" value={conversions?.signups_week ?? 0} />
                                <MiniStat icon={ShoppingBag} label="Ads Today" value={conversions?.ads_today ?? 0} />
                                <MiniStat icon={CheckCircle2} label="Active Listings" value={conversions?.active_listings ?? 0} />
                            </div>
                        </div>

                        <div className="rounded-3xl bg-slate-900 dark:bg-black p-5 text-white space-y-4 max-h-[640px] overflow-y-auto">
                            <div className="flex items-center justify-between sticky top-0 bg-slate-900 dark:bg-black pb-2">
                                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-emerald-400" /> Live Activity</h3>
                                <button onClick={loadMarketing} className="text-slate-400 hover:text-white">
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            {liveFeed.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-8">No recent activity</p>
                            ) : (
                                <div className="space-y-3">
                                    {liveFeed.map(ev => (
                                        <div key={ev.id} className="flex items-start gap-3">
                                            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${ev.kind === 'login' ? 'bg-blue-500/20 text-blue-400' : ev.kind === 'signup' ? 'bg-emerald-500/20 text-emerald-400' : ev.kind === 'ad' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                                                {ev.kind === 'login' ? <LogIn className="h-3.5 w-3.5" /> : ev.kind === 'signup' ? <UserPlus className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-200">{ev.title}</p>
                                                <p className="text-[11px] text-slate-400 leading-snug">{ev.description}</p>
                                                <p className="text-[10px] text-slate-600 mt-0.5">{relativeTime(ev.timestamp)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'signups' && (
                    <div className="space-y-3 animate-scale-in">
                        <form onSubmit={handleSignupSearch} className="relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input value={signupSearch} onChange={(e) => setSignupSearch(e.target.value)} placeholder="Search signups..." className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                        </form>
                        {signups.length === 0 ? <EmptyState icon={Users} text="No signups found" /> : (
                            <div className="space-y-2">
                                {signups.map(s => (
                                    <div key={s.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{s.full_name}</h4>
                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold truncate">{s.email} {s.phone ? `· ${s.phone}` : ''} · joined {new Date(s.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${s.has_posted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>{s.ad_count} ads</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'listings' && (
                    <div className="space-y-3 animate-scale-in">
                        <form onSubmit={handleListingFilter} className="flex gap-2 flex-wrap items-center">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <input value={listingSearch} onChange={(e) => setListingSearch(e.target.value)} placeholder="Search listings..." className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                            </div>
                            <select value={listingStatusFilter} onChange={(e) => setListingStatusFilter(e.target.value)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                <option value="">All statuses</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="closed">Closed</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <button type="submit" className="btn-premium bg-slate-100 text-gray-700 px-3 py-2 text-[10px] dark:bg-slate-800 dark:text-slate-200">Apply</button>
                        </form>

                        {agentListings.length === 0 ? <EmptyState icon={ClipboardList} text="No listings found" /> : (
                            <div className="space-y-2">
                                {agentListings.map(l => (
                                    <div key={l.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{l.title}</h4>
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${l.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>{l.status}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold truncate">
                                                {l.price} · {l.location} · {l.owner_name || `User #${l.owner_id}`} · views {l.views ?? 0}
                                            </p>
                                        </div>
                                        <div className="flex gap-1.5 shrink-0">
                                            {l.status !== 'active' && <button disabled={actingOnId === l.id} onClick={() => handleListingAction(l.id, 'approve')} title="Approve" className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" /></button>}
                                            {l.status === 'active' && <button disabled={actingOnId === l.id} onClick={() => handleListingAction(l.id, 'end')} title="End listing" className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"><PauseCircle className="h-3.5 w-3.5" /></button>}
                                            {l.status !== 'active' && <button disabled={actingOnId === l.id} onClick={() => handleListingAction(l.id, 'reactivate')} title="Reactivate" className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"><PlayCircle className="h-3.5 w-3.5" /></button>}
                                            <button disabled={actingOnId === l.id} onClick={() => handleListingAction(l.id, 'reject')} title="Reject" className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'verifications' && (
                    <div className="space-y-4 animate-scale-in">
                        {loading ? (
                            <div className="py-12 text-center text-sm font-semibold text-gray-400">Loading...</div>
                        ) : requests.length === 0 ? (
                            <EmptyState icon={ShieldCheck} text="No verification requests yet" />
                        ) : (
                            <div className="space-y-4">
                                {requests.map(req => (
                                    <div key={req.id} className="p-5 bg-white border border-gray-100 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-11 w-11 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm uppercase shrink-0">
                                                    {req.user?.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-900 dark:text-slate-100">{req.user?.full_name || `User #${req.user_id}`}</h4>
                                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">{req.user?.email} · {req.document_type} · tier {req.tier}</p>
                                                </div>
                                            </div>
                                            <StatusPill status={req.status} />
                                        </div>

                                        {req.notes && (
                                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950 rounded-2xl p-3">{req.notes}</p>
                                        )}

                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {req.document_urls.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                                    <img src={url} alt="Document" className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-slate-700" />
                                                </a>
                                            ))}
                                            {req.selfie_url && (
                                                <a href={req.selfie_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                                    <img src={req.selfie_url} alt="Selfie" className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-slate-700" />
                                                </a>
                                            )}
                                            {req.document_urls.length === 0 && !req.selfie_url && (
                                                <div className="h-20 w-20 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-gray-300">
                                                    <ImageIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>

                                        {req.status === 'pending' && (
                                            <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                                                <button
                                                    disabled={actingOnId === req.id}
                                                    onClick={() => handleVerificationAction(req.id, 'approved')}
                                                    className="btn-premium flex-1 bg-emerald-500 text-white py-2.5 text-xs hover:bg-emerald-600 disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Approve
                                                </button>
                                                <button
                                                    disabled={actingOnId === req.id}
                                                    onClick={() => handleVerificationAction(req.id, 'rejected')}
                                                    className="btn-premium flex-1 bg-slate-100 border border-gray-200 text-gray-700 py-2.5 text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 disabled:opacity-50"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'tickets' && (
                    <div className="space-y-4 animate-scale-in">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex gap-1.5">
                                {['', 'open', 'pending', 'resolved'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setTicketFilter(s)}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${ticketFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-gray-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
                                    >
                                        {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[32px] border border-gray-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 flex h-[600px]">
                            <div className={`${selectedTicket ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r border-gray-100 dark:border-slate-800 flex-col overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20`}>
                                {loading ? (
                                    <div className="py-12 text-center text-sm font-semibold text-gray-400">Loading...</div>
                                ) : tickets.length === 0 ? (
                                    <EmptyState icon={Inbox} text="No tickets found" />
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-slate-800/50">
                                        {tickets.map(ticket => (
                                            <button
                                                key={ticket.id}
                                                onClick={() => setSelectedTicket(ticket)}
                                                className={`w-full p-4 text-left transition-all space-y-1 ${selectedTicket?.id === ticket.id ? 'bg-white dark:bg-slate-900' : 'hover:bg-white/50 dark:hover:bg-slate-900/50'}`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{ticket.subject}</h4>
                                                    <StatusPill status={ticket.status} />
                                                </div>
                                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold capitalize">{ticket.category} · {ticket.priority} priority</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={`${selectedTicket ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
                                {selectedTicket ? (
                                    <>
                                        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <button onClick={() => setSelectedTicket(null)} className="md:hidden text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 shrink-0">
                                                    <ArrowLeft className="h-5 w-5" />
                                                </button>
                                                <div className="min-w-0">
                                                    <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{selectedTicket.subject}</h3>
                                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold capitalize">{selectedTicket.category}</p>
                                                </div>
                                            </div>
                                            {selectedTicket.status !== 'resolved' && (
                                                <button
                                                    onClick={() => handleResolve(selectedTicket.id)}
                                                    className="btn-premium bg-emerald-500 text-white px-3 py-1.5 text-[10px] hover:bg-emerald-600 shrink-0"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Resolve
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40 dark:bg-slate-950/10">
                                            {selectedTicket.chat_history.length === 0 ? (
                                                <p className="text-xs text-gray-400 text-center py-6">No messages yet</p>
                                            ) : (
                                                selectedTicket.chat_history.map((msg, i) => {
                                                    const isAgent = msg.role === 'assistant';
                                                    return (
                                                        <div key={i} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[75%] rounded-2xl p-3 text-xs font-semibold shadow-sm ${isAgent ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-bl-none'}`}>
                                                                {msg.content}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                                                placeholder="Type a reply..."
                                                className="flex-1 rounded-full border border-gray-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                            />
                                            <button
                                                onClick={handleReply}
                                                disabled={!replyText.trim()}
                                                className="h-10 w-10 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                                            >
                                                <Send className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <EmptyState icon={LifeBuoy} text="Select a ticket to view the conversation" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-2 animate-scale-in">
                        {history.length === 0 ? <EmptyState icon={HistoryIcon} text="No activated promotions yet" /> : (
                            history.map(p => (
                                <div key={p.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{p.listing_title_en || `Listing #${p.listing_id}`}</h4>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">{p.promotion_code} · ${p.amount} · {new Date(p.updated_at).toLocaleString()}</p>
                                    </div>
                                    <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full shrink-0">{p.status}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'otp' && (
                    <div className="space-y-4 max-w-lg animate-scale-in">
                        <form onSubmit={handleOtpLookup} className="flex gap-2 items-end flex-wrap">
                            <select value={otpChannel} onChange={(e) => setOtpChannel(e.target.value as 'email' | 'phone')} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                            </select>
                            <input required value={otpValue} onChange={(e) => setOtpValue(e.target.value)} placeholder={otpChannel === 'email' ? 'user@example.com' : '+2547XXXXXXXX'} className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                            <button type="submit" disabled={actingOnId === 'otp'} className="btn-premium bg-blue-600 text-white px-4 py-2.5 text-xs hover:bg-blue-700 disabled:opacity-50">
                                {actingOnId === 'otp' ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Lookup
                            </button>
                        </form>
                        {otpResult && (
                            <div className={`p-4 rounded-2xl border ${otpResult.found ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-gray-200 dark:bg-slate-950 dark:border-slate-800'}`}>
                                {otpResult.found ? (
                                    <>
                                        <p className="text-2xl font-black tracking-widest text-emerald-600">{otpResult.code}</p>
                                        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold mt-1">Expires in {otpResult.expires_in_seconds}s · {otpResult.channel}</p>
                                    </>
                                ) : (
                                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">{otpResult.message}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
    return (
        <div className="p-4 rounded-2xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-1.5">
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Icon className="h-4 w-4" />
            </div>
            <p className="text-lg font-black text-gray-900 dark:text-slate-100">{value.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wide">{label}</p>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20',
        open: 'text-red-500 bg-red-50 dark:bg-red-950/20',
        approved: 'text-emerald-600 bg-emerald-50',
        resolved: 'text-emerald-600 bg-emerald-50',
        rejected: 'text-gray-500 bg-slate-100 dark:bg-slate-800',
    };
    return (
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${styles[status] || 'text-gray-500 bg-slate-100'}`}>
            {status === 'pending' && <Clock className="h-2.5 w-2.5" />}
            {status}
        </span>
    );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
            <Icon className="h-8 w-8" />
            <p className="text-xs font-bold">{text}</p>
        </div>
    );
}
