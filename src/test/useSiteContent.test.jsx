import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const state = vi.hoisted(() => ({ configured: true, mode: 'data', snap: null, unsub: () => {} }))

vi.mock('../lib/firebase', () => ({
  db: { __db: true },
  get firebaseConfigured() {
    return state.configured
  },
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...a) => ({ ref: 'doc', a })),
  onSnapshot: vi.fn((ref, cb, errCb) => {
    if (state.mode === 'error') errCb(new Error('denied'))
    else cb(state.snap)
    return state.unsub
  }),
  setDoc: vi.fn(async () => {}),
}))

import { onSnapshot, setDoc } from 'firebase/firestore'
import { useSiteContent, saveSiteContent } from '../lib/useSiteContent'
import { defaultContent } from '../data/siteContent'

beforeEach(() => {
  state.configured = true
  state.mode = 'data'
  state.snap = null
  state.unsub = vi.fn()
})

describe('useSiteContent', () => {
  it('merges Firestore data over the defaults when the doc exists', () => {
    state.snap = { exists: () => true, data: () => ({ hero: { title: 'Custom' } }) }
    const { result } = renderHook(() => useSiteContent())
    expect(result.current.content.hero).toEqual({ title: 'Custom' })
    // untouched default fields remain
    expect(result.current.content.pricing).toEqual(defaultContent.pricing)
    expect(result.current.loading).toBe(false)
  })

  it('uses defaults when the doc does not exist', () => {
    state.snap = { exists: () => false, data: () => null }
    const { result } = renderHook(() => useSiteContent())
    expect(result.current.content).toBe(defaultContent)
  })

  it('stops loading on a snapshot error', () => {
    state.mode = 'error'
    const { result } = renderHook(() => useSiteContent())
    expect(result.current.loading).toBe(false)
    expect(result.current.content).toBe(defaultContent)
  })

  it('skips Firestore when not configured', () => {
    state.configured = false
    const { result } = renderHook(() => useSiteContent())
    expect(onSnapshot).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })
})

describe('saveSiteContent', () => {
  it('merges a partial update', async () => {
    await saveSiteContent({ gallery: [] })
    expect(setDoc).toHaveBeenCalledWith(expect.anything(), { gallery: [] }, { merge: true })
  })
})
