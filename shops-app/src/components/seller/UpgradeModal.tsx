'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: number;
  name: string;
  display_name: string;
  monthly_price: number;
  annual_price: number;
  trial_days: number;
  features: Record<string, any>;
}

interface UpgradeModalProps {
  sellerId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ sellerId, isOpen, onClose }: UpgradeModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'annual'>('monthly');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get('/subscriptions/plans');
        console.log('Fetched plans:', response.data);
        setPlans(response.data);
        // Select Starter plan (has 7-day trial)
        const starterPlan = response.data.find((p: Plan) =>
          p.name === 'starter' || (p.name === 'pro' && p.trial_days > 0)
        );
        console.log('Selected plan:', starterPlan);
        if (starterPlan) {
          setSelectedPlan(starterPlan);
          setShowPaymentForm(false);  // Reset to show trial buttons
          console.log('Plan selected with trial_days:', starterPlan.trial_days);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subscription plans',
          variant: 'destructive',
        });
      } finally {
        setPlansLoading(false);
      }
    };

    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen, toast]);

  const handleStartTrial = async () => {
    if (!selectedPlan) {
      toast({
        title: 'Select a Plan',
        description: 'Please select a plan to start the free trial',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/subscriptions/sellers/${sellerId}/start-trial`, {
        plan_id: selectedPlan.id,
      });

      toast({
        title: 'Trial Started!',
        description: `${selectedPlan.display_name} trial activated for ${selectedPlan.trial_days} days`,
        variant: 'default',
      });

      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to start trial',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan || !phoneNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please select a plan and enter your phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/subscriptions/sellers/${sellerId}/upgrade`, {
        plan_id: selectedPlan.id,
        billing_frequency: billingFrequency,
        phone_number: phoneNumber,
      });

      if (response.data.status === 'payment_initiated') {
        toast({
          title: 'Payment Initiated',
          description: 'Check your phone for M-Pesa prompt. Enter your PIN to confirm.',
          variant: 'default',
        });
        onClose();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const price = billingFrequency === 'monthly'
    ? selectedPlan?.monthly_price
    : selectedPlan?.annual_price;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[88vh] bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col min-h-0 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-4.5 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Upgrade Your Shop</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Choose a plan to expand product capacity and boost seller ranking</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-xl font-bold cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {/* Plans Comparison */}
          {!plansLoading && (
            <div className="space-y-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const isFree = plan.name === 'free';
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowPaymentForm(false);
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-slate-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{plan.display_name}</h3>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                          {plan.features.max_products
                            ? `Up to ${plan.features.max_products} active products`
                            : 'Unlimited marketplace products'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                          {isFree ? 'Free' : `KSh ${plan.monthly_price.toLocaleString()}`}
                        </p>
                        {!isFree && <p className="text-[11px] text-slate-400 dark:text-neutral-500">/month</p>}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800 text-xs font-semibold">
                      {plan.features.has_analytics && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <span>✓</span> Analytics &amp; Visitor Stats
                        </div>
                      )}
                      {plan.features.has_verified_badge && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <span>✓</span> Verified Trust Badge
                        </div>
                      )}
                      {plan.features.has_priority_ranking && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <span>✓</span> Priority Search Ranking
                        </div>
                      )}
                      {plan.features.has_bulk_import && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <span>✓</span> CSV Bulk Product Import
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Billing Frequency */}
          {selectedPlan && selectedPlan.name !== 'free' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-200/80 dark:border-neutral-700/80 space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                Billing Cycle
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-slate-800 dark:text-neutral-200">
                  <input
                    type="radio"
                    value="monthly"
                    checked={billingFrequency === 'monthly'}
                    onChange={(e) => setBillingFrequency(e.target.value as 'monthly' | 'annual')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Monthly (KSh {selectedPlan.monthly_price.toLocaleString()})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-slate-800 dark:text-neutral-200">
                  <input
                    type="radio"
                    value="annual"
                    checked={billingFrequency === 'annual'}
                    onChange={(e) => setBillingFrequency(e.target.value as 'monthly' | 'annual')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Annual (KSh {selectedPlan.annual_price.toLocaleString()})</span>
                </label>
              </div>
            </div>
          )}

          {/* Trial Info */}
          {selectedPlan && selectedPlan.trial_days > 0 && !showPaymentForm && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-3.5">
              <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-bold flex items-center gap-1.5">
                <span>🎉</span> Free {selectedPlan.trial_days}-day trial included!
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                Explore all verified features risk-free with zero commitment.
              </p>
            </div>
          )}

          {/* Phone Number Input - only show when paying */}
          {selectedPlan && selectedPlan.name !== 'free' && showPaymentForm && (
            <div className="space-y-2 p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
              <label htmlFor="phone" className="block text-xs font-bold text-slate-700 dark:text-neutral-200">
                M-Pesa Phone Number for Instant STK Push
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="0712345678 or 254712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                You will receive a prompt on your phone to enter your M-Pesa PIN.
              </p>
            </div>
          )}
        </div>

        {/* Pinned Sticky Footer - Always Visible! */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 block leading-none">
              Selected Plan
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
              {selectedPlan?.display_name || 'Free Plan'}
              {selectedPlan && selectedPlan.name !== 'free' && (
                <span className="text-blue-600 dark:text-blue-400 ml-1.5 font-black">
                  • KSh {price?.toLocaleString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl h-10 px-4 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 border border-slate-300 dark:border-neutral-700 shadow-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {selectedPlan && selectedPlan.trial_days > 0 && !showPaymentForm ? (
              <>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-3.5 text-xs font-bold shadow-xs cursor-pointer"
                  onClick={handleStartTrial}
                  disabled={loading}
                >
                  {loading ? 'Starting...' : 'Start Free Trial'}
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-3.5 text-xs font-bold shadow-xs cursor-pointer"
                  onClick={() => setShowPaymentForm(true)}
                  disabled={loading}
                >
                  Pay Now
                </Button>
              </>
            ) : showPaymentForm && selectedPlan ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="rounded-xl h-10 px-4 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 border border-slate-300 dark:border-neutral-700 shadow-xs transition-colors cursor-pointer"
                >
                  Back
                </button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 text-xs font-bold shadow-xs cursor-pointer"
                  onClick={handleUpgrade}
                  disabled={loading || !phoneNumber}
                >
                  {loading ? 'Processing...' : `Pay KSh ${price?.toLocaleString()}`}
                </Button>
              </>
            ) : selectedPlan && selectedPlan.name !== 'free' ? (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 text-xs font-bold shadow-xs cursor-pointer"
                onClick={handleUpgrade}
                disabled={loading || !phoneNumber}
              >
                {loading ? 'Processing...' : `Pay KSh ${price?.toLocaleString()}`}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
