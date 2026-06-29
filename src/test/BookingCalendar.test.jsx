import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BookingCalendar from '../components/BookingCalendar.jsx'

const allDays = {
  0: ['16:00', '17:00'],
  1: ['16:00', '17:00'],
  2: ['16:00', '17:00'],
  3: ['16:00', '17:00'],
  4: ['16:00', '17:00'],
  5: ['16:00', '17:00'],
  6: ['16:00', '17:00'],
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 11, 15, 9, 0)) // Tue Dec 15 2026
})
afterEach(() => vi.useRealTimers())

const availability = {
  weekly: allDays,
  blackouts: ['2026-12-25'],
  leadHours: 0,
}

describe('BookingCalendar navigation', () => {
  it('disables previous at the current month and wraps across year boundaries', () => {
    render(
      <BookingCalendar
        availability={availability}
        bookings={[]}
        value={null}
        onChange={() => {}}
      />
    )
    expect(screen.getByText('December 2026')).toBeInTheDocument()
    const prev = screen.getByLabelText('Previous month')
    const next = screen.getByLabelText('Next month')
    expect(prev).toBeDisabled()

    fireEvent.click(next) // Dec -> Jan next year
    expect(screen.getByText('January 2027')).toBeInTheDocument()
    expect(screen.getByLabelText('Previous month')).toBeEnabled()

    fireEvent.click(screen.getByLabelText('Previous month')) // Jan -> Dec prev year
    expect(screen.getByText('December 2026')).toBeInTheDocument()
  })

  it('navigates within the same year', () => {
    render(
      <BookingCalendar availability={availability} bookings={[]} value={null} onChange={() => {}} />
    )
    fireEvent.click(screen.getByLabelText('Next month'))
    fireEvent.click(screen.getByLabelText('Next month'))
    expect(screen.getByText('February 2027')).toBeInTheDocument()
    // previous within the same year (m-1 >= 0 branch)
    fireEvent.click(screen.getByLabelText('Previous month'))
    expect(screen.getByText('January 2027')).toBeInTheDocument()
  })
})

describe('BookingCalendar slots', () => {
  it('selects a day, hiding taken slots, and selects a time', () => {
    const onChange = vi.fn()
    // 16:00 on Dec 16 is taken -> only 17:00 remains
    const bookings = [{ date: '2026-12-16', time: '16:00', status: 'pending' }]
    const { rerender } = render(
      <BookingCalendar availability={availability} bookings={bookings} value={null} onChange={onChange} />
    )
    expect(screen.getByText('Select a day')).toBeInTheDocument()

    fireEvent.click(screen.getByText('16'))
    expect(onChange).toHaveBeenCalledWith({ date: '2026-12-16', time: null })

    rerender(
      <BookingCalendar
        availability={availability}
        bookings={bookings}
        value={{ date: '2026-12-16', time: null }}
        onChange={onChange}
      />
    )
    expect(screen.getByText('Pick a time')).toBeInTheDocument()
    expect(screen.queryByText('4:00 PM')).not.toBeInTheDocument() // taken
    const slot = screen.getByText('5:00 PM')
    fireEvent.click(slot)
    expect(onChange).toHaveBeenCalledWith({ date: '2026-12-16', time: '17:00' })

    rerender(
      <BookingCalendar
        availability={availability}
        bookings={bookings}
        value={{ date: '2026-12-16', time: '17:00' }}
        onChange={onChange}
      />
    )
    expect(screen.getByText('5:00 PM')).toHaveClass('bg-forest')
  })

  it('shows the empty message for a blackout date', () => {
    render(
      <BookingCalendar
        availability={availability}
        bookings={[]}
        value={{ date: '2026-12-25', time: null }}
        onChange={() => {}}
      />
    )
    expect(screen.getByText(/No open times left/)).toBeInTheDocument()
  })

  it('filters out slots inside the lead-time window', () => {
    // leadHours 48 with a value on tomorrow -> all slots too soon -> empty
    render(
      <BookingCalendar
        availability={{ weekly: allDays, leadHours: 48 }}
        bookings={[]}
        value={{ date: '2026-12-16', time: null }}
        onChange={() => {}}
      />
    )
    expect(screen.getByText(/No open times left/)).toBeInTheDocument()
  })

  it('applies the default lead window when leadHours is missing', () => {
    // no leadHours -> `?? 12`; a far-future slot survives the filter and renders
    render(
      <BookingCalendar
        availability={{ weekly: allDays }}
        bookings={[]}
        value={{ date: '2026-12-20', time: null }}
        onChange={() => {}}
      />
    )
    expect(screen.getByText('4:00 PM')).toBeInTheDocument()
  })

  it('handles sparse availability (missing weekly/blackouts, default lead)', () => {
    // no weekly entry, no blackouts, no leadHours -> defaults apply, day has no slots
    render(
      <BookingCalendar
        availability={{ weekly: {} }}
        bookings={[]}
        value={{ date: '2026-12-20', time: null }}
        onChange={() => {}}
      />
    )
    expect(screen.getByText(/No open times left/)).toBeInTheDocument()
  })
})
