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
      // 'prompt' — shows users a "New version available, refresh?" banner
      // instead of silently serving old cached assets
      registerType: 'prompt',
      includeAssets: ['suqafuran.svg'],
      workbox: {
        // Don't let the service worker cache index.html
        navigateFallbackDenylist: [],
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
