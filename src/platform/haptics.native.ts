import * as Haptics from 'expo-haptics';

import type { HapticsApi } from './types';

export const haptics: HapticsApi = {
  light: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  selection: () => void Haptics.selectionAsync().catch(() => {}),
};
