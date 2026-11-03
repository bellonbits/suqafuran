import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Users, ShoppingBag, ShieldCheck, Zap, Layers,
  Megaphone, Flag, LifeBuoy, Globe, AlertOctagon,
  Check, X, Eye, Phone, Mail, KeyRound, ArrowRight,
  Loader2, RefreshCw, Sparkles, Store, Building2,
  FolderTree, Receipt, BarChart3
} from 'lucide-react';

import api from '../services/api';
import { adminService, type AdminStats } from '../services/adminService';
import { PageHeader } from '../components/dashboard/PageHeader';
import { BoardStatCard } from '../components/dashboard/BoardStatCard';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { getImageUrl } from '../utils/imageUtils';
import { cn } from '../utils/cn';

// ── Quick Hub Modules ────────────────────────────────────────────────────────
const HUB_MODULES = [
  {
    id: 'users',
    label: 'User Management',
    desc: 'Manage accounts, phone verification, and seller roles',
    icon: Users,
    path: '/admin-dashboard/users',
  },
  {
    id: 'listings',
    label: 'Marketplace Listings',
    desc: 'Review, moderate, edit and take down ads',
    icon: ShoppingBag,
    path: '/admin-dashboard/listings',
  },
  {
    id: 'verifications',
    label: 'ID Verification Queue',
    desc: 'Review national IDs and business licenses',
    icon: ShieldCheck,
    path: '/admin-dashboard/verifications',
  },
  {
    id: 'categories',
    label: 'Categories & Taxonomy',
    desc: 'Manage 3-tier category hierarchy & banners',
    icon: FolderTree,
    path: '/admin-dashboard/categories',
  },
  {
    id: 'promotions',
    label: 'Promotions & Boosts',
    desc: 'Manage VIP, Top Ad, and Urgent promotions',
    icon: Zap,
    path: '/admin-dashboard/promotions',
  },
  {
    id: 'vouchers',
    label: 'Vouchers & Discounts',
    desc: 'Discount codes and seller wallet top-ups',
    icon: Receipt,
    path: '/admin-dashboard/vouchers',
  },
  {
    id: 'marketing',
    label: 'Marketing Automation',
    desc: 'Email sequences and 15 rotating SMS headlines',
    icon: Megaphone,
    path: '/admin-dashboard/marketing',
  },
  {
    id: 'reports',
    label: 'Reports & Complaints',
    desc: 'User abuse reports and scam flags',
    icon: Flag,
    path: '/admin-dashboard/reports',
  },
  {
    id: 'fraud',
    label: 'Fraud & Risk Moderation',
    desc: 'Automated velocity bursts and scam alerts',
    icon: AlertOctagon,
    path: '/admin-dashboard/fraud-moderation',
  },
];

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Active View Tab: 'queues' | 'modules' | 'diagnostics'
  const [activeTab, setActiveTab] = useState<'queues' | 'modules' | 'diagnostics'>('queues');

  // OTP Lookup state
  const [otpMode, setOtpMode] = useState<'phone' | 'email'>('phone');
  const [otpQuery, setOtpQuery] = useState('');
  const [otpResult, setOtpResult] = useState<{ found: boolean; code?: string; expires_in_seconds?: number; message: string } | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // Agent Assignment state
  const [agentEmail, setAgentEmail] = useState('');
  const [agentError, setAgentError] = useState<string | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });

  const { data: pendingAds = [], isLoading: adsLoading } = useQuery({
    queryKey: ['admin-queue'],
    queryFn: adminService.getModerationQueue,
  });

  const { data: verificationRequests = [], isLoading: verifsLoading } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: adminService.getVerificationRequests,
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery<any[]>({
    queryKey: ['admin-agents'],
    queryFn: () => api.get('/admin/agents').then(r => r.data).catch(() => []),
  });

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminService.moderateVerification(id, status),
    onSuccess: () => {
      toast.success('Verification updated');
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: () => toast.error('Failed to update verification'),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) =>
      adminService.moderateListing(id, approve),
    onSuccess: (_, variables) => {
      toast.success(variables.approve ? 'Listing approved & published' : 'Listing rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: () => toast.error('Failed to moderate listing'),
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

  const pendingVerifsCount = verificationRequests.filter((r: any) => r.status === 'pending').length;
  const pendingAdsCount = pendingAds.length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <PageHeader
        title="Admin Console"
        subtitle="Marketplace operations, trust & safety moderation, seller verifications, and platform analytics."
        breadcrumbs={[
          { label: 'Admin Console', path: '/admin-dashboard' },
          { label: 'Overview' },
        ]}
        actions={
          <button
            onClick={() => refetchStats()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh Stats</span>
          </button>
        }
      />

      {/* ── BoardUI KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BoardStatCard
          label="Registered Users"
          value={statsLoading ? '...' : (stats?.total_users ?? 0).toLocaleString()}
          caption="Total buyer & seller accounts"
          icon={Users}
          onClick={() => navigate('/admin-dashboard/users')}
        />
        <BoardStatCard
          label="Live Listings"
          value={statsLoading ? '...' : (stats?.active_listings ?? 0).toLocaleString()}
          caption="Published across East Africa"
          icon={ShoppingBag}
          onClick={() => navigate('/admin-dashboard/listings')}
        />
        <BoardStatCard
          label="Pending Verifications"
          value={verifsLoading ? '...' : pendingVerifsCount}
          delta={pendingVerifsCount > 0 ? `${pendingVerifsCount} waiting` : 'Zero backlog'}
          deltaTone={pendingVerifsCount > 0 ? 'negative' : 'positive'}
          caption="Seller identity queue"
          icon={ShieldCheck}
          onClick={() => setActiveTab('queues')}
        />
        <BoardStatCard
          label="Ads Awaiting Review"
          value={adsLoading ? '...' : pendingAdsCount}
          delta={pendingAdsCount > 0 ? 'Needs review' : 'Clear'}
          deltaTone={pendingAdsCount > 0 ? 'negative' : 'positive'}
          caption="Product moderation queue"
          icon={AlertOctagon}
          onClick={() => setActiveTab('queues')}
        />
      </div>

      {/* ── View Selection Tabs ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'queues', label: 'Action Queues', badge: pendingVerifsCount + pendingAdsCount },
          { id: 'modules', label: 'Marketplace Modules', badge: HUB_MODULES.length },
          { id: 'diagnostics', label: 'Support & OTP Tools' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2",
              activeTab === tab.id
                ? "border-sky-500 text-sky-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                activeTab === tab.id ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: ACTION QUEUES ────────────────────────────────────── */}
      {activeTab === 'queues' && (
        <div className="space-y-6">
          {/* Pending Verifications */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-500" />
                  <span>Pending Seller Verifications ({pendingVerifsCount})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Review submitted documents to grant trusted seller badges.
                </p>
              </div>
              <Link
                to="/admin-dashboard/verifications"
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>View Full Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {verifsLoading ? (
              <div className="py-10 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-sky-500 mx-auto mb-2" />
                <span className="text-xs">Loading verification requests...</span>
              </div>
            ) : verificationRequests.length === 0 ? (
              <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-sm font-bold text-slate-800">Verification Queue is Clear</p>
                <p className="text-xs text-slate-500">No sellers are currently waiting for ID approval.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {verificationRequests.slice(0, 5).map((req: any) => (
                  <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{req.user?.full_name || `User #${req.user_id}`}</span>
                        <StatusBadge status={req.status || 'pending'} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tier requested: <span className="font-semibold text-slate-700">{req.verification_type || 'ID Document'}</span> · Phone: {req.user?.phone || 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => verifyMutation.mutate({ id: req.id, status: 'approved' })}
                        disabled={verifyMutation.isPending}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => verifyMutation.mutate({ id: req.id, status: 'rejected' })}
                        disabled={verifyMutation.isPending}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Listings Moderation */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-amber-500" />
                  <span>Pending Product Moderation Queue ({pendingAdsCount})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  New classifieds listings awaiting approval before going live.
                </p>
              </div>
              <Link
                to="/admin-dashboard/listings"
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>View All Listings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {adsLoading ? (
              <div className="py-10 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-sky-500 mx-auto mb-2" />
                <span className="text-xs">Loading moderation queue...</span>
              </div>
            ) : pendingAds.length === 0 ? (
              <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-sm font-bold text-slate-800">All Ads Moderated</p>
                <p className="text-xs text-slate-500">Every listing has been checked and processed.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingAds.slice(0, 5).map((ad: any) => (
                  <div key={ad.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {ad.primary_image || (ad.images && ad.images[0]) ? (
                        <img
                          src={getImageUrl(ad.primary_image || ad.images[0])}
                          alt={ad.title_en}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{ad.title_en}</p>
                        <p className="text-xs font-extrabold text-sky-600 mt-0.5">
                          {ad.currency || 'KES'} {Number(ad.price || 0).toLocaleString()} · 📍 {ad.location || 'East Africa'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => moderateMutation.mutate({ id: ad.id, approve: true })}
                        disabled={moderateMutation.isPending}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => moderateMutation.mutate({ id: ad.id, approve: false })}
                        disabled={moderateMutation.isPending}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: MARKETPLACE MODULES ──────────────────────────────── */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HUB_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.id}
                to={mod.path}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:border-sky-300 hover:shadow-md transition-all group flex flex-col justify-between min-h-[140px]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="space-y-1 pt-3">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {mod.label}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── TAB 3: DIAGNOSTICS & OTP LOOKUP ─────────────────────────── */}
      {activeTab === 'diagnostics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OTP Lookup Tool */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <KeyRound className="w-5 h-5 text-sky-500" />
              <span>Customer Support OTP Lookup</span>
            </div>
            <p className="text-xs text-slate-500">
              Lookup active login or verification codes when a user reports SMS delivery issues.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOtpMode('phone')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  otpMode === 'phone' ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                Phone Number
              </button>
              <button
                type="button"
                onClick={() => setOtpMode('email')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  otpMode === 'email' ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                Email Address
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={otpQuery}
                onChange={e => setOtpQuery(e.target.value)}
                placeholder={otpMode === 'phone' ? '+254 700 000000' : 'user@example.com'}
                className="flex-1 px-4 py-2.5 text-xs border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
              />
              <button
                onClick={handleOtpLookup}
                disabled={otpLoading || !otpQuery.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>Find Code</span>
              </button>
            </div>

            {otpResult && (
              <div className={cn(
                "p-4 rounded-2xl border text-xs leading-relaxed",
                otpResult.found
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              )}>
                {otpResult.found ? (
                  <div>
                    <span className="block font-bold">Active OTP Found:</span>
                    <span className="font-mono text-lg font-black tracking-widest text-emerald-700">{otpResult.code}</span>
                    <span className="block text-[11px] text-emerald-600 mt-1">
                      Expires in {otpResult.expires_in_seconds}s
                    </span>
                  </div>
                ) : (
                  <span>{otpResult.message || 'No active OTP found for this identifier.'}</span>
                )}
              </div>
            )}
          </div>

          {/* Agent Permissions */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Users className="w-5 h-5 text-indigo-500" />
              <span>Admin & Field Agent Access</span>
            </div>
            <p className="text-xs text-slate-500">
              Grant staff or agents access to assist sellers with photo shoots and listings.
            </p>

            <div className="flex gap-2">
              <input
                type="email"
                value={agentEmail}
                onChange={e => setAgentEmail(e.target.value)}
                placeholder="agent@suqafuran.com"
                className="flex-1 px-4 py-2.5 text-xs border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
              />
              <button
                onClick={() => agentEmail && addAgentMutation.mutate(agentEmail)}
                disabled={addAgentMutation.isPending || !agentEmail}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Grant Access
              </button>
            </div>

            {agentError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">{agentError}</p>
            )}

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Authorized Agents ({agents.length})
              </span>
              {agents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No external agents assigned.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {agents.map((ag: any) => (
                    <div key={ag.id || ag.email} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{ag.email || ag.full_name}</span>
                      <button
                        onClick={() => removeAgentMutation.mutate(ag.email)}
                        className="text-rose-600 hover:underline text-[11px]"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
