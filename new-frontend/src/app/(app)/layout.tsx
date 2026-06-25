import React, { Suspense } from "react";
import { Header } from "../../components/shared/Header";
import { Sidebar } from "../../components/shared/Sidebar";
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
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 content-bottom-safe">
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
