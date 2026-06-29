import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const saveSiteContent = vi.hoisted(() => vi.fn())
vi.mock('../lib/useSiteContent', () => ({ saveSiteContent }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: toast }))

import ContentAdmin from '../components/admin/ContentAdmin.jsx'
import { defaultContent } from '../data/siteContent'

const clone = () => JSON.parse(JSON.stringify(defaultContent))

beforeEach(() => {
  saveSiteContent.mockReset()
  toast.success.mockReset()
  toast.error.mockReset()
})

function changeEveryField(container) {
  container.querySelectorAll('input, textarea').forEach((el, i) =>
    fireEvent.change(el, { target: { value: `v${i}` } })
  )
}

describe('ContentAdmin', () => {
  it('edits every field, manages perks and saves', async () => {
    saveSiteContent.mockResolvedValue()
    const { container } = render(<ContentAdmin content={clone()} />)
    changeEveryField(container)

    // remove a perk (icon-only button) then add one back
    const trash = [...container.querySelectorAll('button')].filter((b) => !b.textContent.trim())
    fireEvent.click(trash[0])
    fireEvent.click(screen.getByRole('button', { name: /Add perk/i }))

    fireEvent.click(screen.getAllByRole('button', { name: /Save all/i })[0])
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Content saved — site updates live.')
    )
    expect(saveSiteContent).toHaveBeenCalledWith(
      expect.objectContaining({ hero: expect.any(Object), pricing: expect.any(Object) })
    )
  })

  it('toasts the error message on save failure', async () => {
    saveSiteContent.mockRejectedValue(new Error('boom'))
    render(<ContentAdmin content={clone()} />)
    fireEvent.click(screen.getAllByRole('button', { name: /Save all/i })[0])
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('boom'))
  })

  it('falls back to a generic message when the error has none', async () => {
    saveSiteContent.mockRejectedValue({})
    render(<ContentAdmin content={clone()} />)
    fireEvent.click(screen.getAllByRole('button', { name: /Save all/i })[0])
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Save failed.'))
  })

  it('re-syncs local state when the content prop changes', () => {
    const { rerender } = render(<ContentAdmin content={clone()} />)
    const next = clone()
    next.hero.badge = 'FRESH BADGE'
    rerender(<ContentAdmin content={next} />)
    expect(screen.getByDisplayValue('FRESH BADGE')).toBeInTheDocument()
  })
})
