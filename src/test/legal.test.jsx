import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../contexts/AuthContext.jsx', () => ({ useAuth: () => ({ isOwner: false }) }));

import Privacy from '../pages/Privacy.jsx';
import Terms from '../pages/Terms.jsx';

const at = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('legal pages', () => {
  it('renders the privacy policy with sections and a last-updated date', () => {
    at(<Privacy />);
    expect(screen.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Information we collect')).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('renders the terms with the cancellation policy', () => {
    at(<Terms />);
    expect(screen.getByRole('heading', { name: 'Terms of Service', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Cancellations and refunds')).toBeInTheDocument();
  });
});
