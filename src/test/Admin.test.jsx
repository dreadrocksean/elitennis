import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const authState = vi.hoisted(() => ({ user: { email: 'eli@kc.com' }, logout: vi.fn() }));
vi.mock('../contexts/AuthContext.jsx', () => ({ useAuth: () => authState }));
vi.mock('../lib/useSiteContent', () => ({ useSiteContent: () => ({ content: { gallery: [] } }) }));

vi.mock('../components/admin/BookingsAdmin.jsx', () => ({
  default: () => <div>bookings-panel</div>,
}));
vi.mock('../components/admin/ContentAdmin.jsx', () => ({
  default: () => <div>content-panel</div>,
}));
vi.mock('../components/admin/GalleryAdmin.jsx', () => ({
  default: () => <div>gallery-panel</div>,
}));
vi.mock('../components/admin/TestimonialsAdmin.jsx', () => ({
  default: () => <div>testimonials-panel</div>,
}));
vi.mock('../components/admin/AvailabilityAdmin.jsx', () => ({
  default: () => <div>availability-panel</div>,
}));

import Admin from '../pages/Admin.jsx';

const renderAdmin = () =>
  render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>,
  );

beforeEach(() => authState.logout.mockReset());

describe('Admin', () => {
  it('shows the owner email and the bookings tab by default', () => {
    renderAdmin();
    expect(screen.getByText('eli@kc.com')).toBeInTheDocument();
    expect(screen.getByText('bookings-panel')).toBeInTheDocument();
  });

  it('switches between every tab', () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: /Site Content/i }));
    expect(screen.getByText('content-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Gallery/i }));
    expect(screen.getByText('gallery-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Testimonials/i }));
    expect(screen.getByText('testimonials-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Availability/i }));
    expect(screen.getByText('availability-panel')).toBeInTheDocument();
  });

  it('signs out', () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: /Sign out/i }));
    expect(authState.logout).toHaveBeenCalled();
  });
});
