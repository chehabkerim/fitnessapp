import type { FilesApi } from './types';

// Native export/import (expo-sharing, expo-document-picker) comes with the native builds in Phase 5.
export const files: FilesApi = {
  canExport: false,
  saveJson: async () => {},
  openJson: async () => null,
};
