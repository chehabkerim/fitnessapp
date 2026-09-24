// Contracts for platform adapters. Screens call these; only /src/platform knows the platform.

export interface HapticsApi {
  light(): void;
  success(): void;
  selection(): void;
}

export type AlertPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export interface RestAlertsApi {
  /** Current permission for rest-end alerts. */
  permission(): Promise<AlertPermission>;
  requestPermission(): Promise<AlertPermission>;
  /** Tell the adapter the current rest (or null). It alerts at the end if the app is in the background. */
  sync(rest: { endsAt: number; label: string } | null): void;
}

export interface RestCueApi {
  /** Call on the tap that starts a rest (lets web audio play later). */
  unlock(): void;
  /** Rest ended while the app is in the foreground. */
  ended(opts: { tone: boolean }): void;
}

export interface PhotoApi {
  /** Whether this platform can take/pick photos in this phase. */
  canCapture: boolean;
  /** Opens the camera/library picker; resolves to a new photo id, or null if cancelled. */
  capture(): Promise<string | null>;
  url(photoId: string, size: 'thumb' | 'detail'): Promise<string | null>;
  remove(photoId: string): Promise<void>;
  exportAll(ids: string[]): Promise<Record<string, { thumb: { mime: string; data: string }; detail: { mime: string; data: string } }>>;
  importAll(photos: Record<string, { thumb: { mime: string; data: string }; detail: { mime: string; data: string } }>): Promise<void>;
  clear(): Promise<void>;
}

export interface FilesApi {
  canExport: boolean;
  saveJson(filename: string, data: unknown): Promise<void>;
  openJson(): Promise<unknown | null>;
}

export interface InstallApi {
  isStandalone(): boolean;
  /** 'prompt' = the browser offers an install prompt; 'ios' = Share → Add to Home Screen; 'none' = not applicable. */
  mode(): 'prompt' | 'ios' | 'manual' | 'none';
  prompt(): Promise<boolean>;
  subscribe(cb: () => void): () => void;
}
