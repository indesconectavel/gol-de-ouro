import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goldeouro.app',
  appName: 'Gol de Ouro',
  webDir: 'dist',
  server: {
    url: 'https://goldeouro.lol',
    cleartext: false
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
