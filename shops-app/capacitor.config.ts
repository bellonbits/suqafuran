import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suqafuran.app',
  appName: 'Suqafuran',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      autoHide: true,
      fadeOutDuration: 0,
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'centerCrop',
      splashImmersive: false,
    },
  },
};

export default config;
