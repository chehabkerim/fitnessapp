import type { PhotoApi } from './types';

// Native photo capture needs expo-image-picker and expo-image-manipulator (Phase 5).
export const photos: PhotoApi = {
  canCapture: false,
  capture: async () => null,
  url: async () => null,
  remove: async () => {},
  exportAll: async () => ({}),
  importAll: async () => {},
  clear: async () => {},
};
