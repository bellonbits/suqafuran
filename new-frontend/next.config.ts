import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Experimental performance features
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    esmExternals: true,
  },

  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:8000/api/v1/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
