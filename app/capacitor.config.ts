import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cloud.collection.app',
  appName: 'cloud collection',
  webDir: 'dist',
  server: {
    allowNavigation: ['106.14.148.230:8000', 'cloudcollection.online'],
  },
  ios: {
    scrollEnabled: false,
    contentInset: 'never',
  },
};

export default config;
