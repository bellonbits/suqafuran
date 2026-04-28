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
import { App as CapApp } from '@capacitor/app'

registerSW({ immediate: true })

if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false })
  StatusBar.setStyle({ style: Style.Light })
  StatusBar.setBackgroundColor({ color: '#ffffff' })

  // Handle Android hardware back button — go back in history, don't exit
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      CapApp.minimizeApp()
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
