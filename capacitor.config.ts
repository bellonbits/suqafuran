import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suqafuran.app',
  appName: 'Suqafuran',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
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
      launchShowDuration: 2000,
      backgroundColor: '#7dcce9',
      showSpinner: false,
    },
  },
};

export default config;
