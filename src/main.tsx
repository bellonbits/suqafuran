import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import { loadOverrides } from './i18n'
import App from './App.tsx'

// Load dynamic site content overrides from backend
loadOverrides();

import { registerSW } from 'virtual:pwa-register'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

registerSW({ immediate: true })

if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false })
  StatusBar.setStyle({ style: Style.Light })
  StatusBar.setBackgroundColor({ color: '#ffffff' })
}

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (Capacitor.isNativePlatform()) {
  // Hide splash after React paints; 500ms fallback ensures it never gets stuck
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      SplashScreen.hide({ fadeOutDuration: 300 })
    })
  })
  setTimeout(() => SplashScreen.hide({ fadeOutDuration: 300 }), 500)
}
