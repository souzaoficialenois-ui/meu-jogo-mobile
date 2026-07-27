import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'App',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: "none" as any // Prevents the keyboard from pushing the webview up
    }
  }
};

export default config;
