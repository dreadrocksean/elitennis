import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const state = vi.hoisted(() => ({ availability: {} }))
const saveAvailability = vi.hoisted(() => vi.fn())
vi.mock('../lib/useBookings', async (o) => ({
  ...(await o()),
  useAvailability: () => ({ availability: state.availability, loading: false }),
  saveAvailability,
}))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: toast }))

import AvailabilityAdmin from '../components/admin/AvailabilityAdmin.jsx'

beforeEach(() => {
  saveAvailability.mockReset()
  toast.success.mockReset()
  toast.error.mockReset()
  state.availability = {
    weekly: { 0: ['16:00'], 1: ['16:00', '17:00'] },
    blackouts: ['2026-12-25'],
    leadHours: 6,
  }
})

describe('AvailabilityAdmin', () => {
  it('shows singular and plural slot counts', () => {
    const { container } = render(<AvailabilityAdmin />)
    expect(container.textContent).toContain('1 slot')
    expect(container.textContent).toContain('2 slots')
  })

  it('toggles a slot off and back on', () => {
    render(<AvailabilityAdmin />)
    const fourPm = screen.getAllByText('4:00 PM')[0] // Sunday's 16:00 (currently on)
    fireEvent.click(fourPm) // remove
    fireEvent.click(fourPm) // add back (sorted branch)
    // Tuesday has no weekly entry -> exercises the `weekly[dow] || []` fallback
    fireEvent.click(screen.getAllByText('4:00 PM')[2])
  })

  it('adds, dedupes, clears and removes blackout dates', () => {
    render(<AvailabilityAdmin />)
    const dateInput = document.querySelector('input[type="date"]')
    const addBtn = screen.getByRole('button', { name: /^Add$/i })

    // add a new date
    fireEvent.change(dateInput, { target: { value: '2026-12-31' } })
    fireEvent.click(addBtn)
    expect(screen.getByText('2026-12-31')).toBeInTheDocument()

    // empty input is ignored (value was reset after add)
    fireEvent.click(addBtn)

    // duplicate is ignored
    fireEvent.change(dateInput, { target: { value: '2026-12-25' } })
    fireEvent.click(addBtn)

    // remove the original blackout via its X button
    const chip = screen.getByText('2026-12-25').closest('span')
    fireEvent.click(chip.querySelector('button'))
    expect(screen.queryByText('2026-12-25')).not.toBeInTheDocument()
  })

  it('edits lead hours and saves a Number', async () => {
    saveAvailability.mockResolvedValue()
    render(<AvailabilityAdmin />)
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '24' } })
    fireEvent.click(screen.getByRole('button', { name: /Save/i }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Availability saved.'))
    expect(saveAvailability).toHaveBeenCalledWith(expect.objectContaining({ leadHours: 24 }))
  })

  it('toasts the error message on save failure', async () => {
    saveAvailability.mockRejectedValue(new Error('nope'))
    render(<AvailabilityAdmin />)
    fireEvent.click(screen.getByRole('button', { name: /Save/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('nope'))
  })

  it('falls back to a generic error message', async () => {
    saveAvailability.mockRejectedValue({})
    render(<AvailabilityAdmin />)
    fireEvent.click(screen.getByRole('button', { name: /Save/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Save failed.'))
  })

  it('applies defaults when availability fields are missing', () => {
    state.availability = {} // no weekly/blackouts/leadHours
    render(<AvailabilityAdmin />)
    expect(screen.getByText('No blackout dates.')).toBeInTheDocument()
    // default lead hours 12
    expect(document.querySelector('input[type="number"]').value).toBe('12')
  })
})
