import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const lib = vi.hoisted(() => ({ getManagedBooking: vi.fn(), cancelManagedBooking: vi.fn() }));
vi.mock('../lib/manage', () => lib);
vi.mock('../contexts/AuthContext.jsx', () => ({ useAuth: () => ({ isOwner: false }) }));

import ManageBooking from '../pages/ManageBooking.jsx';

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <ManageBooking />
    </MemoryRouter>,
  );

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  lib.getManagedBooking.mockReset();
  lib.cancelManagedBooking.mockReset();
  vi.stubGlobal(
    'confirm',
    vi.fn(() => true),
  );
});

const okBooking = { date: '2026-07-10', time: '16:00', name: 'Sam', status: 'paid' };

describe('ManageBooking', () => {
  it('shows an error when the link is missing details', async () => {
    renderAt('/manage');
    await waitFor(() => expect(screen.getByText(/missing details/i)).toBeInTheDocument());
    expect(lib.getManagedBooking).not.toHaveBeenCalled();
  });

  it('shows a loading state then the booking details', async () => {
    lib.getManagedBooking.mockResolvedValue(okBooking);
    renderAt('/manage?id=a&token=t');
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/5:00 PM CT|4:00 PM CT/)).toBeInTheDocument());
    expect(screen.getByText(/for Sam/)).toBeInTheDocument();
    expect(lib.getManagedBooking).toHaveBeenCalledWith({ id: 'a', token: 't' });
  });

  it('renders without a name when none is set', async () => {
    lib.getManagedBooking.mockResolvedValue({ ...okBooking, name: '' });
    renderAt('/manage?id=a&token=t');
    await waitFor(() => expect(screen.getByText(/60-minute private lesson\./)).toBeInTheDocument());
    expect(screen.queryByText(/for Sam/)).not.toBeInTheDocument();
  });

  it('shows an error when the booking cannot be loaded', async () => {
    lib.getManagedBooking.mockRejectedValue(new Error('This booking was not found.'));
    renderAt('/manage?id=a&token=t');
    await waitFor(() =>
      expect(screen.getByText('This booking was not found.')).toBeInTheDocument(),
    );
  });

  it('cancels with a refund and shows the refunded message', async () => {
    lib.getManagedBooking.mockResolvedValue(okBooking);
    lib.cancelManagedBooking.mockResolvedValue({ refunded: true });
    renderAt('/manage?id=a&token=t');
    await waitFor(() => screen.getByRole('button', { name: /Cancel this lesson/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel this lesson/i }));
    await waitFor(() => expect(screen.getByText(/refunded/i)).toBeInTheDocument());
    expect(lib.cancelManagedBooking).toHaveBeenCalledWith({ id: 'a', token: 't' });
  });

  it('cancels without a refund (inside 24h) and shows the discretion message', async () => {
    lib.getManagedBooking.mockResolvedValue(okBooking);
    lib.cancelManagedBooking.mockResolvedValue({ refunded: false });
    renderAt('/manage?id=a&token=t');
    await waitFor(() => screen.getByRole('button', { name: /Cancel this lesson/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel this lesson/i }));
    await waitFor(() => expect(screen.getByText(/discretion/i)).toBeInTheDocument());
  });

  it('shows a spinner while canceling, then the result', async () => {
    lib.getManagedBooking.mockResolvedValue(okBooking);
    const d = deferred();
    lib.cancelManagedBooking.mockReturnValue(d.promise);
    renderAt('/manage?id=a&token=t');
    await waitFor(() => screen.getByRole('button', { name: /Cancel this lesson/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel this lesson/i }));
    await waitFor(() => expect(screen.getByText('Canceling…')).toBeInTheDocument());
    d.resolve({ refunded: true });
    await waitFor(() => expect(screen.getByText(/refunded/i)).toBeInTheDocument());
  });

  it('keeps the page usable and shows an error if the cancel fails', async () => {
    lib.getManagedBooking.mockResolvedValue(okBooking);
    lib.cancelManagedBooking.mockRejectedValue(new Error('server error'));
    renderAt('/manage?id=a&token=t');
    await waitFor(() => screen.getByRole('button', { name: /Cancel this lesson/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel this lesson/i }));
    await waitFor(() => expect(screen.getByText('server error')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Cancel this lesson/i })).toBeInTheDocument();
  });

  it('does nothing when the cancel confirm is dismissed', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false),
    );
    lib.getManagedBooking.mockResolvedValue(okBooking);
    renderAt('/manage?id=a&token=t');
    await waitFor(() => screen.getByRole('button', { name: /Cancel this lesson/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel this lesson/i }));
    expect(lib.cancelManagedBooking).not.toHaveBeenCalled();
  });
});
