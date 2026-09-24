import { newPhotoId } from '../lib/ids';
import { idbClear, idbDelete, idbGet, idbPut } from './idb';
import type { PhotoApi } from './types';

// Exercise photos: resized in a canvas to a ~160px thumbnail and ~800px-wide detail image, WebP where the
// browser can encode it (Safari can't, so JPEG). Stored in their own IndexedDB store, never in SQLite.
interface StoredPhoto {
  thumb: Blob;
  detail: Blob;
}

const urls = new Map<string, string>();

function pickFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encode(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((webp) => {
      if (webp && webp.type === 'image/webp') return resolve(webp);
      canvas.toBlob((jpeg) => (jpeg ? resolve(jpeg) : reject(new Error('Could not encode image'))), 'image/jpeg', 0.85);
    }, 'image/webp', 0.85);
  });
}

/** Detail: scale to max width. Thumb: centre-crop to a square. */
function draw(img: HTMLImageElement, mode: 'thumb' | 'detail'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const c = canvas.getContext('2d')!;
  if (mode === 'thumb') {
    const size = 160;
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    canvas.width = canvas.height = size;
    c.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
  } else {
    const w = Math.min(800, img.naturalWidth);
    const h = Math.round((img.naturalHeight / img.naturalWidth) * w);
    canvas.width = w;
    canvas.height = h;
    c.drawImage(img, 0, 0, w, h);
  }
  return canvas;
}

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

const fromBase64 = (data: string, mime: string) => {
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

export const photos: PhotoApi = {
  canCapture: true,
  async capture() {
    const file = await pickFile();
    if (!file) return null;
    const img = await loadImage(file);
    const [thumb, detail] = await Promise.all([encode(draw(img, 'thumb')), encode(draw(img, 'detail'))]);
    const id = newPhotoId();
    await idbPut('photos', id, { thumb, detail } satisfies StoredPhoto);
    return id;
  },
  async url(photoId, size) {
    const key = `${photoId}:${size}`;
    const cached = urls.get(key);
    if (cached) return cached;
    const p = await idbGet<StoredPhoto>('photos', photoId);
    if (!p) return null;
    const url = URL.createObjectURL(p[size]);
    urls.set(key, url);
    return url;
  },
  async remove(photoId) {
    for (const size of ['thumb', 'detail']) {
      const u = urls.get(`${photoId}:${size}`);
      if (u) URL.revokeObjectURL(u);
      urls.delete(`${photoId}:${size}`);
    }
    await idbDelete('photos', photoId);
  },
  async exportAll(ids) {
    const out: Awaited<ReturnType<PhotoApi['exportAll']>> = {};
    for (const id of ids) {
      const p = await idbGet<StoredPhoto>('photos', id);
      if (!p) continue;
      out[id] = {
        thumb: { mime: p.thumb.type, data: await toBase64(p.thumb) },
        detail: { mime: p.detail.type, data: await toBase64(p.detail) },
      };
    }
    return out;
  },
  async importAll(map) {
    for (const [id, p] of Object.entries(map)) {
      await idbPut('photos', id, { thumb: fromBase64(p.thumb.data, p.thumb.mime), detail: fromBase64(p.detail.data, p.detail.mime) } satisfies StoredPhoto);
    }
  },
  async clear() {
    urls.forEach((u) => URL.revokeObjectURL(u));
    urls.clear();
    await idbClear('photos');
  },
};
