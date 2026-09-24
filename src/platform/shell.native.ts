import * as SystemUI from 'expo-system-ui';

export function applyShellColors(bg: string, _focus?: string) {
  void SystemUI.setBackgroundColorAsync(bg).catch(() => {});
}

export function registerServiceWorker() {}

export const hasHover = () => false;
