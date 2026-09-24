import { daysBetween, toLocalDate } from './dates';

/** One-time install/backup nudge after the third finished workout. */
export function shouldShowInstallNudge(p: {
  finishedWorkouts: number;
  standalone: boolean;
  lastExportAt: number | null;
  shownAt: number | null;
  now: number;
}): boolean {
  if (p.shownAt != null || p.standalone || p.finishedWorkouts < 3) return false;
  if (p.lastExportAt == null) return true;
  return daysBetween(toLocalDate(new Date(p.lastExportAt)), toLocalDate(new Date(p.now))) > 14;
}
