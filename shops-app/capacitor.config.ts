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
      launchShowDuration: 500,
      autoHide: true,
      fadeOutDuration: 300,
      showSpinner: false,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'centerInside',
      splashImmersive: false,
    },
  },
};

export default config;
