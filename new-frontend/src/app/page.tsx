'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ShopsPage = dynamic(() => import('@/app/(app)/shops/page').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading marketplace...</p>
      </div>
    </div>
  )
});

export default function RootPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    }>
      <ShopsPage />
    </Suspense>
  );
}
