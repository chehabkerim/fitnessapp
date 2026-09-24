import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function ExercisesLayout() {
  const { c } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}
