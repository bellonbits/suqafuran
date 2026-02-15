import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PublicLayout } from '../layouts/PublicLayout';
import { promotionService } from '../services/promotionService';
import type { PromotionPlan } from '../services/promotionService';
import { listingService } from '../services/listingService';
import { Button } from '../components/Button';
import { Check, CreditCard, ShieldCheck, Timer, Zap, Loader2 } from 'lucide-react';

const PromotionPage: React.FC = () => {
    const { adId } = useParams<{ adId: string }>();
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<PromotionPlan | null>(null);
    const [transactionId, setTransactionId] = useState('');
    const [step, setStep] = useState<'plan' | 'payment'>('plan');

    const { isLoading: adLoading } = useQuery({
        queryKey: ['ad', adId],
        queryFn: () => listingService.getListing(Number(adId)),
        enabled: !!adId,
    });

    const { data: plans, isLoading: plansLoading } = useQuery({
        queryKey: ['promotion-plans'],
        queryFn: promotionService.getPlans,
    });

    const createMutation = useMutation({
        mutationFn: (planId: number) => promotionService.createPromotion(Number(adId), planId),
        onSuccess: () => setStep('payment'),
    });

    const proofMutation = useMutation({
        mutationFn: (data: { id: number, proof: string }) => promotionService.submitProof(data.id, data.proof),
        onSuccess: () => navigate('/dashboard', { state: { message: 'Boost request submitted! We will verify your payment shortly.' } }),
    });

    if (adLoading || plansLoading) {
        return (
            <PublicLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Boost Your Advert</h1>
                    <p className="text-gray-500">Get up to 10x more views and sell your items faster.</p>
                </div>

                {step === 'plan' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans?.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer ${selectedPlan?.id === plan.id
                                    ? 'border-primary-500 bg-primary-50 shadow-xl scale-105'
                                    : 'border-gray-100 bg-white hover:border-primary-200'
                                    }`}
                                onClick={() => setSelectedPlan(plan)}
                            >
                                {plan.name === 'Diamond' && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Best Value
                                    </div>
                                )}
                                <div className="mb-4 flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.name === 'Diamond' ? 'bg-secondary-100 text-secondary-600' : 'bg-primary-100 text-primary-600'
                                        }`}>
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                                </div>
                                <div className="mb-6">
                                    <span className="text-3xl font-black text-gray-900">${plan.price_usd}</span>
                                    <span className="text-gray-500 text-sm ml-1">/ {plan.duration_days} days</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                                        <span>Show at top of category</span>
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                                        <span>Show on landing page</span>
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                                        <span>Priority badge highlight</span>
                                    </li>
                                </ul>
                                <Button
                                    className={`w-full rounded-xl font-bold ${selectedPlan?.id === plan.id ? 'bg-primary-600' : 'bg-gray-900'
                                        }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        createMutation.mutate(plan.id);
                                    }}
                                    isLoading={createMutation.isPending && selectedPlan?.id === plan.id}
                                >
                                    Select Plan
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-primary-600 p-8 text-white text-center">
                            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-80" />
                            <h2 className="text-2xl font-bold mb-2">Complete Payment</h2>
                            <p className="text-primary-100">Send <strong>${selectedPlan?.price_usd}</strong> via EVC-Plus</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-gray-50 rounded-2xl p-5 border border-dashed border-gray-300">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dial this code:</h4>
                                <div className="flex items-center justify-between">
                                    <code className="text-xl font-black text-primary-600">*711*61XXXXXXX*{selectedPlan?.price_usd}#</code>
                                    <Button variant="ghost" size="sm" className="text-primary-600 h-8 px-2">Copy</Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Transaction ID (TID)</label>
                                <input
                                    type="text"
                                    placeholder="Enter the 10-digit ID"
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-400">You can find the TID in your EVC confirmation SMS.</p>
                            </div>

                            <Button
                                className="w-full h-12 rounded-xl bg-primary-600 font-bold shadow-lg shadow-primary-500/20"
                                onClick={() => proofMutation.mutate({
                                    id: createMutation.data!.id,
                                    proof: transactionId
                                })}
                                disabled={!transactionId}
                                isLoading={proofMutation.isPending}
                            >
                                Submit Payment Proof
                            </Button>

                            <button
                                onClick={() => setStep('plan')}
                                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
                            >
                                Back to plans
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Safe & Secure</h4>
                            <p className="text-xs text-gray-500">Payments are processed manually by our Somali agents for maximum security.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                            <Timer className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Quick Activation</h4>
                            <p className="text-xs text-gray-500">Boosts are typically activated within 15-30 minutes after verification.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Massive Reach</h4>
                            <p className="text-xs text-gray-500">Promoted ads receive up to 10x more interaction from potential buyers.</p>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export { PromotionPage };
