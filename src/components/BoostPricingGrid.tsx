import React from 'react';
import { Check, Zap, Phone, Copy, Info } from 'lucide-react';
import { Button } from './Button';
import type { PromotionPlan } from '../services/promotionService';

interface BoostPricingGridProps {
    plans: PromotionPlan[];
    onSelect?: (plan: PromotionPlan) => void;
    selectedPlanId?: number;
    showInstructions?: boolean;
}

export const BoostPricingGrid: React.FC<BoostPricingGridProps> = ({
    plans,
    onSelect,
    selectedPlanId,
    showInstructions = true
}) => {
    const paymentNumber = "+252612958679";

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Simple feedback could be added here if needed
    };

    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    const displayAmount = selectedPlan ? selectedPlan.price_usd : "Amount";

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer ${selectedPlanId === plan.id
                            ? 'border-primary-500 bg-primary-50 shadow-2xl scale-[1.03] z-10'
                            : 'border-gray-100 bg-white hover:border-primary-200 shadow-sm'
                            }`}
                        onClick={() => onSelect?.(plan)}
                    >
                        {plan.name === 'Diamond' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg">
                                Best Results
                            </div>
                        )}

                        <div className="mb-6 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${plan.name === 'Diamond'
                                ? 'bg-secondary-100 text-secondary-600'
                                : 'bg-primary-100 text-primary-600'
                                }`}>
                                <Zap className={plan.name === 'Diamond' ? 'w-7 h-7 fill-secondary-500' : 'w-7 h-7 fill-primary-500'} />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 text-lg">{plan.name}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">Ad Boost</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-gray-900">KSh {plan.price_usd}</span>
                                <span className="text-gray-400 font-bold text-sm tracking-tight">/ {plan.duration_days} days</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-10">
                            {[
                                "Show at top of category",
                                "Show on landing page",
                                "Priority badge highlight",
                                plan.name === 'Diamond' ? "10x more reach guaranteed" : "Increase visibility",
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-600">
                                    <div className="mt-0.5 w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 text-green-600 stroke-[3]" />
                                    </div>
                                    <span className="leading-tight">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all ${selectedPlanId === plan.id
                                ? 'bg-primary-600 text-white shadow-primary-500/30'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect?.(plan);
                            }}
                        >
                            {selectedPlanId === plan.id ? 'Plan Selected' : 'Choose Plan'}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};
