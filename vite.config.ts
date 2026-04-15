import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.suqafuran.com',
        changeOrigin: true,
        secure: true,
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
      includeAssets: ['suqafuran.svg'],
      workbox: {
        // Activate new SW as soon as it installs — don't wait for old tabs to close
        skipWaiting: true,
        clientsClaim: true,
        // Don't cache index.html inside the service worker — the .htaccess
        // already prevents the browser from caching it, and the SW should
        // always fetch a fresh copy from the network.
        navigateFallback: null,
        navigateFallbackDenylist: [/./],
        runtimeCaching: [],
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
            src: '/suqafuran.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
