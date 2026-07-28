/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Capacitor, we use a web server approach
  // The .next/standalone folder can be served via a local HTTP server
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

  // HTTP headers with CSP
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://fonts.googleapis.com https://translate.googleapis.com https://translate-pa.googleapis.com https://res.cloudinary.com https://api.suqafuran.com https://*.suqafuran.com; img-src 'self' data: https:; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
