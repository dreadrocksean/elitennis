import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';

const state = vi.hoisted(() => ({ user: null, owners: ['coach@eli.com'] }));

vi.mock('../lib/firebase', () => ({
  auth: { __auth: true },
  get OWNER_EMAILS() {
    return state.owners;
  },
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(state.user);
    return vi.fn(); // unsubscribe
  }),
  signInWithEmailAndPassword: vi.fn(async () => ({ user: state.user })),
  signOut: vi.fn(async () => {}),
  sendEmailVerification: vi.fn(async () => {}),
}));

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from 'firebase/auth';
import { AuthProvider, useAuth } from '../contexts/AuthContext.jsx';

const Consumer = () => {
  const { user, isOwner, loading, login, logout, sendVerification } = useAuth();
  return (
    <div>
      <span data-testid="email">{user?.email || 'none'}</span>
      <span data-testid="owner">{String(isOwner)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button onClick={() => login('a@b.com', 'pw')}>login</button>
      <button onClick={() => logout()}>logout</button>
      <button onClick={() => sendVerification()}>verify</button>
    </div>
  );
};

const renderProvider = () =>
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );

beforeEach(() => {
  state.user = null;
  state.owners = ['coach@eli.com'];
});

describe('AuthProvider', () => {
  it('marks the matching owner email (case-insensitive) as owner', () => {
    state.user = { email: 'Coach@Eli.com' };
    renderProvider();
    expect(screen.getByTestId('owner')).toHaveTextContent('true');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('email')).toHaveTextContent('Coach@Eli.com');
  });

  it('is not owner for a non-matching user', () => {
    state.user = { email: 'someone@else.com' };
    renderProvider();
    expect(screen.getByTestId('owner')).toHaveTextContent('false');
  });

  it('is not owner when there is no user', () => {
    state.user = null;
    renderProvider();
    expect(screen.getByTestId('owner')).toHaveTextContent('false');
  });

  it('is not owner when the user has no email', () => {
    state.user = { uid: 'x' };
    renderProvider();
    expect(screen.getByTestId('owner')).toHaveTextContent('false');
  });

  it('is not owner when no owner email is configured', () => {
    state.user = { email: 'coach@eli.com' };
    state.owners = [];
    renderProvider();
    expect(screen.getByTestId('owner')).toHaveTextContent('false');
  });

  it('recognizes any email in a multi-owner list', () => {
    state.user = { email: 'Second@Owner.com' };
    state.owners = ['coach@eli.com', 'second@owner.com'];
    renderProvider();
    expect(screen.getByTestId('owner')).toHaveTextContent('true');
  });

  it('wires login and logout to firebase', () => {
    renderProvider();
    fireEvent.click(screen.getByText('login'));
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({ __auth: true }, 'a@b.com', 'pw');
    fireEvent.click(screen.getByText('logout'));
    expect(signOut).toHaveBeenCalledWith({ __auth: true });
    expect(onAuthStateChanged).toHaveBeenCalled();
  });

  it('sends an email verification for the current user', () => {
    renderProvider();
    fireEvent.click(screen.getByText('verify'));
    expect(sendEmailVerification).toHaveBeenCalled();
  });
});

describe('useAuth', () => {
  it('throws when used outside a provider', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/within AuthProvider/);
    err.mockRestore();
  });
});
