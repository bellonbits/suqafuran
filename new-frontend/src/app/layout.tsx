import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { Header } from "../components/shared/Header";
import { Sidebar } from "../components/shared/Sidebar";
import { BottomNav } from "../components/shared/BottomNav";
import { Footer } from "../components/shared/Footer";

export const metadata: Metadata = {
  title: "Suqafuran - Africa's Marketplace",
  description: "Buy, sell, track orders, and chat directly with sellers across Africa on Suqafuran.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0B132B] dark:text-[#F8FAFC]">
        <Providers>
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
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
