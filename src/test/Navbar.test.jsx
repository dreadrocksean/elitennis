import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const nav = vi.hoisted(() => ({ spy: vi.fn() }));
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => nav.spy,
}));

const authState = vi.hoisted(() => ({ isOwner: false }));
vi.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ isOwner: authState.isOwner }),
}));

import Navbar from '../components/Navbar.jsx';
import { CONTACT } from '../data/siteContent';

const setScrollY = (y) =>
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  setScrollY(0);
  nav.spy.mockClear();
  authState.isOwner = false;
});

describe('Navbar', () => {
  it('uses light text over the hero when not scrolled', () => {
    wrap(<Navbar onDark />);
    expect(screen.getByText(CONTACT.brand)).toHaveClass('text-white');
  });

  it('switches to dark text once scrolled', () => {
    wrap(<Navbar onDark />);
    setScrollY(50);
    fireEvent.scroll(window);
    expect(screen.getByText(CONTACT.brand)).toHaveClass('text-forest');
  });

  it('uses dark text on light pages (no onDark)', () => {
    wrap(<Navbar />);
    expect(screen.getByText(CONTACT.brand)).toHaveClass('text-forest');
  });

  it('reflects an already-scrolled position on mount', () => {
    setScrollY(100);
    wrap(<Navbar onDark />);
    expect(screen.getByText(CONTACT.brand)).toHaveClass('text-forest');
  });

  it('opens the mobile menu and navigates to /book from it', () => {
    wrap(<Navbar />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    const bookBtn = screen.getByRole('button', { name: 'Book Now' });
    fireEvent.click(bookBtn);
    expect(nav.spy).toHaveBeenCalledWith('/book');
    // menu closes after navigating
    expect(screen.queryByRole('button', { name: 'Book Now' })).not.toBeInTheDocument();
  });

  it('closes the mobile menu when a link is tapped', () => {
    const { container } = wrap(<Navbar />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    const mobileLink = container.querySelector('a.block');
    expect(mobileLink).toBeTruthy();
    fireEvent.click(mobileLink);
    expect(container.querySelector('a.block')).toBeNull();
  });

  it('hides the Admin link when the visitor is not the owner', () => {
    wrap(<Navbar />);
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull();
  });

  it('shows the Admin link for the owner and closes the menu when tapped', () => {
    authState.isOwner = true;
    wrap(<Navbar />);
    // desktop link present and points at /admin
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
    // open the mobile menu -> now both desktop + mobile Admin links exist
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    const adminLinks = screen.getAllByRole('link', { name: 'Admin' });
    expect(adminLinks).toHaveLength(2);
    // tapping the mobile link closes the menu
    fireEvent.click(adminLinks[1]);
    expect(screen.getAllByRole('link', { name: 'Admin' })).toHaveLength(1);
  });

  it('styles the owner Admin link with light text over the dark hero', () => {
    authState.isOwner = true;
    wrap(<Navbar onDark />);
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveClass('text-white/90');
  });

  it('closes the mobile menu when the brand is tapped', () => {
    const { container } = wrap(<Navbar />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    expect(container.querySelector('a.block')).toBeTruthy();
    fireEvent.click(screen.getByText(CONTACT.brand));
    expect(container.querySelector('a.block')).toBeNull();
  });
});
