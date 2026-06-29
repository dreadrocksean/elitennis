import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const nav = vi.hoisted(() => ({ spy: vi.fn() }))
vi.mock('react-router-dom', async (o) => ({ ...(await o()), useNavigate: () => nav.spy }))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: toast }))

const auth = vi.hoisted(() => ({ value: {} }))
vi.mock('../contexts/AuthContext.jsx', () => ({ useAuth: () => auth.value }))

import Login from '../pages/Login.jsx'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<div>admin home</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function fillAndSubmit() {
  fireEvent.change(screen.getByPlaceholderText('eli@elitenniskc.com'), {
    target: { value: ' eli@kc.com ' },
  })
  fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secret' } })
  fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))
}

beforeEach(() => {
  nav.spy.mockClear()
  toast.success.mockClear()
  toast.error.mockClear()
  auth.value = { login: vi.fn(), isOwner: false, user: null }
})

describe('Login', () => {
  it('redirects an authenticated owner to /admin', () => {
    auth.value = { login: vi.fn(), isOwner: true, user: { email: 'eli@kc.com' } }
    renderLogin()
    expect(screen.getByText('admin home')).toBeInTheDocument()
  })

  it('logs in successfully, toasts and navigates', async () => {
    auth.value.login = vi.fn().mockResolvedValue({})
    renderLogin()
    fillAndSubmit()
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Welcome back, Coach!'))
    expect(auth.value.login).toHaveBeenCalledWith('eli@kc.com', 'secret')
    expect(nav.spy).toHaveBeenCalledWith('/admin')
  })

  it('shows a friendly message for invalid credentials', async () => {
    auth.value.login = vi.fn().mockRejectedValue({ code: 'auth/invalid-credential' })
    renderLogin()
    fillAndSubmit()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid email or password.'))
  })

  it('surfaces an unexpected error message', async () => {
    auth.value.login = vi.fn().mockRejectedValue(new Error('network down'))
    renderLogin()
    fillAndSubmit()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('network down'))
  })

  it('falls back to a generic message when error has no code or message', async () => {
    auth.value.login = vi.fn().mockRejectedValue({})
    renderLogin()
    fillAndSubmit()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Login failed.'))
  })

  it('warns when the signed-in account is not the owner', () => {
    auth.value = { login: vi.fn(), isOwner: false, user: { email: 'guest@kc.com' } }
    renderLogin()
    expect(screen.getByText(/isn't the registered owner/)).toBeInTheDocument()
  })
})
