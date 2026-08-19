import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spinwheel.event',
  appName: 'Spin Wheel',
  webDir: 'dist',
  android: {
    // Allow localhost WebView to load all content
    allowMixedContent: true
  }
};

export default config;
