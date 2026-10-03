import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: isDev ? 'com.whoosh.app.debug' : 'com.whoosh.app',
  appName: isDev ? 'WHOOSH DEBUG' : 'WHOOSH',
  webDir: 'dist',
  server: isDev ? {
    url: 'http://10.113.94.157:3000',
    cleartext: true,
    androidScheme: 'https'
  } : undefined,
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDev ? true : false
  }
};

export default config;
