import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Plus Ultra',
  slug: 'plus-ultra',
  scheme: 'plusultra',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#F6F1EA',
  ios: { supportsTablet: false, bundleIdentifier: 'app.plusultra.tracker' },
  android: {
    package: 'app.plusultra.tracker',
    adaptiveIcon: {
      backgroundColor: '#C4623F',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    output: 'static',
    favicon: './assets/favicon.png',
    name: 'Plus Ultra',
    shortName: 'Plus Ultra',
    themeColor: '#F6F1EA',
    backgroundColor: '#F6F1EA',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 120,
        backgroundColor: '#F6F1EA',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#1A1512' },
      },
    ],
    'expo-font',
    'expo-sqlite',
    ['expo-notifications', { color: '#C4623F' }],
  ],
  experiments: { typedRoutes: true },
};

export default config;
