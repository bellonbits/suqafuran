"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to shops browsing for classifieds marketplace
    router.push('/shops');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-center">
        <div className="animate-pulse">
          <div className="text-4xl font-black text-orange-600 mb-4">Loading...</div>
          <p className="text-gray-600 dark:text-slate-400">Redirecting to marketplace</p>
        </div>
      </div>
    </div>
  );
}
