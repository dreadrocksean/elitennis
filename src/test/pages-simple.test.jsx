import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../contexts/AuthContext.jsx', () => ({ useAuth: () => ({ isOwner: false }) }));

import NotFound from '../pages/NotFound.jsx';
import BookingSuccess from '../pages/BookingSuccess.jsx';

describe('NotFound', () => {
  it('renders the 404 page', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to home/i })).toBeInTheDocument();
  });
});

describe('BookingSuccess', () => {
  it('shows the booked date and time when present in the query', () => {
    render(
      <MemoryRouter initialEntries={['/booking-success?date=2026-07-06&time=16:00']}>
        <BookingSuccess />
      </MemoryRouter>,
    );
    expect(screen.getByText("You're booked!")).toBeInTheDocument();
    expect(screen.getByText(/Mon, Jul 6 · 4:00 PM/)).toBeInTheDocument();
  });

  it('omits the date chip when params are missing', () => {
    render(
      <MemoryRouter initialEntries={['/booking-success']}>
        <BookingSuccess />
      </MemoryRouter>,
    );
    expect(screen.getByText("You're booked!")).toBeInTheDocument();
    expect(screen.queryByText(/\d{1,2}:\d{2} (AM|PM)/)).not.toBeInTheDocument();
  });
});
