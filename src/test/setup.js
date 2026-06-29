import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// ── Controllable IntersectionObserver ───────────────────────────────────────
// useReveal relies on IntersectionObserver, which jsdom doesn't implement.
// Tests can grab the most recent instance via `globalThis.__io` and drive its
// callback to simulate elements entering/leaving the viewport.
class MockIntersectionObserver {
  constructor(cb, options) {
    this.cb = cb
    this.options = options
    this.observed = []
    this.disconnected = false
    globalThis.__io = this
  }
  observe(el) {
    this.observed.push(el)
  }
  unobserve(el) {
    this.observed = this.observed.filter((e) => e !== el)
  }
  disconnect() {
    this.disconnected = true
  }
  // helper: fire the callback for the first observed element
  trigger(isIntersecting) {
    this.cb([{ isIntersecting, target: this.observed[0] }], this)
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver

// jsdom has no scrollTo; some components attach scroll listeners.
globalThis.scrollTo = vi.fn()

afterEach(() => {
  cleanup()
  globalThis.__io = undefined
})
