import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const state = vi.hoisted(() => ({ auth: { isOwner: false, loading: false } }))
vi.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => state.auth,
}))

import ProtectedRoute from '../components/ProtectedRoute.jsx'

function renderAt() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <div>secret dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  state.auth = { isOwner: false, loading: false }
})

describe('ProtectedRoute', () => {
  it('shows a spinner while loading', () => {
    state.auth = { isOwner: false, loading: true }
    const { container } = renderAt()
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('redirects to /login when not the owner', () => {
    state.auth = { isOwner: false, loading: false }
    renderAt()
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('renders children for the owner', () => {
    state.auth = { isOwner: true, loading: false }
    renderAt()
    expect(screen.getByText('secret dashboard')).toBeInTheDocument()
  })
})
