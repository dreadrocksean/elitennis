import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const state = vi.hoisted(() => ({ bookings: [], loading: false }));
const cancelBooking = vi.hoisted(() => vi.fn());

vi.mock('../lib/useBookings', () => ({
  useBookings: () => ({ bookings: state.bookings, loading: state.loading }),
  cancelBooking,
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: toast }));

import BookingsAdmin from '../components/admin/BookingsAdmin.jsx';

const confirmed = {
  id: 'b',
  date: '2026-07-05',
  time: '15:00',
  status: 'confirmed',
  name: 'Pat',
};
const paid = {
  id: 'a',
  date: '2026-07-06',
  time: '16:00',
  status: 'paid',
  name: 'Sam',
  email: 's@e.com',
  phone: '913',
  notes: 'lefty',
  amount: 4000,
};
const pending = {
  id: 'c',
  date: '2026-07-07',
  time: '17:00',
  status: 'pending',
  name: 'Lee',
  email: 'l@e.com',
};

beforeEach(() => {
  state.bookings = [];
  state.loading = false;
  cancelBooking.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
  vi.stubGlobal(
    'confirm',
    vi.fn(() => true),
  );
});

describe('BookingsAdmin', () => {
  it('shows a loading state', () => {
    state.loading = true;
    render(<BookingsAdmin />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows the empty state when there are no confirmed bookings', () => {
    render(<BookingsAdmin />);
    expect(screen.getByText('No confirmed bookings this month.')).toBeInTheDocument();
  });

  it('renders stats, confirmed and pending rows', () => {
    state.bookings = [paid, confirmed, pending];
    render(<BookingsAdmin />);
    // revenue = (4000 + 0) / 100 = $40
    expect(screen.getByText('$40')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('Pat')).toBeInTheDocument();
    expect(screen.getByText('Lee')).toBeInTheDocument();
    // contact links for the row that has them
    expect(screen.getByText('s@e.com')).toBeInTheDocument();
    expect(screen.getByText('913')).toBeInTheDocument();
    expect(screen.getByText('“lefty”')).toBeInTheDocument();
    // pending section header
    expect(screen.getByText('Pending (awaiting payment)')).toBeInTheDocument();
  });

  it('changes the month filter', () => {
    render(<BookingsAdmin />);
    const month = document.querySelector('input[type="month"]');
    fireEvent.change(month, { target: { value: '2027-01' } });
    expect(month.value).toBe('2027-01');
  });

  it('cancels and refunds a paid booking after confirmation', async () => {
    cancelBooking.mockResolvedValue({ refunded: true });
    state.bookings = [paid];
    render(<BookingsAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Refunded and canceled.'));
    expect(cancelBooking).toHaveBeenCalledWith({ id: 'a', refund: true });
  });

  it('uses a generic label when a paid booking has no name', async () => {
    cancelBooking.mockResolvedValue({ refunded: true });
    state.bookings = [{ id: 'x', date: '2026-07-09', time: '18:00', status: 'paid', amount: 4000 }];
    render(<BookingsAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => expect(cancelBooking).toHaveBeenCalledWith({ id: 'x', refund: true }));
  });

  it('cancels a pending hold without a refund', async () => {
    cancelBooking.mockResolvedValue({ refunded: false });
    state.bookings = [pending];
    render(<BookingsAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /Remove hold/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Booking canceled.'));
    expect(cancelBooking).toHaveBeenCalledWith({ id: 'c', refund: false });
  });

  it('does not cancel when the user dismisses the confirm dialog', () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false),
    );
    state.bookings = [paid];
    render(<BookingsAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(cancelBooking).not.toHaveBeenCalled();
  });

  it('toasts an error when cancellation fails', async () => {
    cancelBooking.mockRejectedValue(new Error('nope'));
    state.bookings = [pending];
    render(<BookingsAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /Remove hold/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('nope'));
  });

  it('toasts a default message when cancellation fails without a message', async () => {
    cancelBooking.mockRejectedValue({});
    state.bookings = [pending];
    render(<BookingsAdmin />);
    fireEvent.click(screen.getByRole('button', { name: /Remove hold/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to cancel.'));
  });
});
