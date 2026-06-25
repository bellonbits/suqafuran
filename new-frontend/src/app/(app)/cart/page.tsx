"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../../store/useCart';
import { useCurrencyStore } from '../../../store/useCurrency';
import { convertPrice, formatConvertedPrice, formatAmount } from '../../../lib/currency';

export default function CartPage() {
    const { items, setQuantity, removeFromCart, clearCart } = useCartStore();
    const displayCurrency = useCurrencyStore((s) => s.currency);

    const total = items.reduce((sum, item) => sum + convertPrice(item.price, item.currency, displayCurrency) * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    if (items.length === 0) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 text-center space-y-4">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto" />
                <h1 className="text-xl font-black text-gray-900 dark:text-slate-100 font-poppins">Your cart is empty</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-semibold">Items you add from listings will show up here.</p>
                <Link href="/" className="btn-premium inline-flex bg-primary text-white px-6 py-3 text-sm shadow-md shadow-primary/20 hover:bg-primary-dark">
                    Start Browsing
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 font-poppins">Your Cart ({itemCount})</h1>
                <button onClick={clearCart} className="text-xs font-bold text-gray-400 hover:text-red-500 cursor-pointer">
                    Clear cart
                </button>
            </div>

            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800">
                        <Link href={`/listing/${item.id}`} className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                            {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-300"><ShoppingCart className="h-5 w-5" /></div>
                            )}
                        </Link>

                        <div className="flex-1 min-w-0">
                            <Link href={`/listing/${item.id}`} className="text-sm font-bold text-gray-900 dark:text-slate-100 hover:text-primary truncate block">
                                {item.name}
                            </Link>
                            <p className="text-xs text-gray-400 font-semibold mt-0.5">
                                {formatConvertedPrice(item.price, item.currency, displayCurrency)} each
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setQuantity(item.id, item.quantity - 1)}
                                className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                                <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-black text-gray-900 dark:text-slate-100 w-5 text-center">{item.quantity}</span>
                            <button
                                onClick={() => setQuantity(item.id, item.quantity + 1)}
                                className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                                <Plus className="h-3 w-3" />
                            </button>
                        </div>

                        <div className="text-right shrink-0 w-20">
                            <p className="text-sm font-black text-gray-900 dark:text-slate-100">
                                {formatConvertedPrice(item.price * item.quantity, item.currency, displayCurrency)}
                            </p>
                        </div>

                        <button
                            onClick={() => removeFromCart(item.id)}
                            aria-label="Remove item"
                            className="shrink-0 p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-sm font-bold text-gray-700 dark:text-slate-300">
                    <span>Estimated total</span>
                    <span className="text-lg font-black text-gray-900 dark:text-slate-100">{formatAmount(total, displayCurrency)}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Suqafuran connects you directly with each seller — open an item below to confirm quantity, delivery location, and place your order with that seller.
                </p>
            </div>

            <div className="space-y-2">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={`/listing/${item.id}`}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-gray-100 dark:bg-slate-900 dark:border-slate-800 hover:border-primary transition-colors"
                    >
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300 truncate">Order &quot;{item.name}&quot; from seller</span>
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
