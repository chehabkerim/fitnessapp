import type { FilesApi } from './types';

export const files: FilesApi = {
  canExport: true,
  async saveJson(filename, data) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
  openJson() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = async () => {
        const f = input.files?.[0];
        if (!f) return resolve(null);
        try {
          resolve(JSON.parse(await f.text()));
        } catch {
          reject(new Error("That file isn't valid JSON."));
        }
      };
      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
  },
};
