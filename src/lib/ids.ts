/** Opaque key for a stored photo (the image bytes live outside SQLite). */
export function newPhotoId(now: number = Date.now(), rand: () => number = Math.random): string {
  return `ph_${now.toString(36)}_${Math.floor(rand() * 36 ** 6).toString(36).padStart(6, '0')}`;
}
