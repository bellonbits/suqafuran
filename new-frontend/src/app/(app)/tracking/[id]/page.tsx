"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { MapPin, Bike, Clock, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, Phone } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function DeliveryTrackingPage({ params }: PageProps) {
    const { id } = use(params);
    const [eta, setEta] = useState(25);
    const [currentStep, setCurrentStep] = useState(2); // 1 = Placed, 2 = Preparing, 3 = On the way, 4 = Delivered
    const [riderCoords, setRiderCoords] = useState({ x: 80, y: 120 });

    // Simulate real-time rider movement coordinates and ETA countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setEta(prev => {
                if (prev <= 1) {
                    setCurrentStep(4);
                    return 0;
                }
                return prev - 1;
            });

            setRiderCoords(prev => {
                // Move rider closer to customer (coordinates x: 280, y: 220)
                const dx = (280 - prev.x) * 0.05;
                const dy = (220 - prev.y) * 0.05;
                return {
                    x: Math.round(prev.x + dx),
                    y: Math.round(prev.y + dy)
                };
            });
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    // Change status steps based on simulated ETA
    useEffect(() => {
        if (eta <= 15 && eta > 0) {
            setCurrentStep(3);
        }
    }, [eta]);

    const steps = [
        { title: 'Order Placed', desc: 'We have received your order request.' },
        { title: 'Preparing Item', desc: 'The seller is packaging your products.' },
        { title: 'Out for Delivery', desc: 'Rider is on the way to your location.' },
        { title: 'Delivered', desc: 'Enjoy your purchased items!' }
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 h-[calc(100vh-8rem)]">
            <div className="h-full rounded-[32px] overflow-hidden bg-white border border-gray-100 shadow-2xl dark:bg-slate-900 dark:border-slate-800 flex flex-col lg:flex-row">
                
                {/* Large Map Panel (Takes 60% width) */}
                <div className="flex-1 relative bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
                    {/* Simulated visual map grid */}
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(var(--color-primary-dark)_1px,transparent_1px)] bg-[size:24px_24px]" />
                    
                    {/* Simulated Road Lines SVG */}
                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        {/* Streets */}
                        <path d="M 50 100 L 500 100 M 50 250 L 500 250 M 150 50 L 150 350 M 350 50 L 350 350" stroke="#E2E8F0" strokeWidth="12" strokeLinecap="round" fill="none" className="dark:stroke-slate-800" />
                        
                        {/* Delivery Route line */}
                        <path d="M 80 120 L 150 120 L 150 220 L 280 220" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" strokeDasharray="8 6" fill="none" />
                        
                        {/* Shop Marker */}
                        <circle cx="80" cy="120" r="10" fill="#22C55E" />
                        <text x="75" y="105" fill="#22C55E" fontSize="9" fontWeight="900">Cub Grocery</text>

                        {/* Customer Delivery Marker */}
                        <circle cx="280" cy="220" r="10" fill="#EF4444" />
                        <text x="270" y="240" fill="#EF4444" fontSize="9" fontWeight="900">Your Location</text>

                        {/* Animated Rider icon */}
                        <g transform={`translate(${riderCoords.x - 12}, ${riderCoords.y - 12})`} className="transition-all duration-1000 ease-out">
                            <circle cx="12" cy="12" r="14" fill="#38BDF8" className="animate-ping opacity-35" />
                            <circle cx="12" cy="12" r="12" fill="#0EA5E9" />
                            <path d="M7 12h10M12 7l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    </svg>

                    {/* Rider Floating Stats Card */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-gray-100 p-4 rounded-2xl shadow-lg dark:bg-slate-900/90 dark:border-slate-800 flex gap-3 items-center">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary dark:bg-sky-500/10">
                            <Bike className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Assigned Rider</span>
                            <span className="text-xs font-black text-gray-900 dark:text-slate-100">Kidi (Fast Courier)</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-accent font-bold">Verified Carrier</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Details Panel (Takes 40% width) */}
                <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-100 p-6 flex flex-col justify-between bg-white dark:bg-slate-900 dark:border-slate-800">
                    
                    {/* Header ETA summary */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                            <div className="space-y-1">
                                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Estimated Delivery Time</span>
                                <h2 className="text-xl font-black text-gray-900 dark:text-slate-100 font-poppins flex items-center gap-1.5">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <span>{eta > 0 ? `${eta} mins` : 'Arrived!'}</span>
                                </h2>
                            </div>
                            <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">On Schedule</span>
                        </div>

                        {/* Order Tracking steps */}
                        <div className="space-y-6 pt-4">
                            {steps.map((step, idx) => {
                                const stepNum = idx + 1;
                                const isDone = currentStep >= stepNum;
                                const isCurrent = currentStep === stepNum;
                                return (
                                    <div key={idx} className="flex gap-4 items-start relative">
                                        {/* Connector Line */}
                                        {idx < steps.length - 1 && (
                                            <div className={`absolute left-3.5 top-7 bottom-[-20px] w-0.5 ${currentStep > stepNum ? 'bg-accent' : 'bg-gray-100 dark:bg-slate-800'}`} />
                                        )}
                                        {/* Step Circle */}
                                        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border-2 ${
                                            isDone ? 'bg-accent border-accent text-white' : 
                                            isCurrent ? 'bg-white border-primary text-primary dark:bg-slate-900' : 
                                            'bg-white border-gray-200 text-gray-400 dark:bg-slate-900 dark:border-slate-800'
                                        }`}>
                                            {isDone ? (
                                                <CheckCircle2 className="h-4.5 w-4.5" />
                                            ) : (
                                                <span className="text-xs font-black">{stepNum}</span>
                                            )}
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className={`text-xs font-black ${isDone ? 'text-gray-900 dark:text-slate-100' : 'text-gray-400'}`}>
                                                {step.title}
                                            </h4>
                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold leading-relaxed">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom courier contact */}
                    <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                        <Link 
                            href={`/messages?userId=201`}
                            className="btn-premium flex-1 bg-slate-50 border border-gray-200 text-gray-700 py-3 text-xs hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <span>Chat Rider</span>
                        </Link>
                        <a 
                            href="tel:+25261000000"
                            className="btn-premium flex-1 bg-accent text-white py-3 text-xs shadow-lg shadow-accent/20 hover:bg-green-600"
                        >
                            <Phone className="h-4 w-4" />
                            <span>Call Rider</span>
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}
