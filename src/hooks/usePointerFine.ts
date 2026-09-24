import { useEffect, useState } from 'react';

import { hasHover } from '@/platform/shell';

/**
 * True on devices with a mouse/trackpad (desktop web). Decided after mount so the static HTML and the
 * first client render match. Touch devices (phones, native) get the in-app keypad instead of text inputs.
 */
export function usePointerFine(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFine(hasHover()), 0);
    return () => clearTimeout(t);
  }, []);
  return fine;
}
