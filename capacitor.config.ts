import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suqafuran.app',
  appName: 'Suqafuran',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0ea5e9',
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    StatusBar: {
      style: 'default',
      backgroundColor: '#7dcce9',
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0ea5e9',
      showSpinner: false,
      fadeOutDuration: 300,
    },
  },
};

export default config;
