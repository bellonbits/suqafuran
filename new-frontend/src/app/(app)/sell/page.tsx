"use client";

import { useAuthStore } from '../../../store/useAuth';
import { useAuthModal } from '../../../store/useAuthModal';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ListingWizard } from '../../../components/features/ListingWizard';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SellPage() {
  const { isAuthenticated } = useAuthStore();
  const openAuthModal = useAuthModal((s) => s.open);
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-[#e0f7ff] dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-[#5bc0e8] dark:text-[#6cd4ff]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign In to Sell
          </h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            You need to be signed in to post listings. Create an account or log in to get started!
          </p>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openAuthModal('signin')}
              className="flex-1 py-3 px-4 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              Sign In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openAuthModal('signup')}
              className="flex-1 py-3 px-4 rounded-lg bg-[#5bc0e8] hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              Sign Up
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <ListingWizard />;
}
