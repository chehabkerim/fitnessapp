import { useEffect } from 'react';

type Sentinel = { release(): Promise<void>; released: boolean };

/** Screen Wake Lock while `active`; re-acquired when the tab becomes visible; silently skipped if unsupported. */
export function useKeepAwakeWhile(active: boolean) {
  useEffect(() => {
    const wl = (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<Sentinel> } }).wakeLock;
    if (!active || !wl) return;
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return;
      try {
        sentinel = await wl.request('screen');
      } catch {
        // denied (e.g. low battery) — skip silently
      }
    };
    void acquire();
    const onVisible = () => void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}
