import type { HapticsApi } from './types';

// No haptics on the web.
export const haptics: HapticsApi = { light() {}, success() {}, selection() {} };
