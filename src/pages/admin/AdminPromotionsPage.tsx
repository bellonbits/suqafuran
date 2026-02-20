import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionService } from '../../services/promotionService';
import { auditService } from '../../services/auditService';
import type { Promotion, PromotionPlan } from '../../services/promotionService';
import type { AuditLogEntry } from '../../services/auditService';
import { Button } from '../../components/Button';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
    ArrowLeft, Check, X, Copy, Clock, DollarSign,
    TrendingUp, ShieldCheck, Zap, Activity,
    CreditCard, User, ShoppingBag, Wallet, AlertTriangle, CheckCircle,
    RefreshCw, Shield, Tag, ListChecks,
} from 'lucide-react';

// ── Action meta map (matches AgentDashboard) ─────────────────────────────────
const ACTION_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    USER_SIGNUP: { icon: User, color: 'text-green-400', bg: 'bg-green-500/10', label: 'New Signup' },
    USER_LOGIN: { icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Login' },
    CREATE_LISTING: { icon: ShoppingBag, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'New Ad' },
    MATCH_PAYMENT: { icon: CreditCard, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Payment Matched' },
    ACTIVATE_PROMOTION: { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Promo Activated' },
    REJECT_TRANSACTION: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'TX Rejected' },
    WALLET_DEPOSIT: { icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Deposit' },
    VOUCHER_REDEEMED: { icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Voucher Used' },
};

const PLAN_ICONS = [TrendingUp, ShieldCheck, DollarSign];

const AdminPromotionsPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'pending' | 'generate' | 'apply'>('pending');
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectPanel, setShowRejectPanel] = useState(false);
    const [manualListingId, setManualListingId] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [voucherAmount, setVoucherAmount] = useState('10');
    const [copied, setCopied] = useState(false);

    const { data: promotions, isLoading, refetch: refetchPending } = useQuery<Promotion[]>({
        queryKey: ['admin-promotions'],
        queryFn: () => promotionService.getPendingPromotions(),
    });

    const { data: plans } = useQuery<PromotionPlan[]>({
        queryKey: ['promotion-plans'],
        queryFn: () => promotionService.getPlans(),
    });

    const { data: auditLogs, refetch: refetchLogs } = useQuery({
        queryKey: ['audit-logs-admin'],
        queryFn: () => auditService.getLogs({ limit: 20 }),
        refetchInterval: 10000,
    });

    const approveMutation = useMutation({
        mutationFn: ({ promotionId, planId }: { promotionId: number; planId: number }) =>
            promotionService.approvePromotion(promotionId, planId),
        onSuccess: (data) => {
            setGeneratedCode(data.promotion_code);
            queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs-admin'] });
            setSelectedPromotion(null);
            setSelectedPlan(null);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ promotionId, reason }: { promotionId: number; reason: string }) =>
            promotionService.rejectPromotion(promotionId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
            setShowRejectPanel(false);
            setSelectedPromotion(null);
            setRejectReason('');
        },
    });

    const generateCodeMutation = useMutation({
        mutationFn: (amount: number) => promotionService.generateCode(amount),
        onSuccess: (data) => {
            setGeneratedCode(data.code);
            setManualCode(data.code);
            setStatusMessage({ type: 'success', text: `Code ${data.code} generated — send to seller.` });
        },
    });

    const applyCodeMutation = useMutation({
        mutationFn: (payload: { code: string; listing_id: number; plan_id: number }) =>
            promotionService.applyCode(payload),
        onSuccess: (data) => {
            setStatusMessage({ type: 'success', text: data.message });
            setManualCode('');
            setManualListingId('');
            setSelectedPlan(null);
            queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs-admin'] });
        },
        onError: (err: any) => {
            setStatusMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to apply code.' });
        },
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Tabs config ────────────────────────────────────────────────────────────
    const tabs = [
        { id: 'pending', label: 'Pending Review', icon: ListChecks, count: promotions?.length },
        { id: 'generate', label: 'Generate Code', icon: Tag },
        { id: 'apply', label: 'Apply to Listing', icon: Zap },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <button
                        onClick={() => navigate('/admin')}
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-primary-600 font-bold mb-3 transition-colors group text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Shield className="text-primary-600" />
                        Promotion Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Review requests, generate codes, and apply promotions to listings.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live Monitoring</span>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 overflow-x-auto mb-8 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.count != null && tab.count > 0 && (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Status Toast */}
            <AnimatePresence>
                {statusMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className={cn(
                            'flex items-center justify-between p-4 rounded-2xl mb-6 text-sm font-bold border',
                            statusMessage.type === 'success'
                                ? 'bg-green-50 text-green-700 border-green-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {statusMessage.type === 'success' ? <Check size={16} /> : <X size={16} />}
                            {statusMessage.text}
                        </div>
                        <button onClick={() => setStatusMessage(null)}><X size={14} className="opacity-50 hover:opacity-100" /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── LEFT: Main Panel ─────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* ── TAB: PENDING REVIEW ──────────────────────────────── */}
                    {activeTab === 'pending' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Pending Requests</h3>
                                <button onClick={() => refetchPending()} className="text-primary-600 hover:rotate-180 transition-all duration-500">
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <div className="p-20 text-center"><Clock className="animate-spin mx-auto text-gray-300" /></div>
                                ) : promotions?.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-200">
                                            <ListChecks size={30} />
                                        </div>
                                        <p className="text-sm font-black text-gray-300 uppercase tracking-widest">No pending requests</p>
                                    </div>
                                ) : (
                                    promotions?.map((promo) => (
                                        <div key={promo.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                                                    <ShoppingBag size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-gray-900 truncate">{promo.listing_title || `Listing #${promo.listing_id}`}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {promo.plan_name} • ${(promo as any).amount || '—'}
                                                        {promo.payment_proof && (
                                                            <span className="ml-2 text-green-600 font-bold">✓ Proof</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                    variant="outline"
                                                    className="h-9 px-3 rounded-lg text-[10px] font-bold border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                                    onClick={() => {
                                                        setSelectedPromotion(promo);
                                                        setShowRejectPanel(true);
                                                    }}
                                                >
                                                    <X size={14} className="mr-1" /> Reject
                                                </Button>
                                                <Button
                                                    className="h-9 px-3 rounded-lg text-[10px] font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                                                    onClick={() => {
                                                        setSelectedPromotion(promo);
                                                        setSelectedPlan(promo.plan_id);
                                                        setShowRejectPanel(false);
                                                    }}
                                                >
                                                    <Check size={14} className="mr-1" /> Approve
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── TAB: GENERATE CODE ───────────────────────────────── */}
                    {activeTab === 'generate' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="font-bold text-gray-900">Generate Voucher Code</h3>
                                <p className="text-xs text-gray-400 mt-1">Specify token amount, then send the code to the seller as their receipt.</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Token Amount (USD)</label>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                value={voucherAmount}
                                                onChange={(e) => setVoucherAmount(e.target.value)}
                                                className="w-full h-14 pl-9 pr-4 rounded-2xl border-2 border-gray-100 focus:border-primary-400 bg-gray-50 outline-none font-bold text-gray-900 text-lg transition-colors"
                                                placeholder="10"
                                            />
                                        </div>
                                        <Button
                                            className="h-14 px-6 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold shrink-0 shadow-lg shadow-primary-200"
                                            onClick={() => generateCodeMutation.mutate(parseFloat(voucherAmount) || 0)}
                                            isLoading={generateCodeMutation.isPending}
                                        >
                                            <Tag size={16} className="mr-2" />
                                            Generate
                                        </Button>
                                    </div>
                                </div>

                                {/* Generated Code Result */}
                                <AnimatePresence>
                                    {generatedCode && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-green-50 border border-green-100 rounded-2xl p-5"
                                        >
                                            <div className="text-[10px] text-green-600 font-black uppercase tracking-widest mb-2">✅ Code Ready — Send to Seller</div>
                                            <div className="flex items-center gap-3">
                                                <code className="flex-1 bg-white border border-green-200 px-4 py-3 rounded-xl font-mono text-xl font-black text-green-700 tracking-widest">
                                                    {generatedCode}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(generatedCode)}
                                                    className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                                        copied
                                                            ? "bg-green-600 text-white"
                                                            : "bg-white border border-green-200 text-green-600 hover:bg-green-100"
                                                    )}
                                                >
                                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* ── TAB: APPLY TO LISTING ────────────────────────────── */}
                    {activeTab === 'apply' && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="font-bold text-gray-900">Apply Promotion Code</h3>
                                <p className="text-xs text-gray-400 mt-1">Link a code to a listing and boost level to activate the promotion.</p>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Code Input */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Promotion Code</label>
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        placeholder="20260217-001-XYZ"
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-primary-400 bg-gray-50 focus:bg-white outline-none transition-all font-mono font-bold text-primary-600 text-lg"
                                    />
                                </div>

                                {/* Quick Select */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quick Select (Pending Requests)</label>
                                    <select
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-primary-400 bg-gray-50 focus:bg-white outline-none transition-all font-bold text-gray-700 text-sm"
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val) {
                                                const [lId, pId] = val.split(':');
                                                setManualListingId(lId);
                                                setSelectedPlan(Number(pId));
                                            }
                                        }}
                                        value={manualListingId && selectedPlan ? `${manualListingId}:${selectedPlan}` : ''}
                                    >
                                        <option value="">— Select a requested listing —</option>
                                        {promotions?.map((p) => (
                                            <option key={p.id} value={`${p.listing_id}:${p.plan_id}`}>
                                                {p.listing_title || `Listing #${p.listing_id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Manual Listing ID */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Listing ID (Manual)</label>
                                    <input
                                        type="number"
                                        value={manualListingId}
                                        onChange={(e) => setManualListingId(e.target.value)}
                                        placeholder="e.g. 1024"
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-primary-400 bg-gray-50 focus:bg-white outline-none transition-all font-bold text-gray-700"
                                    />
                                </div>

                                {/* Plan Selector */}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Promotion Type</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {plans?.map((plan, index) => {
                                            const PlanIcon = PLAN_ICONS[index] || DollarSign;
                                            return (
                                                <button
                                                    key={plan.id}
                                                    type="button"
                                                    onClick={() => setSelectedPlan(plan.id)}
                                                    className={cn(
                                                        'w-full text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center justify-between',
                                                        selectedPlan === plan.id
                                                            ? 'border-primary-500 bg-primary-50'
                                                            : 'border-gray-100 bg-white hover:border-primary-200'
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            'w-10 h-10 rounded-2xl flex items-center justify-center transition-all',
                                                            selectedPlan === plan.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                                                        )}>
                                                            <PlanIcon size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-gray-900 text-sm">{plan.name}</p>
                                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{plan.duration_days} Days</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-primary-50 px-3 py-1.5 rounded-xl">
                                                        <p className="text-sm font-black text-primary-600">${plan.price_usd}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black text-base shadow-xl shadow-primary-200"
                                    onClick={() => {
                                        if (manualCode && manualListingId && selectedPlan) {
                                            applyCodeMutation.mutate({
                                                code: manualCode,
                                                listing_id: parseInt(manualListingId),
                                                plan_id: selectedPlan,
                                            });
                                        }
                                    }}
                                    disabled={!manualCode || !manualListingId || !selectedPlan}
                                    isLoading={applyCodeMutation.isPending}
                                >
                                    <Zap size={18} className="mr-2" />
                                    Apply Promotion
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Action Panel + Live Feed ─────────────────────── */}
                <div className="space-y-6">
                    {/* Approve / Reject Inline Panel */}
                    <AnimatePresence mode="wait">
                        {selectedPromotion && !showRejectPanel ? (
                            <motion.div
                                key="approve"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="bg-primary-600 rounded-3xl p-6 text-white shadow-xl shadow-primary-200"
                            >
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
                                    <CheckCircle size={18} />
                                    Approve Promotion #{selectedPromotion.id}
                                </h3>
                                <div className="bg-blue-300/20 p-4 rounded-2xl border border-blue-300/20 mb-4">
                                    <div className="text-[10px] font-bold opacity-60 uppercase mb-1">Listing</div>
                                    <div className="font-bold">{selectedPromotion.listing_title || `#${selectedPromotion.listing_id}`}</div>
                                    {selectedPromotion.payment_proof && (
                                        <div className="text-xs font-mono opacity-70 mt-1 truncate">{selectedPromotion.payment_proof}</div>
                                    )}
                                </div>
                                <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Set Promotion Level</label>
                                <div className="space-y-2 mb-5">
                                    {plans?.map((plan) => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={cn(
                                                'w-full text-left px-4 py-3 rounded-2xl border-2 transition-all flex items-center justify-between',
                                                selectedPlan === plan.id
                                                    ? 'border-white bg-white/10'
                                                    : 'border-blue-300/20 hover:border-blue-300/40'
                                            )}
                                        >
                                            <div>
                                                <p className="font-bold text-sm">{plan.name}</p>
                                                <p className="text-[10px] opacity-60">{plan.duration_days} Days</p>
                                            </div>
                                            <p className="font-black text-sm">${plan.price_usd}</p>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-white text-primary-600 font-bold h-11 rounded-xl"
                                        disabled={!selectedPlan || approveMutation.isPending}
                                        onClick={() => {
                                            if (selectedPromotion && selectedPlan) {
                                                approveMutation.mutate({ promotionId: selectedPromotion.id, planId: selectedPlan });
                                            }
                                        }}
                                        isLoading={approveMutation.isPending}
                                    >
                                        <Check size={14} className="mr-1" /> Approve & Generate
                                    </Button>
                                    <button
                                        onClick={() => { setSelectedPromotion(null); setSelectedPlan(null); }}
                                        className="w-11 h-11 rounded-xl bg-blue-300/20 flex items-center justify-center hover:bg-blue-300/40 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ) : selectedPromotion && showRejectPanel ? (
                            <motion.div
                                key="reject"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="bg-red-600 rounded-3xl p-6 text-white shadow-xl shadow-red-200"
                            >
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
                                    <AlertTriangle size={18} />
                                    Reject #{selectedPromotion.id}
                                </h3>
                                <div className="text-xs opacity-70 mb-3 font-bold">
                                    {selectedPromotion.listing_title || `Listing #${selectedPromotion.listing_id}`}
                                </div>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Rejection reason..."
                                    className="w-full px-4 py-3 rounded-2xl bg-red-700 border border-red-400/30 text-white placeholder-red-300 outline-none focus:border-red-200 transition-colors text-sm resize-none mb-4"
                                    rows={3}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-white text-red-600 font-bold h-11 rounded-xl"
                                        disabled={!rejectReason || rejectMutation.isPending}
                                        onClick={() => {
                                            if (selectedPromotion && rejectReason) {
                                                rejectMutation.mutate({ promotionId: selectedPromotion.id, reason: rejectReason });
                                            }
                                        }}
                                        isLoading={rejectMutation.isPending}
                                    >
                                        <X size={14} className="mr-1" /> Confirm Reject
                                    </Button>
                                    <button
                                        onClick={() => { setShowRejectPanel(false); setSelectedPromotion(null); }}
                                        className="w-11 h-11 rounded-xl bg-red-700 flex items-center justify-center hover:bg-red-800 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <ShieldCheck size={32} />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2 text-sm">Select an action</h4>
                                <p className="text-[10px] text-gray-400 leading-relaxed px-4">
                                    Pick a pending request on the left to approve or reject it here.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* ── Live Activity Feed ────────────────────────────────── */}
                    <div className="bg-gray-900 rounded-3xl p-6 text-white overflow-hidden relative">
                        <Shield className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-green-400 animate-pulse" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-300">Live System Activity</h4>
                            </div>
                            <button
                                onClick={() => refetchLogs()}
                                className="text-gray-500 hover:text-white transition-colors hover:rotate-180 duration-500"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[380px] overflow-y-auto scrollbar-hide">
                            {!auditLogs || auditLogs.length === 0 ? (
                                <div className="flex gap-3">
                                    <div className="w-1 bg-primary-500 rounded-full shrink-0" />
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-bold mb-1">SYSTEM STATUS</div>
                                        <p className="text-xs text-gray-300">Listening for incoming events...</p>
                                    </div>
                                </div>
                            ) : (
                                auditLogs.map((log: AuditLogEntry) => {
                                    const meta = ACTION_META[log.action] || { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-500/10', label: log.action };
                                    const Icon = meta.icon;
                                    return (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-start gap-3"
                                        >
                                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
                                                <Icon size={12} className={meta.color} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${meta.color}`}>
                                                    {meta.label}
                                                    {log.user_name && (
                                                        <span className="text-gray-500 ml-1 font-bold normal-case tracking-normal">
                                                            · {log.user_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{log.details}</p>
                                                <div className="text-[9px] text-gray-600 mt-0.5">
                                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPromotionsPage;
