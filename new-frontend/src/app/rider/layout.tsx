'use client';

import dynamic from 'next/dynamic';

const RiderHeader = dynamic(() => import('./RiderHeader'), { ssr: false });

export default function RiderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <RiderHeader />
            <main className="rider-main" style={{
                minHeight: 'calc(100vh - 70px)',
                background: '#f9fafb',
            }}>
                {children}
            </main>
        </>
    );
}
