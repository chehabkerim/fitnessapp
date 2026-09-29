import * as SystemUI from 'expo-system-ui';

export function applyShellColors(bg: string, _focus?: string, _mode?: 'light' | 'dark') {
  void SystemUI.setBackgroundColorAsync(bg).catch(() => {});
}

export function registerServiceWorker() {}

export const hasHover = () => false;
