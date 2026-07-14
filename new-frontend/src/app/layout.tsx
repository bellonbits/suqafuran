import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Suqafuran - Africa's Marketplace",
  description: "Buy, sell, track orders, and chat directly with verified sellers across Africa on Suqafuran.",
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
