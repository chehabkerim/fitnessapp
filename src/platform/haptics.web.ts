import type { HapticsApi } from './types';

// No haptics on the web; a short vibration on set complete and PRs where supported (Android).
const vibrate = (ms: number) => typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate?.(ms);
export const haptics: HapticsApi = { light() {}, success() {}, selection() {}, strong: () => void vibrate(40) };
