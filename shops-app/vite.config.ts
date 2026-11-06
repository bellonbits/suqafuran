import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const now = new Date()
const buildTimeIso = now.toISOString()
const buildTimeFormatted = now.toLocaleString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZone: 'Africa/Nairobi'
})

// Auto-generate public/version.json with the exact build/modified time
try {
  const versionData = {
    version: '1.0.0',
    buildTime: buildTimeIso,
    buildTimeFormatted: `${buildTimeFormatted} EAT`,
    lastModified: `${buildTimeFormatted} EAT`,
    timestamp: now.getTime()
  }
  const publicDir = path.resolve(import.meta.dirname, './public')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify(versionData, null, 2))
} catch (e) {
  console.error('Could not write version.json:', e)
}

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTimeIso),
    __BUILD_TIME_FORMATTED__: JSON.stringify(`${buildTimeFormatted} EAT`),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTimeIso),
    'import.meta.env.VITE_BUILD_TIME_FORMATTED': JSON.stringify(`${buildTimeFormatted} EAT`),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'next/link': path.resolve(import.meta.dirname, './src/shims/next-link.tsx'),
      'next/navigation': path.resolve(import.meta.dirname, './src/shims/next-navigation.ts'),
      'next/image': path.resolve(import.meta.dirname, './src/shims/next-image.tsx'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
