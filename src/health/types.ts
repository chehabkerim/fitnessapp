// Shared health interface. Apple Health / Health Connect implementations arrive in Phase 5.
export type HealthStatus =
  | { available: true; permission: 'granted' | 'denied' | 'not-determined' }
  | { available: false; reason: 'platform' | 'not-installed' | 'not-yet' };

export interface HealthApi {
  getPermissionStatus(): Promise<HealthStatus>;
  requestPermissions(): Promise<HealthStatus>;
  getSteps(date: string): Promise<number | null>;
  getStepsRange(start: string, end: string): Promise<Record<string, number> | null>;
  getActiveEnergy(date: string): Promise<number | null>;
}

export const MOBILE_ONLY_NOTE = 'Automatic step syncing comes with the mobile app.';
