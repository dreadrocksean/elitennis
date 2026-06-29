import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { defaultContent } from '../data/siteContent'
import { defaultAvailability } from '../lib/useBookings'

const hooks = vi.hoisted(() => ({
  createPendingBooking: vi.fn(),
  startCheckout: vi.fn(),
  content: null, // set in beforeEach
}))

vi.mock('../lib/useBookings', async (o) => ({
  ...(await o()),
  useAvailability: () => ({ availability: defaultAvailability, loading: false }),
  useBookings: () => ({ bookings: [], loading: false }),
  createPendingBooking: hooks.createPendingBooking,
}))
vi.mock('../lib/useSiteContent', () => ({ useSiteContent: () => ({ content: hooks.content }) }))
vi.mock('../lib/checkout', () => ({ startCheckout: hooks.startCheckout }))
vi.mock('../components/BookingCalendar.jsx', () => ({
  default: ({ onChange }) => (
    <button onClick={() => onChange({ date: '2026-07-10', time: '16:00' })}>pick-slot</button>
  ),
}))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: toast }))

import BookingPage from '../pages/BookingPage.jsx'

const renderPage = () =>
  render(
    <MemoryRouter>
      <BookingPage />
    </MemoryRouter>
  )

function selectSlotAndFill() {
  fireEvent.click(screen.getByText('pick-slot'))
  fireEvent.change(screen.getByPlaceholderText('Jordan Smith'), { target: { value: 'Sam' } })
  fireEvent.change(screen.getByPlaceholderText('you@email.com'), {
    target: { value: 'sam@example.com' },
  })
  fireEvent.change(screen.getByPlaceholderText('(913) 555-0123'), { target: { value: '913' } })
  fireEvent.change(screen.getByPlaceholderText(/Skill level/), { target: { value: 'lefty' } })
}

beforeEach(() => {
  hooks.createPendingBooking.mockReset()
  hooks.startCheckout.mockReset()
  toast.success.mockReset()
  toast.error.mockReset()
  hooks.content = defaultContent
})

describe('BookingPage', () => {
  it('keeps the pay button disabled until a slot and valid details are set', () => {
    renderPage()
    const pay = screen.getByRole('button', { name: /Pay/i })
    expect(pay).toBeDisabled()
    selectSlotAndFill()
    expect(screen.getByRole('button', { name: /Pay/i })).toBeEnabled()
  })

  it('holds the slot and starts checkout on submit', async () => {
    hooks.createPendingBooking.mockResolvedValue('2026-07-10_16:00')
    hooks.startCheckout.mockResolvedValue()
    renderPage()
    selectSlotAndFill()
    fireEvent.click(screen.getByRole('button', { name: /Pay/i }))
    await waitFor(() => expect(hooks.createPendingBooking).toHaveBeenCalled())
    expect(hooks.startCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: '2026-07-10_16:00', name: 'Sam' })
    )
  })

  it('does nothing when submitted without a ready form', () => {
    renderPage()
    fireEvent.submit(screen.getByRole('button', { name: /Pay/i }).closest('form'))
    expect(hooks.createPendingBooking).not.toHaveBeenCalled()
  })

  it('warns and frees the time when the slot was just taken', async () => {
    hooks.createPendingBooking.mockRejectedValue(new Error('Document already exists'))
    renderPage()
    selectSlotAndFill()
    fireEvent.click(screen.getByRole('button', { name: /Pay/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/just taken/)))
  })

  it('shows a generic error for other failures', async () => {
    hooks.createPendingBooking.mockRejectedValue(new Error('network'))
    renderPage()
    selectSlotAndFill()
    fireEvent.click(screen.getByRole('button', { name: /Pay/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('network'))
  })

  it('uses a generic fallback when the error has no message', async () => {
    hooks.createPendingBooking.mockRejectedValue({})
    renderPage()
    selectSlotAndFill()
    fireEvent.click(screen.getByRole('button', { name: /Pay/i }))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.')
    )
  })

  it('falls back to default copy when pricing is absent', () => {
    hooks.content = { ...defaultContent, pricing: undefined }
    renderPage()
    // price fallback "$40" appears on the pay button
    expect(screen.getByRole('button', { name: /Pay \$40/i })).toBeInTheDocument()
    expect(screen.getByText(/your session is \$40/i)).toBeInTheDocument()
  })
})
