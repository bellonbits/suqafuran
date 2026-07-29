'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Only redirect in production
    if (process.env.NODE_ENV === 'production') {
      router.replace('/shops');
    }
  }, [router]);

  // In development, show home page
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Suqafuran</h1>
          <p className="text-gray-600 mb-8">Welcome to the marketplace</p>
          <div className="space-y-4">
            <a
              href="/shops"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Shops
            </a>
            <p className="text-sm text-gray-500 mt-4">
              (Development mode - no auto-redirect)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
