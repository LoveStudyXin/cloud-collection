import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cloud.collection.app',
  appName: 'cloud collection',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,  // 原生 HTTP，绕过 WebView CORS 限制
    },
  },
  server: {
    allowNavigation: ['106.14.148.230:8000', 'cloudcollection.online'],
    androidScheme: 'http',
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    scrollEnabled: false,
    contentInset: 'never',
  },
};

export default config;
