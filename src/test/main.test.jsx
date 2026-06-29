import { describe, it, expect, vi } from 'vitest'

const root = vi.hoisted(() => ({ render: vi.fn() }))
const createRoot = vi.hoisted(() => vi.fn(() => root))
vi.mock('react-dom/client', () => ({ default: { createRoot }, createRoot }))
vi.mock('../App.jsx', () => ({ default: () => null }))
vi.mock('../contexts/AuthContext.jsx', () => ({ AuthProvider: ({ children }) => children }))
vi.mock('react-hot-toast', () => ({ Toaster: () => null, default: {} }))

describe('main entry', () => {
  it('mounts the app into #root', async () => {
    const el = document.createElement('div')
    el.id = 'root'
    document.body.appendChild(el)

    await import('../main.jsx')

    expect(createRoot).toHaveBeenCalledWith(el)
    expect(root.render).toHaveBeenCalledTimes(1)
  })
})
