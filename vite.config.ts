import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'https://api.suqafuran.com',
        changeOrigin: true,
        secure: false, // Set to false to allow local/VM certs or mismatched hostnames
      },
    },
  },
  build: {
    outDir: 'dist',
    // Content-hash every chunk and asset file — guarantees browsers fetch
    // fresh files after each deploy (no manual cache busting needed)
    rollupOptions: {
      output: {
        entryFileNames:  'assets/[name]-[hash].js',
        chunkFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
        // Split heavy dependencies into separate cached chunks
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core React runtime — almost never changes, cache it forever
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Tanstack Query — separate chunk so UI updates don't bust it
            if (id.includes('@tanstack')) {
              return 'vendor-query';
            }
            // i18n — language files, rarely change
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            // Everything else from node_modules
            return 'vendor';
          }
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'autoUpdate' — new service worker installs and takes over immediately
      // on next navigation after a deploy, without requiring a user prompt.
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'favicon.ico', 'favicon.png', 'favicon-192.png', 'pwa-icon-192.png', 'pwa-icon-512.png'],
      workbox: {
        // Activate new SW as soon as it installs — don't wait for old tabs to close
        skipWaiting: true,
        clientsClaim: true,
        // Don't cache index.html inside the service worker — the .htaccess
        // already prevents the browser from caching it, and the SW should
        // always fetch a fresh copy from the network.
        navigateFallback: null,
        navigateFallbackDenylist: [/./],
        runtimeCaching: [
          {
            // ── Cloudinary images: cache 7 days, show stale while fetching new ──
            urlPattern: /res\.cloudinary\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // ── Local backend images: cache 3 days ──
            urlPattern: /\/api\/v1\/listings\/images\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'local-listing-images',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 3 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // ── Product listing API: serve stale data instantly, refresh in bg ──
            urlPattern: /\/api\/v1\/listings/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-listings',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // ── Google Fonts: cache-first forever ──
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Suqafuran',
        short_name: 'Suqafuran',
        description: 'The modern marketplace for Somalia',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
