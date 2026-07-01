import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/firebase', () => ({ storage: { __storage: true } }));
vi.mock('firebase/storage', () => ({
  ref: vi.fn((s, path) => ({ s, path })),
  uploadBytes: vi.fn(async () => ({})),
  getDownloadURL: vi.fn(async () => 'https://cdn/x.jpg'),
  deleteObject: vi.fn(async () => {}),
}));

import { uploadGalleryImage, deleteGalleryImage } from '../lib/storage';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

describe('gallery storage', () => {
  it('uploads a file and returns its url + path', async () => {
    const file = new File(['x'], 'court.jpg', { type: 'image/jpeg' });
    const res = await uploadGalleryImage(file);
    expect(uploadBytes).toHaveBeenCalled();
    expect(getDownloadURL).toHaveBeenCalled();
    expect(res.url).toBe('https://cdn/x.jpg');
    expect(res.path).toMatch(/^gallery\/\d+-court\.jpg$/);
    expect(ref).toHaveBeenCalledWith({ __storage: true }, res.path);
  });

  it('deletes a file by its path', async () => {
    await deleteGalleryImage('gallery/old.jpg');
    expect(deleteObject).toHaveBeenCalled();
    expect(ref).toHaveBeenCalledWith({ __storage: true }, 'gallery/old.jpg');
  });
});
