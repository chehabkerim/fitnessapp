import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Plus Ultra',
  slug: 'plus-ultra',
  scheme: 'plusultra',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0E0E10',
  ios: { supportsTablet: false, bundleIdentifier: 'app.plusultra.tracker' },
  android: {
    package: 'app.plusultra.tracker',
    adaptiveIcon: {
      backgroundColor: '#8E48C0', // brand purple, as in design/plus-ultra/app-icon.svg
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    // The single-file preview (`npm run build:preview`) is a client-rendered page; the real site is static.
    output: process.env.PLUS_ULTRA_PREVIEW === '1' ? 'single' : 'static',
    favicon: './assets/favicon.png',
    name: 'Plus Ultra',
    shortName: 'Plus Ultra',
    themeColor: '#0E0E10',
    backgroundColor: '#0E0E10',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png', // the two-tone wordmark (Neon accent; the app is always dark)
        imageWidth: 220,
        backgroundColor: '#0E0E10',
      },
    ],
    'expo-font',
    'expo-sqlite',
    ['expo-notifications', { color: '#39FF14' }],
  ],
  experiments: { typedRoutes: true },
};

export default config;
