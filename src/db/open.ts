import type { Engine } from './types';

export type OpenResult =
  | { status: 'ready'; engine: Engine; onLost(cb: () => void): void }
  | { status: 'locked'; takeOver(): Promise<OpenResult> };
