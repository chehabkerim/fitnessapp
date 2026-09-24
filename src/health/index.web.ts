import type { HealthApi } from './types';

// Web: no health data on this platform.
export const health: HealthApi = {
  getPermissionStatus: async () => ({ available: false, reason: 'platform' }),
  requestPermissions: async () => ({ available: false, reason: 'platform' }),
  getSteps: async () => null,
  getStepsRange: async () => null,
  getActiveEnergy: async () => null,
};
