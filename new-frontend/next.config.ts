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
};

module.exports = nextConfig;
