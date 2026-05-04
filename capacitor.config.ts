import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fahem.egypt',
  appName: 'Fahem Egypt',
  webDir: 'public',
  bundledWebRuntime: false,
  server: {
    url: 'https://fahem-dpmnkkpzf-123456s-projects-1468ee16.vercel.app',
    cleartext: true
  }
};

export default config;
