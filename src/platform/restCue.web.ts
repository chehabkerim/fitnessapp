import type { RestCueApi } from './types';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  return ctx;
}

/** A short, soft two-note chime (sine, gentle envelope). */
function playTone() {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + 0.02;
  [660, 880].forEach((freq, i) => {
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = t0 + i * 0.16;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
    osc.connect(gain).connect(a.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

export const restCue: RestCueApi = {
  unlock() {
    const a = audio();
    if (a && a.state === 'suspended') void a.resume().catch(() => {});
  },
  ended({ tone }) {
    if ('vibrate' in navigator) navigator.vibrate?.(200); // Android; iPhone web apps can't vibrate
    if (tone) playTone();
  },
};
