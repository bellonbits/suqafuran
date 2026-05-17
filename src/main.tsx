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
  const isAndroid = Capacitor.getPlatform() === 'android';
  
  // Detect Android version from User Agent
  let androidVersion = 0;
  if (isAndroid) {
    const ua = window.navigator.userAgent;
    const match = ua.match(/Android\s([0-9]+)/);
    if (match) {
      androidVersion = parseInt(match[1], 10);
    }
  }

  // On Android 15+ (API 35+), edge-to-edge is enforced by default.
  // We avoid setting overlay to false or styling the background color to prevent
  // conflicts with Android 15's native edge-to-edge display and status bar deprecations.
  if (isAndroid && androidVersion >= 15) {
    StatusBar.setStyle({ style: Style.Light });
  } else {
    // iOS and older Android versions (< 15)
    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setStyle({ style: Style.Light });
    StatusBar.setBackgroundColor({ color: '#ffffff' });
  }

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
