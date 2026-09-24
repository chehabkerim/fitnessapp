import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Plus Ultra',
  slug: 'plus-ultra',
  scheme: 'plusultra',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#0E0E10',
  ios: { supportsTablet: false, bundleIdentifier: 'app.plusultra.tracker' },
  android: {
    package: 'app.plusultra.tracker',
    adaptiveIcon: {
      backgroundColor: '#0E0E10',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    output: 'static',
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
        image: './assets/splash-icon.png',
        imageWidth: 120,
        backgroundColor: '#0E0E10',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#0E0E10' },
      },
    ],
    'expo-font',
    'expo-sqlite',
    ['expo-notifications', { color: '#39FF14' }],
  ],
  experiments: { typedRoutes: true },
};

export default config;
