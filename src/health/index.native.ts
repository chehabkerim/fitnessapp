import type { HealthApi } from './types';

// Phase 1 runs in Expo Go without the native health modules; the real implementations arrive in Phase 5.
export const health: HealthApi = {
  getPermissionStatus: async () => ({ available: false, reason: 'not-yet' }),
  requestPermissions: async () => ({ available: false, reason: 'not-yet' }),
  getSteps: async () => null,
  getStepsRange: async () => null,
  getActiveEnergy: async () => null,
};
