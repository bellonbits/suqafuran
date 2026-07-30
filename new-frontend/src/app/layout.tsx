import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import { CacheBuster } from "@/components/shared/CacheBuster";
import { getThemeScript } from "@/lib/theme-script";

export const dynamicParams = false;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  userScalable: false,
  maximumScale: 1,
  minimumScale: 1,
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Suqafuran",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Theme detection script runs before React hydration to prevent flash */}
        <script
          dangerouslySetInnerHTML={{ __html: getThemeScript() }}
          suppressHydrationWarning
        />
      </head>
      <body className="antialiased bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0B132B] dark:text-[#F8FAFC] overflow-x-hidden">
        <CacheBuster />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
