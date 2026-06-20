"use client";

import React, { useState } from 'react';
import { X, CheckCircle2, ShoppingBag, Loader2, MapPin } from 'lucide-react';
import type { Listing } from '../../types';

interface OrderModalProps {
    listing: Listing;
    isOpen: boolean;
    onClose: () => void;
    onSubmitOrder: (orderDetails: { quantity: number; location: string; notes: string }) => Promise<void>;
}

export const OrderModal: React.FC<OrderModalProps> = ({ listing, isOpen, onClose, onSubmitOrder }) => {
    const [quantity, setQuantity] = useState(1);
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmitOrder({ quantity, location, notes });
            setIsSuccess(true);
        } catch (err) {
            console.error('Order placement failed', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div 
                className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 animate-scale-in border border-gray-100 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-black text-gray-900 dark:text-slate-100">
                            {isSuccess ? 'Order Placed!' : 'Place Your Order'}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-400 hover:bg-slate-50 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {isSuccess ? (
                    /* Success Layout */
                    <div className="p-8 text-center flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-accent/10 text-accent flex items-center justify-center animate-bounce">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                                Order Successfully Created!
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium px-4">
                                Your order for <strong className="text-gray-900 dark:text-slate-100">{listing.title_en}</strong> has been shared with the seller. They will contact you shortly to coordinate delivery.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setIsSuccess(false);
                                onClose();
                            }}
                            className="btn-premium w-full mt-4 bg-primary text-white py-3 shadow-lg shadow-primary/20 hover:bg-primary-dark"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    /* Order Details Form */
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Summary */}
                        <div className="flex gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                            <img 
                                src={listing.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop'} 
                                alt={listing.title_en} 
                                className="h-16 w-16 rounded-xl object-cover shrink-0"
                            />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 line-clamp-1">{listing.title_en}</h4>
                                <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold">{listing.condition || 'New'}</p>
                                <p className="text-sm font-black text-primary dark:text-sky-400">
                                    {listing.currency || 'USD'} {Number(listing.price).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Quantity inputs */}
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-bold text-gray-700 dark:text-slate-300">Quantity</span>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">Select items to buy</p>
                            </div>
                            <div className="flex items-center gap-3 border border-gray-200 dark:border-slate-800 rounded-2xl p-1 bg-slate-50 dark:bg-slate-950">
                                <button
                                    type="button"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="h-8 w-8 rounded-xl bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 shadow-sm flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer"
                                >
                                    -
                                </button>
                                <span className="w-6 text-center text-sm font-black text-gray-900 dark:text-slate-100">{quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="h-8 w-8 rounded-xl bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 shadow-sm flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Location details */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>Delivery Location</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Enter street name, building, apartment or city..."
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">
                                Notes (Optional)
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Enter any instructions for delivery or contact details..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 resize-none"
                            />
                        </div>

                        {/* Submit Action buttons */}
                        <div className="pt-2 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-premium flex-1 bg-slate-50 border border-gray-200 text-gray-600 py-3 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !location.trim()}
                                className="btn-premium flex-1 bg-accent text-white py-3 shadow-lg shadow-accent/20 hover:bg-green-600 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <span>Submit Order</span>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
