import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';

const TAG = 'active-workout';

/** Keeps the screen on while `active` is true. */
export function useKeepAwakeWhile(active: boolean) {
  useEffect(() => {
    if (!active) return;
    activateKeepAwakeAsync(TAG).catch(() => {});
    return () => void deactivateKeepAwake(TAG).catch(() => {});
  }, [active]);
}
