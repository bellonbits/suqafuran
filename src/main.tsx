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
registerSW({ immediate: true })

if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false })
  StatusBar.setStyle({ style: Style.Light })
  StatusBar.setBackgroundColor({ color: '#ffffff' })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
