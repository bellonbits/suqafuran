import { ReactNode } from 'react';

export const metadata = {
  title: 'Driver - Suqafuran Express',
  description: 'Driver delivery app',
};

export default function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {children}
    </div>
  );
}
