"use client";

import React from 'react';
import { useAuthStore } from '@/store/useAuth';
import { useAuthModal } from '@/store/useAuthModal';
import { ListingWizard } from '@/components/features/ListingWizard';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PostAdPage() {
    const { isAuthenticated, isHydrated } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const navigate = useNavigate();

    if (isHydrated && !isAuthenticated) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center space-y-4">
                <p className="font-bold text-gray-500">Sign in to post an ad.</p>
                <button
                    onClick={() => openAuthModal('signin')}
                    className="text-primary font-black hover:underline cursor-pointer"
                >
                    Sign In
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-8">
            <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors mb-4 shadow-xs"
                aria-label="Back"
            >
                <ArrowLeft size={18} />
            </button>
            <ListingWizard />
        </div>
    );
}
