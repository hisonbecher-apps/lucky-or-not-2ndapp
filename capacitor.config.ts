import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hisongamez.luckyornot',
  appName: 'Lucky or Not',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-7554968857567124~9989933717'
    }
  }
};

export default config;
