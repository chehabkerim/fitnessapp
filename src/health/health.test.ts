import { createMockHealth } from './mock';
import { health } from './index.web';

describe('health', () => {
  it('web reports unavailable on this platform', async () => {
    expect(await health.getPermissionStatus()).toEqual({ available: false, reason: 'platform' });
    expect(await health.getSteps('2026-09-24')).toBeNull();
  });

  it('mock returns data once permission is granted', async () => {
    const h = createMockHealth({ steps: { '2026-09-24': 8200, '2026-09-20': 4000 } });
    expect(await h.getSteps('2026-09-24')).toBeNull();
    await h.requestPermissions();
    expect(await h.getSteps('2026-09-24')).toBe(8200);
    expect(await h.getStepsRange('2026-09-21', '2026-09-27')).toEqual({ '2026-09-24': 8200 });
  });
});
