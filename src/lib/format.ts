import { addDays, parseLocalDate, weekStart } from './dates';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Thursday 24 September". */
export function formatFullDate(date: string): string {
  const d = parseLocalDate(date);
  return `${FULL_DAYS[d.getDay()]} ${d.getDate()} ${FULL_MONTHS[d.getMonth()]}`;
}

/** "Thursday 24 Sep". */
export function formatDayMonth(date: string): string {
  const d = parseLocalDate(date);
  return `${FULL_DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** 83 → "1:23"; 3723 → "1:02:03". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

/** Elapsed time between two epoch-ms timestamps, as a clock. */
export function formatElapsed(startMs: number, endMs: number): string {
  return formatClock((endMs - startMs) / 1000);
}

/** Human duration: "48 min", "1 h 12 min". */
export function formatDuration(ms: number): string {
  const min = Math.max(0, Math.round(ms / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

/** "Tue 24 Sep". */
export function formatDay(date: string): string {
  const d = parseLocalDate(date);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "24 Sep 2026". */
export function formatLongDate(date: string): string {
  const d = parseLocalDate(date);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "This week", "Last week", or "15–21 Sep" / "29 Sep – 5 Oct". */
export function formatWeekLabel(start: string, today: string): string {
  const current = weekStart(today);
  if (start === current) return 'This week';
  if (start === addDays(current, -7)) return 'Last week';
  const a = parseLocalDate(start);
  const b = parseLocalDate(addDays(start, 6));
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`;
}

/** Rest countdown for the tab title fallback: "0:45 · Rest". */
export const restTitle = (remainingSec: number) => `${formatClock(Math.ceil(remainingSec))} · Rest`;

/** Compact volume: 12450 → "12,450". */
export function formatVolume(v: number): string {
  return Math.round(v).toLocaleString('en-GB');
}
