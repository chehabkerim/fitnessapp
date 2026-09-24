// Web shell integration: page colours follow the theme, and the service worker is registered in production.
export function applyShellColors(bg: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.backgroundColor = bg;
  document.body.style.backgroundColor = bg;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', bg));
}

export function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
  const register = () => void navigator.serviceWorker.register('/sw.js').catch(() => {});
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

/** Web supports hover affordances. */
export const hasHover = () => typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches;
