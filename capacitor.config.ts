import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suqafuran.app',
  appName: 'Suqafuran',
  webDir: 'new-frontend/public',
  server: {
    url: 'https://suqafuran.com', // Production frontend server
    androidScheme: 'https',
    iosScheme: 'https',
  },
  // Mobile app is for sellers and buyers only - no admin/agent access
  // Admin/agent dashboards are web-only and will be redirected on mobile
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#ffffff',
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    StatusBar: {
      style: 'default',
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
      fadeOutDuration: 0,
    },
  },
};

export default config;
