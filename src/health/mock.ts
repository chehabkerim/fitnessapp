import type { HealthApi, HealthStatus } from './types';

/** Deterministic mock for tests and UI development without a device. */
export function createMockHealth(opts: { status?: HealthStatus; steps?: Record<string, number>; energy?: Record<string, number> } = {}): HealthApi {
  let status: HealthStatus = opts.status ?? { available: true, permission: 'not-determined' };
  return {
    getPermissionStatus: async () => status,
    requestPermissions: async () => (status = status.available ? { available: true, permission: 'granted' } : status),
    getSteps: async (date) => (status.available && status.permission === 'granted' ? (opts.steps?.[date] ?? 0) : null),
    async getStepsRange(start, end) {
      if (!status.available || status.permission !== 'granted') return null;
      return Object.fromEntries(Object.entries(opts.steps ?? {}).filter(([d]) => d >= start && d <= end));
    },
    getActiveEnergy: async (date) => (status.available && status.permission === 'granted' ? (opts.energy?.[date] ?? 0) : null),
  };
}
