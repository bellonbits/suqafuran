import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionService } from '../../services/promotionService';
import type { Promotion, PromotionPlan } from '../../services/promotionService';
import { Button } from '../../components/Button';
import { Check, X, Copy, Clock, DollarSign } from 'lucide-react';
import { cn } from '../../utils/cn';

const AdminPromotionsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualListingId, setManualListingId] = useState('');

    const { data: promotions, isLoading } = useQuery<Promotion[]>({
        queryKey: ['admin-promotions'],
        queryFn: () => promotionService.getPendingPromotions(),
    });

    const { data: plans } = useQuery<PromotionPlan[]>({
        queryKey: ['promotion-plans'],
        queryFn: () => promotionService.getPlans(),
    });

    const approveMutation = useMutation({
        mutationFn: ({ promotionId, planId }: { promotionId: number; planId: number }) =>
            promotionService.approvePromotion(promotionId, planId),
        onSuccess: (data) => {
            setGeneratedCode(data.promotion_code);
            queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
            setSelectedPromotion(null);
            setSelectedPlan(null);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ promotionId, reason }: { promotionId: number; reason: string }) =>
            promotionService.rejectPromotion(promotionId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
            setShowRejectModal(false);
            setSelectedPromotion(null);
            setRejectReason('');
        },
    });

    const directPromoteMutation = useMutation({
        mutationFn: ({ listingId, planId }: { listingId: number; planId: number }) =>
            promotionService.directPromote(listingId, planId),
        onSuccess: (data) => {
            setGeneratedCode(data.promotion_code);
            queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
            setShowManualModal(false);
            setManualListingId('');
            setSelectedPlan(null);
        },
    });

    const handleApprove = () => {
        if (selectedPromotion && selectedPlan) {
            approveMutation.mutate({
                promotionId: selectedPromotion.id,
                planId: selectedPlan,
            });
        }
    };

    const handleReject = () => {
        if (selectedPromotion && rejectReason) {
            rejectMutation.mutate({
                promotionId: selectedPromotion.id,
                reason: rejectReason,
            });
        }
    };

    const handleDirectPromote = () => {
        if (manualListingId && selectedPlan) {
            directPromoteMutation.mutate({
                listingId: Number(manualListingId),
                planId: selectedPlan,
            });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Clock className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading promotions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Promotion Payment Management</h1>
                            <p className="text-gray-600">Review mobile money payments and generate promotion codes</p>
                        </div>
                        <Button
                            className="rounded-xl shadow-lg shadow-primary-500/10"
                            onClick={() => setShowManualModal(true)}
                        >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Manual Promotion
                        </Button>
                    </div>
                </div>

                {/* Generated Code Display */}
                {generatedCode && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-green-900 mb-2">
                                    ✅ Promotion Code Generated!
                                </h3>
                                <p className="text-green-700 text-sm mb-3">
                                    Copy this code and send it to the seller as their official receipt.
                                </p>
                                <div className="flex items-center gap-3">
                                    <code className="bg-white border border-green-200 px-4 py-2 rounded font-mono text-xl font-bold text-green-600">
                                        {generatedCode}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(generatedCode)}
                                        className="bg-white border-green-200 text-green-600 hover:bg-green-50"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Code
                                    </Button>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => setGeneratedCode(null)}
                                className="text-green-700 hover:bg-green-100"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Pending Promotions Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">Pending Review</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Listing</th>
                                    <th className="px-6 py-4">Plan (Request)</th>
                                    <th className="px-6 py-4">Payment Proof</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {promotions?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                            No pending promotion requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    promotions?.map((promo) => (
                                        <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-400">#{promo.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 font-medium">Listing #{promo.listing_id}</div>
                                                <div className="text-xs text-gray-500">Requested: {new Date(promo.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-primary-600">
                                                Plan #{promo.plan_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                {promo.payment_proof ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                            {promo.payment_proof}
                                                        </span>
                                                        <span className="text-[10px] text-green-600 font-bold uppercase tracking-tight">Proof Submitted</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No proof yet</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-100 bg-red-50 hover:bg-red-100"
                                                        onClick={() => {
                                                            setSelectedPromotion(promo);
                                                            setShowRejectModal(true);
                                                        }}
                                                    >
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="shadow-lg shadow-primary-500/10"
                                                        onClick={() => {
                                                            setSelectedPromotion(promo);
                                                            setSelectedPlan(promo.plan_id);
                                                        }}
                                                    >
                                                        Review & Approve
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Approve Modal */}
            {selectedPromotion && !showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Create Promotion Code
                        </h3>
                        <p className="text-gray-600 mb-4">
                            You are about to generate a unique code for Promotion #{selectedPromotion.id}.
                            Confirm the listing details and plan duration.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Target</p>
                                <p className="text-gray-900 font-bold">Listing #{selectedPromotion.listing_id}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    Set Promotion Level
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {plans?.map((plan) => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={cn(
                                                "w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-between group",
                                                selectedPlan === plan.id
                                                    ? "border-primary-500 bg-primary-50 shadow-sm"
                                                    : "border-gray-100 hover:border-primary-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    selectedPlan === plan.id ? "bg-primary-500" : "bg-gray-300"
                                                )} />
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{plan.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{plan.duration_days} Days</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-primary-600">
                                                ${plan.price_usd}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => {
                                    setSelectedPromotion(null);
                                    setSelectedPlan(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 font-bold"
                                onClick={handleApprove}
                                disabled={!selectedPlan || approveMutation.isPending}
                                isLoading={approveMutation.isPending}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Approve & Code
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedPromotion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Reject Promotion
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Provide a reason for rejecting Promotion #{selectedPromotion.id}
                        </p>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4 outline-none"
                            rows={4}
                        />

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedPromotion(null);
                                    setRejectReason('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                className="flex-1 font-bold"
                                onClick={handleReject}
                                disabled={!rejectReason || rejectMutation.isPending}
                                isLoading={rejectMutation.isPending}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Promotion Modal */}
            {showManualModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 font-bold" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                Manual Promotion
                            </h3>
                        </div>

                        <p className="text-gray-500 text-sm mb-6 leading-relaxed italic">
                            Create a promotion directly for a listing and generate a receipt code.
                        </p>

                        <div className="space-y-6 mb-8">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                    Listing ID
                                </label>
                                <input
                                    type="number"
                                    value={manualListingId}
                                    onChange={(e) => setManualListingId(e.target.value)}
                                    placeholder="e.g. 1024"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                                    Select Promotion Type
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {plans?.map((plan) => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={cn(
                                                "w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between group",
                                                selectedPlan === plan.id
                                                    ? "border-primary-500 bg-primary-50 shadow-md"
                                                    : "border-gray-50 bg-gray-50 hover:border-primary-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full transition-all",
                                                    selectedPlan === plan.id ? "bg-primary-500 scale-150" : "bg-gray-300"
                                                )} />
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{plan.name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{plan.duration_days} Days</p>
                                                </div>
                                            </div>
                                            <p className="text-base font-black text-primary-600">
                                                ${plan.price_usd}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <Button
                                variant="secondary"
                                className="flex-1 h-12 rounded-xl text-gray-400 hover:text-gray-600 font-bold"
                                onClick={() => {
                                    setShowManualModal(false);
                                    setManualListingId('');
                                    setSelectedPlan(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 h-12 rounded-xl bg-gray-900 font-bold shadow-lg shadow-gray-200 text-white"
                                onClick={handleDirectPromote}
                                disabled={!manualListingId || !selectedPlan || directPromoteMutation.isPending}
                                isLoading={directPromoteMutation.isPending}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Initiate
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPromotionsPage;
