import type { InstallApi } from './types';

export const install: InstallApi = {
  isStandalone: () => true,
  mode: () => 'none',
  prompt: async () => false,
  subscribe: () => () => {},
};
