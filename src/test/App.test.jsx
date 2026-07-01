import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../pages/Home.jsx', () => ({ default: () => <div>home-page</div> }));
vi.mock('../pages/BookingPage.jsx', () => ({ default: () => <div>booking-page</div> }));
vi.mock('../pages/BookingSuccess.jsx', () => ({ default: () => <div>success-page</div> }));
vi.mock('../pages/NotFound.jsx', () => ({ default: () => <div>notfound-page</div> }));
vi.mock('../pages/Login.jsx', () => ({ default: () => <div>login-page</div> }));
vi.mock('../pages/Admin.jsx', () => ({ default: () => <div>admin-page</div> }));
vi.mock('../pages/ManageBooking.jsx', () => ({ default: () => <div>manage-page</div> }));
vi.mock('../pages/Privacy.jsx', () => ({ default: () => <div>privacy-page</div> }));
vi.mock('../pages/Terms.jsx', () => ({ default: () => <div>terms-page</div> }));
vi.mock('../components/ProtectedRoute.jsx', () => ({ default: ({ children }) => children }));

import App from '../App.jsx';

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('App routing', () => {
  it('renders the home route', () => {
    renderAt('/');
    expect(screen.getByText('home-page')).toBeInTheDocument();
  });

  it('renders the booking route', () => {
    renderAt('/book');
    expect(screen.getByText('booking-page')).toBeInTheDocument();
  });

  it('renders the booking success route', () => {
    renderAt('/booking-success');
    expect(screen.getByText('success-page')).toBeInTheDocument();
  });

  it('renders the not-found route for unknown paths', () => {
    renderAt('/nope');
    expect(screen.getByText('notfound-page')).toBeInTheDocument();
  });

  it('lazy-loads the login route (showing the loader first)', async () => {
    renderAt('/login');
    expect(await screen.findByText('login-page')).toBeInTheDocument();
  });

  it('lazy-loads the protected admin route', async () => {
    renderAt('/admin');
    expect(await screen.findByText('admin-page')).toBeInTheDocument();
  });

  it('lazy-loads the manage-booking route', async () => {
    renderAt('/manage');
    expect(await screen.findByText('manage-page')).toBeInTheDocument();
  });

  it('lazy-loads the privacy and terms routes', async () => {
    renderAt('/privacy');
    expect(await screen.findByText('privacy-page')).toBeInTheDocument();
    renderAt('/terms');
    expect(await screen.findByText('terms-page')).toBeInTheDocument();
  });
});
