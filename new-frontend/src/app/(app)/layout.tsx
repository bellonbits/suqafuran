import React, { Suspense } from "react";
import { Header } from "../../components/shared/Header";
import { BottomNav } from "../../components/shared/BottomNav";
import { Footer } from "../../components/shared/Footer";
import { AuthModal } from "../../components/shared/AuthModal";
import { RealtimeConnection } from "../../components/shared/RealtimeConnection";

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
        <Header />
        <div className="flex flex-1 min-w-0 bg-white dark:bg-slate-950">
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950">
            <main className="flex-1 bg-white dark:bg-slate-950">
              {children}
            </main>
            <Footer />
          </div>
        </div>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </div>
      <AuthModal />
      <RealtimeConnection />
    </>
  );
}
