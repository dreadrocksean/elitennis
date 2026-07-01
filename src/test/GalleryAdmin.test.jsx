import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const saveSiteContent = vi.hoisted(() => vi.fn());
vi.mock('../lib/useSiteContent', () => ({ saveSiteContent }));
const storageFns = vi.hoisted(() => ({ uploadGalleryImage: vi.fn(), deleteGalleryImage: vi.fn() }));
vi.mock('../lib/storage', () => storageFns);
const { uploadGalleryImage, deleteGalleryImage } = storageFns;
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: toast }));

import GalleryAdmin from '../components/admin/GalleryAdmin.jsx';

const content = () => ({
  gallery: [
    { id: 'g1', src: '/a.jpg', alt: 'A', caption: 'first' },
    { id: 'g2', src: '/b.jpg', alt: 'B', caption: 'second' },
  ],
});

beforeEach(() => {
  saveSiteContent.mockReset();
  uploadGalleryImage.mockReset();
  deleteGalleryImage.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

const uploaded = () => ({
  gallery: [
    { id: 'u1', src: 'https://cdn/x.jpg', alt: 'X', caption: '', storagePath: 'gallery/x.jpg' },
  ],
});
const lastTrash = (container) =>
  [...container.querySelectorAll('button')].filter((b) => !b.textContent.trim()).at(-1);

describe('GalleryAdmin', () => {
  it('edits, reorders, adds, removes and saves', async () => {
    saveSiteContent.mockResolvedValue();
    const { container } = render(<GalleryAdmin content={content()} />);

    // edit the first image's URL, alt and caption
    fireEvent.change(screen.getByDisplayValue('/a.jpg'), { target: { value: '/new.jpg' } });
    fireEvent.change(screen.getByDisplayValue('A'), { target: { value: 'Alpha' } });
    fireEvent.change(screen.getByDisplayValue('first'), { target: { value: 'First!' } });
    // dim a broken thumbnail
    const thumb = container.querySelector('img');
    fireEvent.error(thumb);
    expect(thumb.style.opacity).toBe('0.2');

    // move first down then back up (covers both directions + a real swap)
    fireEvent.click(screen.getAllByLabelText('Move down')[0]);
    fireEvent.click(screen.getAllByLabelText('Move up')[1]);
    // boundary no-ops: up on first, down on last
    fireEvent.click(screen.getAllByLabelText('Move up')[0]);
    fireEvent.click(screen.getAllByLabelText('Move down')[1]);

    // add a photo
    fireEvent.click(screen.getByRole('button', { name: /Add photo/i }));
    // remove one (icon-only trash buttons are the rightmost in each row)
    const trash = [...container.querySelectorAll('button')].filter((b) => !b.textContent.trim());
    fireEvent.click(trash.at(-1));

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Gallery updated.'));
  });

  it('handles an empty gallery and toasts the error message', async () => {
    saveSiteContent.mockRejectedValue(new Error('bad'));
    render(<GalleryAdmin content={{}} />); // gallery undefined -> [] fallback
    fireEvent.click(screen.getByRole('button', { name: /Add photo/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('bad'));
  });

  it('falls back to a generic error message', async () => {
    saveSiteContent.mockRejectedValue({});
    render(<GalleryAdmin content={content()} />);
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Save failed.'));
  });

  it('uploads a file to storage, sets the src, and auto-saves', async () => {
    saveSiteContent.mockResolvedValue();
    uploadGalleryImage.mockResolvedValue({ url: 'https://cdn/up.jpg', path: 'gallery/1-up.jpg' });
    const { container } = render(<GalleryAdmin content={content()} />);
    const file = new File(['x'], 'up.jpg', { type: 'image/jpeg' });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Image uploaded.'));
    expect(uploadGalleryImage).toHaveBeenCalledWith(file);
    expect(screen.getByDisplayValue('https://cdn/up.jpg')).toBeInTheDocument();
    // persisted immediately with the new src on the first item
    expect(saveSiteContent).toHaveBeenCalledWith({
      gallery: expect.arrayContaining([
        expect.objectContaining({
          id: 'g1',
          src: 'https://cdn/up.jpg',
          storagePath: 'gallery/1-up.jpg',
        }),
      ]),
    });
  });

  it('ignores an upload when no file is chosen', () => {
    const { container } = render(<GalleryAdmin content={content()} />);
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [] } });
    expect(uploadGalleryImage).not.toHaveBeenCalled();
  });

  it('toasts when an upload fails', async () => {
    uploadGalleryImage.mockRejectedValue(new Error('boom'));
    const { container } = render(<GalleryAdmin content={content()} />);
    const file = new File(['x'], 'up.jpg', { type: 'image/jpeg' });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Upload failed. Please try again.'),
    );
  });

  it('persists the removal to Firestore then deletes the storage file', async () => {
    saveSiteContent.mockResolvedValue();
    deleteGalleryImage.mockResolvedValue();
    const { container } = render(<GalleryAdmin content={uploaded()} />);
    fireEvent.click(lastTrash(container));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Photo removed.'));
    // removal saved to Firestore (gallery now empty) BEFORE the file is deleted
    expect(saveSiteContent).toHaveBeenCalledWith({ gallery: [] });
    expect(deleteGalleryImage).toHaveBeenCalledWith('gallery/x.jpg');
    expect(screen.queryByDisplayValue('https://cdn/x.jpg')).not.toBeInTheDocument();
  });

  it('does not call storage delete when removing a photo with no stored file', async () => {
    saveSiteContent.mockResolvedValue();
    const { container } = render(<GalleryAdmin content={content()} />); // URL items, no storagePath
    fireEvent.click(lastTrash(container));
    await waitFor(() => expect(saveSiteContent).toHaveBeenCalled());
    expect(deleteGalleryImage).not.toHaveBeenCalled();
  });

  it('still succeeds when the storage cleanup fails', async () => {
    saveSiteContent.mockResolvedValue();
    deleteGalleryImage.mockRejectedValue(new Error('gone'));
    const { container } = render(<GalleryAdmin content={uploaded()} />);
    fireEvent.click(lastTrash(container));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Photo removed.'));
    expect(deleteGalleryImage).toHaveBeenCalledWith('gallery/x.jpg');
    expect(toast.error).not.toHaveBeenCalled(); // cleanup failure is swallowed
  });

  it('keeps the photo and toasts when the removal save fails', async () => {
    saveSiteContent.mockRejectedValue(new Error('nope'));
    const { container } = render(<GalleryAdmin content={uploaded()} />);
    fireEvent.click(lastTrash(container));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('nope'));
    expect(deleteGalleryImage).not.toHaveBeenCalled(); // never delete the file if the save failed
    expect(screen.getByDisplayValue('https://cdn/x.jpg')).toBeInTheDocument(); // still shown
  });

  it('falls back to a generic message when the removal fails', async () => {
    saveSiteContent.mockRejectedValue({});
    const { container } = render(<GalleryAdmin content={uploaded()} />);
    fireEvent.click(lastTrash(container));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not remove photo.'));
  });

  it('re-syncs when the content prop changes', () => {
    const { rerender } = render(<GalleryAdmin content={content()} />);
    rerender(
      <GalleryAdmin
        content={{ gallery: [{ id: 'z', src: '/z.jpg', alt: 'Z', caption: 'zed' }] }}
      />,
    );
    expect(screen.getByDisplayValue('/z.jpg')).toBeInTheDocument();
  });
});
