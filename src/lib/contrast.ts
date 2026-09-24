// WCAG 2.x contrast helpers (used by the theme tests to verify every token pair).

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Mix `from` toward `to` by `amount` (0..1), e.g. mix(accent, body, 0.45). */
export function mix(from: string, to: string, amount: number): string {
  const p = (hex: string) => [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16));
  const a = p(from);
  const b = p(to);
  return `#${a.map((v, i) => Math.round(v + (b[i]! - v) * amount).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
