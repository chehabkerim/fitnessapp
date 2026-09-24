import { restTitle } from '../lib/format';
import type { AlertPermission, RestAlertsApi } from './types';

// Web: when the tab is hidden, alert at the end via the service worker (or a plain Notification).
// Without permission, fall back to a countdown in the tab title. Mobile browsers may suspend hidden
// pages, so on phones this is best-effort.
let current: { endsAt: number; label: string } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let ticker: ReturnType<typeof setInterval> | null = null;
let savedTitle: string | null = null;
let listening = false;

const supported = () => typeof window !== 'undefined' && 'Notification' in window;
const perm = (): AlertPermission => (supported() ? (Notification.permission as AlertPermission) : 'unsupported');

const restoreTitle = () => {
  if (savedTitle != null) document.title = savedTitle;
  savedTitle = null;
};

const stop = () => {
  if (timer) clearTimeout(timer);
  if (ticker) clearInterval(ticker);
  timer = ticker = null;
  restoreTitle();
};

async function notify(label: string) {
  const body = `Time for your next set of ${label}.`;
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) await reg.showNotification('Rest is over', { body, tag: 'rest', icon: '/icons/icon-192.png' });
    else new Notification('Rest is over', { body, tag: 'rest' });
  } catch {
    // ignore
  }
}

function onHidden() {
  stop();
  if (!current) return;
  const ms = current.endsAt - Date.now();
  if (ms <= 0) return;
  if (perm() === 'granted') {
    const label = current.label;
    timer = setTimeout(() => void notify(label), ms);
  } else {
    savedTitle = document.title;
    const tick = () => {
      if (!current) return stop();
      const left = (current.endsAt - Date.now()) / 1000;
      document.title = left > 0 ? restTitle(left) : 'Rest is over';
    };
    tick();
    ticker = setInterval(tick, 1000);
  }
}

function ensureListening() {
  if (listening || typeof document === 'undefined') return;
  listening = true;
  document.addEventListener('visibilitychange', () => (document.visibilityState === 'hidden' ? onHidden() : stop()));
}

export const restAlerts: RestAlertsApi = {
  permission: async () => perm(),
  requestPermission: async () => (supported() ? ((await Notification.requestPermission()) as AlertPermission) : 'unsupported'),
  sync(rest) {
    ensureListening();
    current = rest;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') onHidden();
    else stop();
  },
};
