// Import individual weights so only these nine font files ship.
import { Barlow_400Regular } from '@expo-google-fonts/barlow/400Regular';
import { Barlow_500Medium } from '@expo-google-fonts/barlow/500Medium';
import { Barlow_600SemiBold } from '@expo-google-fonts/barlow/600SemiBold';
import { Barlow_700Bold } from '@expo-google-fonts/barlow/700Bold';
import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed/600SemiBold';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { BarlowCondensed_700Bold_Italic } from '@expo-google-fonts/barlow-condensed/700Bold_Italic';
import { BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed/800ExtraBold';
import { BarlowCondensed_800ExtraBold_Italic } from '@expo-google-fonts/barlow-condensed/800ExtraBold_Italic';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DbGate, useLive } from '@/db';
import { applyShellColors, registerServiceWorker } from '@/platform/shell';
import { layout, ThemeProvider, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_700Bold_Italic,
    BarlowCondensed_800ExtraBold,
    BarlowCondensed_800ExtraBold_Italic,
  });

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);
  useEffect(() => registerServiceWorker(), []);

  if (!loaded && !error) return null;
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Shell>
            <DbGate>
              <ThemeSync />
              <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="workout/active" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="workout/summary" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="exercise/edit" options={{ presentation: 'modal' }} />
              </Stack>
            </DbGate>
          </Shell>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Centred app column (max 560px) on the warm background; phone-first. */
function Shell({ children }: { children: React.ReactNode }) {
  const { c, scheme } = useTheme();
  useEffect(() => applyShellColors(c.bg, c.focus), [c.bg, c.focus]);
  return (
    <View style={[styles.fill, { backgroundColor: c.bg }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.column, { backgroundColor: c.bg }]}>{children}</View>
    </View>
  );
}

/** Applies the stored appearance preference once the database is open. */
function ThemeSync() {
  const pref = useLive((r) => r.settings.get().theme);
  const { setPref } = useTheme();
  useEffect(() => setPref(pref), [pref, setPref]);
  return null;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center' },
});
