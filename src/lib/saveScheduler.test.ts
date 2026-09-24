import { createSaveScheduler } from './saveScheduler';

describe('save scheduler', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('debounces bursts of writes into one save', async () => {
    const save = jest.fn(() => Promise.resolve());
    const s = createSaveScheduler({ save, debounceMs: 200, maxWaitMs: 1000, now: () => Date.now() });
    s.markDirty();
    jest.advanceTimersByTime(100);
    s.markDirty();
    jest.advanceTimersByTime(199);
    expect(save).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('never waits longer than maxWait while writes keep coming', async () => {
    const save = jest.fn(() => Promise.resolve());
    const s = createSaveScheduler({ save, debounceMs: 200, maxWaitMs: 1000, now: () => Date.now() });
    for (let i = 0; i < 10; i++) {
      s.markDirty();
      await jest.advanceTimersByTimeAsync(150);
    }
    expect(save.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('flush saves immediately (visibilitychange / pagehide)', async () => {
    const save = jest.fn(() => Promise.resolve());
    const s = createSaveScheduler({ save });
    s.markDirty();
    await s.flush();
    expect(save).toHaveBeenCalledTimes(1);
    expect(s.dirty).toBe(false);
    await s.flush();
    expect(save).toHaveBeenCalledTimes(1); // nothing new to save
  });

  it('keeps changes made during a save and retries after a failure', async () => {
    let fail = true;
    const save = jest.fn(() => (fail ? Promise.reject(new Error('quota')) : Promise.resolve()));
    const onError = jest.fn();
    const s = createSaveScheduler({ save, onError });
    s.markDirty();
    await s.flush();
    expect(onError).toHaveBeenCalled();
    expect(s.dirty).toBe(true);
    fail = false;
    await s.flush();
    expect(s.dirty).toBe(false);
  });
});
