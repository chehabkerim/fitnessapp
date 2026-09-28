import { useEffect, useState } from 'react';

import { useScreenFocused } from './useScreenFocused';

/**
 * Current time, refreshed every `intervalMs` while `active` and the screen is focused (a hidden screen
 * catches up when it's shown again). Display only; logic uses timestamps.
 */
export function useNow(intervalMs = 1000, activeProp = true): number {
  const active = useScreenFocused() && activeProp;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs, active]);
  return now;
}
