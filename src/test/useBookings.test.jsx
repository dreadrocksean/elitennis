import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mutable test state shared with the hoisted module mocks.
const state = vi.hoisted(() => ({ configured: true, snap: null, unsub: () => {} }))

vi.mock('../lib/firebase', () => ({
  db: { __db: true },
  get firebaseConfigured() {
    return state.configured
  },
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...a) => ({ ref: 'collection', a })),
  doc: vi.fn((...a) => ({ ref: 'doc', a })),
  query: vi.fn((...a) => ({ ref: 'query', a })),
  where: vi.fn((...a) => ({ ref: 'where', a })),
  onSnapshot: vi.fn((ref, cb) => {
    cb(state.snap)
    return state.unsub
  }),
  setDoc: vi.fn(async () => {}),
  deleteDoc: vi.fn(async () => {}),
}))

import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import {
  useAvailability,
  useBookings,
  saveAvailability,
  slotId,
  createPendingBooking,
  deleteBooking,
  defaultAvailability,
} from '../lib/useBookings'

beforeEach(() => {
  state.configured = true
  state.snap = null
  state.unsub = vi.fn()
})

describe('useAvailability', () => {
  it('returns Firestore data when the doc exists', () => {
    const custom = { weekly: { 1: ['10:00'] }, blackouts: ['2026-07-04'], leadHours: 6 }
    state.snap = { exists: () => true, data: () => custom }
    const { result } = renderHook(() => useAvailability())
    expect(result.current.availability).toEqual(custom)
    expect(result.current.loading).toBe(false)
  })

  it('falls back to defaults when the doc is missing', () => {
    state.snap = { exists: () => false, data: () => null }
    const { result } = renderHook(() => useAvailability())
    expect(result.current.availability).toBe(defaultAvailability)
  })

  it('skips Firestore and returns defaults when not configured', () => {
    state.configured = false
    const { result } = renderHook(() => useAvailability())
    expect(onSnapshot).not.toHaveBeenCalled()
    expect(result.current.availability).toBe(defaultAvailability)
    expect(result.current.loading).toBe(false)
  })
})

describe('useBookings', () => {
  it('range-queries by month when a filter is given', () => {
    state.snap = { docs: [{ id: '2026-07-06_16:00', data: () => ({ name: 'Sam' }) }] }
    const { result } = renderHook(() => useBookings('2026-07'))
    expect(query).toHaveBeenCalled()
    expect(where).toHaveBeenCalledWith('date', '>=', '2026-07-01')
    expect(where).toHaveBeenCalledWith('date', '<=', '2026-07-31')
    expect(result.current.bookings).toEqual([{ id: '2026-07-06_16:00', name: 'Sam' }])
  })

  it('queries the whole collection when no filter is given', () => {
    state.snap = { docs: [] }
    renderHook(() => useBookings(undefined))
    expect(collection).toHaveBeenCalledWith({ __db: true }, 'bookings')
  })

  it('skips Firestore when not configured', () => {
    state.configured = false
    const { result } = renderHook(() => useBookings('2026-07'))
    expect(result.current.loading).toBe(false)
    expect(result.current.bookings).toEqual([])
  })
})

describe('writes', () => {
  it('slotId joins date and time', () => {
    expect(slotId('2026-07-06', '16:00')).toBe('2026-07-06_16:00')
  })

  it('saveAvailability merges into the availability doc', async () => {
    await saveAvailability({ leadHours: 8 })
    expect(setDoc).toHaveBeenCalledWith(expect.anything(), { leadHours: 8 }, { merge: true })
  })

  it('createPendingBooking writes a pending hold and returns the id', async () => {
    const id = await createPendingBooking({
      date: '2026-07-06',
      time: '16:00',
      name: 'Sam',
      email: 'sam@example.com',
      phone: '913',
      notes: 'lefty',
    })
    expect(id).toBe('2026-07-06_16:00')
    const payload = setDoc.mock.calls.at(-1)[1]
    expect(payload).toMatchObject({
      status: 'pending',
      amount: 4000,
      phone: '913',
      notes: 'lefty',
    })
    expect(typeof payload.createdAt).toBe('string')
  })

  it('createPendingBooking defaults optional phone/notes to empty strings', async () => {
    await createPendingBooking({
      date: '2026-07-07',
      time: '17:00',
      name: 'Pat',
      email: 'pat@example.com',
    })
    const payload = setDoc.mock.calls.at(-1)[1]
    expect(payload.phone).toBe('')
    expect(payload.notes).toBe('')
  })

  it('deleteBooking removes the doc', async () => {
    await deleteBooking('2026-07-06_16:00')
    expect(deleteDoc).toHaveBeenCalled()
  })
})
