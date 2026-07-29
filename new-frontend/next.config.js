/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false,

  // Performance optimizations
  productionBrowserSourceMaps: false,
  compress: true,

  images: {
    qualities: [50, 75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dyyo8cnqc/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
    ],
    unoptimized: true, // Required for static export
  },

  // Experimental performance features
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    esmExternals: true,
  },

  // HTTP headers with CSP and cache-busting
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Force no-cache on all responses to prevent old site caching
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          // Pragma for HTTP/1.0 compatibility
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          // Expires immediately
          {
            key: 'Expires',
            value: '0',
          },
          // Prevent CDN caching of old content
          {
            key: 'X-Vercel-Cache-Control',
            value: 'max-age=0',
          },
          // Force revalidation
          {
            key: 'ETag',
            value: 'W/"vercel-suqafuran-' + Date.now() + '"',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://fonts.googleapis.com https://translate.googleapis.com https://translate-pa.googleapis.com https://res.cloudinary.com https://api.suqafuran.com https://*.suqafuran.com; img-src 'self' data: https:; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
          // Prevent loading in iframe
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Enable XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // More aggressive caching rules for static assets
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
