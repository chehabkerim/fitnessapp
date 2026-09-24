import { haptics } from './haptics';
import type { RestCueApi } from './types';

// Native: a success haptic at the end of rest. (A sound needs expo-audio; planned with the native builds.)
export const restCue: RestCueApi = {
  unlock() {},
  ended: () => haptics.success(),
};
