import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const saveSiteContent = vi.hoisted(() => vi.fn());
vi.mock('../lib/useSiteContent', () => ({ saveSiteContent }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: toast }));

import TestimonialsAdmin from '../components/admin/TestimonialsAdmin.jsx';

const content = () => ({
  testimonials: [
    { id: 't1', name: 'Sarah', role: 'Parent', quote: 'Great', rating: 4 },
    { id: 't2', name: 'NoRating', role: 'Adult', quote: 'Nice' }, // no rating -> default 5
  ],
});

beforeEach(() => {
  saveSiteContent.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('TestimonialsAdmin', () => {
  it('edits fields, sets a rating, adds, removes and saves', async () => {
    saveSiteContent.mockResolvedValue();
    render(<TestimonialsAdmin content={content()} />);

    fireEvent.change(screen.getByDisplayValue('Sarah'), { target: { value: 'Sarah M.' } });
    fireEvent.change(screen.getByDisplayValue('Parent'), { target: { value: 'Parent of junior' } });
    fireEvent.change(screen.getByDisplayValue('Great'), { target: { value: 'Amazing' } });
    // set Sarah's rating to 2 (first card's "2 stars" button)
    fireEvent.click(screen.getAllByLabelText('2 stars')[0]);

    fireEvent.click(screen.getByRole('button', { name: /Add testimonial/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /Remove/i })[0]);

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Testimonials updated.'));
  });

  it('handles missing testimonials and toasts the error', async () => {
    saveSiteContent.mockRejectedValue(new Error('bad'));
    render(<TestimonialsAdmin content={{}} />); // undefined -> [] fallback
    fireEvent.click(screen.getByRole('button', { name: /Add testimonial/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('bad'));
  });

  it('falls back to a generic error message', async () => {
    saveSiteContent.mockRejectedValue({});
    render(<TestimonialsAdmin content={content()} />);
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Save failed.'));
  });

  it('re-syncs when the content prop changes', () => {
    const { rerender } = render(<TestimonialsAdmin content={content()} />);
    rerender(
      <TestimonialsAdmin
        content={{ testimonials: [{ id: 'z', name: 'Zed', role: 'r', quote: 'q', rating: 5 }] }}
      />,
    );
    expect(screen.getByDisplayValue('Zed')).toBeInTheDocument();
  });
});
