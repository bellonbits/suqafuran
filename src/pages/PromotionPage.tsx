import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { listingService } from '../services/listingService';
import { Button } from '../components/Button';
import { Check, Loader2, Phone, Smartphone } from 'lucide-react';
import { BoostPricingGrid } from '../components/BoostPricingGrid';

const PromotionPage: React.FC = () => {
    const { adId } = useParams<{ adId: string }>();
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [paymentPhone, setPaymentPhone] = useState('');
    const [step, setStep] = useState<'plan' | 'payment' | 'success'>('plan');
    const [error, setError] = useState<string | null>(null);
    const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

    // Fetch Ad Details
    const { isLoading: adLoading } = useQuery({
        queryKey: ['ad', adId],
        queryFn: () => listingService.getListing(Number(adId)),
        enabled: !!adId,
    });

    // Fetch Plans
    const { data: plans, isLoading: plansLoading } = useQuery({
        queryKey: ['promotion-plans'],
        queryFn: listingService.getPromotionPlans,
    });

    // Create Order Mutation
    const createOrderMutation = useMutation({
        mutationFn: (data: { planWithId: number, phone: string }) =>
            listingService.createPromotionOrder({
                listing_id: Number(adId),
                plan_id: data.planWithId,
                payment_phone: data.phone
            }),
        onSuccess: (data) => {
            setActiveOrderId(data.id);
            setStep('payment');
            setError(null);
        },
        onError: (err: any) => {
            setError(err.response?.data?.detail || 'Failed to create promotion order');
        }
    });


    // Polling Logic
    useEffect(() => {
        let interval: any;
        if (step === 'payment' && activeOrderId) {
            interval = setInterval(async () => {
                try {
                    const res = await listingService.checkPromotionStatus(activeOrderId);
                    // Check for PAID status or APPROVED
                    if (res.status === 'paid' || res.status === 'approved' || res.status === 'APPROVED' || res.status === 'PAID') {
                        setStep('success');
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error('Polling error', err);
                }
            }, 3000); // Check every 3 seconds
        }
        return () => clearInterval(interval);
    }, [step, activeOrderId]);


    if (adLoading || plansLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
        );
    }

    const handleConfirmPlan = () => {
        if (selectedPlan && paymentPhone) {
            // Basic validation
            if (paymentPhone.length < 5) {
                setError("Please enter a valid phone number");
                return;
            }
            createOrderMutation.mutate({ planWithId: selectedPlan.id, phone: paymentPhone });
        }
    };


    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Promote Your Ad</h1>
                <p className="text-gray-500">Reach more buyers and sell faster with automated boosts.</p>
            </div>

            {step === 'plan' ? (
                <div className="space-y-8">
                    <BoostPricingGrid
                        plans={plans || []}
                        onSelect={setSelectedPlan}
                        selectedPlanId={selectedPlan?.id}
                        showInstructions={false}
                    />

                    {selectedPlan && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-md mx-auto p-6 bg-white rounded-3xl shadow-lg border border-primary-100"
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Phone Number</h3>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Phone className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        placeholder="e.g. 07xxxxxxxx"
                                        className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                                        value={paymentPhone}
                                        onChange={(e) => setPaymentPhone(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-gray-400">
                                    Enter the number you will pay from. Our system automatically detects the payment.
                                </p>

                                <Button
                                    className="w-full h-12 rounded-xl bg-primary-600 font-bold shadow-primary-500/30 shadow-lg hover:shadow-xl transition-all"
                                    onClick={handleConfirmPlan}
                                    disabled={!paymentPhone || createOrderMutation.isPending}
                                    isLoading={createOrderMutation.isPending}
                                >
                                    Proceed to Automated Payment
                                </Button>
                            </div>
                            {error && <p className="mt-4 text-sm text-red-500 text-center bg-red-50 p-2 rounded-lg">{error}</p>}
                        </motion.div>
                    )}
                </div>
            ) : step === 'payment' ? (
                <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-green-600 to-green-500 p-8 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="w-64 h-64 bg-white rounded-full absolute -top-16 -right-16" />
                        </div>
                        <motion.div
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                            className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10"
                        >
                            <Smartphone className="w-8 h-8 text-white" />
                        </motion.div>
                        <h2 className="text-2xl font-bold mb-1 relative z-10">Check your phone 📱</h2>
                        <p className="text-green-100 text-sm relative z-10">
                            An M-Pesa prompt has been sent to
                        </p>
                        <p className="text-white font-bold text-lg relative z-10">{paymentPhone}</p>
                    </div>

                    <div className="p-8 space-y-5">
                        {/* Amount */}
                        <div className="text-center">
                            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Amount to Pay</p>
                            <h3 className="text-4xl font-black text-gray-900">
                                KES {selectedPlan?.price_usd}
                            </h3>
                        </div>

                        {/* Steps */}
                        <div className="bg-green-50 rounded-2xl p-5 border border-green-100 space-y-3">
                            <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">How to complete payment</p>
                            {[
                                'A payment prompt appeared on your phone',
                                'Enter your M-Pesa PIN to confirm',
                                'This screen updates automatically 🎉'
                            ].map((step, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium">{step}</p>
                                </div>
                            ))}
                        </div>

                        {/* Polling indicator */}
                        <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-xl text-blue-700 text-xs border border-blue-100">
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            <p>Waiting for your payment confirmation…</p>
                        </div>

                        {/* Back */}
                        <button
                            onClick={() => setStep('plan')}
                            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
                        >
                            ← Back to Plans
                        </button>
                    </div>
                </div>

            ) : (
                <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <Check className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Received!</h2>
                    <p className="text-gray-500 mb-8">Your ad has been successfully promoted. Enjoy the extra visibility!</p>
                    <Button
                        className="w-full h-12 rounded-xl bg-primary-600 font-bold text-lg"
                        onClick={() => navigate('/dashboard')}
                    >
                        Go to Dashboard
                    </Button>
                </div>
            )}
        </div>
    );
};

export { PromotionPage };
