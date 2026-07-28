import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import { CacheBuster } from "@/components/shared/CacheBuster";

export const dynamicParams = false;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Suqafuran - Africa's Marketplace",
  description: "Buy, sell, track orders, and chat directly with verified sellers across Africa on Suqafuran.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0B132B] dark:text-[#F8FAFC] overflow-x-hidden">
        <CacheBuster />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
