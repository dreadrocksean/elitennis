import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const saveSiteContent = vi.hoisted(() => vi.fn())
vi.mock('../lib/useSiteContent', () => ({ saveSiteContent }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('react-hot-toast', () => ({ default: toast }))

import GalleryAdmin from '../components/admin/GalleryAdmin.jsx'

const content = () => ({
  gallery: [
    { id: 'g1', src: '/a.jpg', alt: 'A', caption: 'first' },
    { id: 'g2', src: '/b.jpg', alt: 'B', caption: 'second' },
  ],
})

beforeEach(() => {
  saveSiteContent.mockReset()
  toast.success.mockReset()
  toast.error.mockReset()
})

describe('GalleryAdmin', () => {
  it('edits, reorders, adds, removes and saves', async () => {
    saveSiteContent.mockResolvedValue()
    const { container } = render(<GalleryAdmin content={content()} />)

    // edit the first image's URL, alt and caption
    fireEvent.change(screen.getByDisplayValue('/a.jpg'), { target: { value: '/new.jpg' } })
    fireEvent.change(screen.getByDisplayValue('A'), { target: { value: 'Alpha' } })
    fireEvent.change(screen.getByDisplayValue('first'), { target: { value: 'First!' } })
    // dim a broken thumbnail
    const thumb = container.querySelector('img')
    fireEvent.error(thumb)
    expect(thumb.style.opacity).toBe('0.2')

    // move first down then back up (covers both directions + a real swap)
    fireEvent.click(screen.getAllByLabelText('Move down')[0])
    fireEvent.click(screen.getAllByLabelText('Move up')[1])
    // boundary no-ops: up on first, down on last
    fireEvent.click(screen.getAllByLabelText('Move up')[0])
    fireEvent.click(screen.getAllByLabelText('Move down')[1])

    // add a photo
    fireEvent.click(screen.getByRole('button', { name: /Add photo/i }))
    // remove one (icon-only trash buttons are the rightmost in each row)
    const trash = [...container.querySelectorAll('button')].filter((b) => !b.textContent.trim())
    fireEvent.click(trash.at(-1))

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Gallery updated.'))
  })

  it('handles an empty gallery and toasts the error message', async () => {
    saveSiteContent.mockRejectedValue(new Error('bad'))
    render(<GalleryAdmin content={{}} />) // gallery undefined -> [] fallback
    fireEvent.click(screen.getByRole('button', { name: /Add photo/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('bad'))
  })

  it('falls back to a generic error message', async () => {
    saveSiteContent.mockRejectedValue({})
    render(<GalleryAdmin content={content()} />)
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Save failed.'))
  })

  it('re-syncs when the content prop changes', () => {
    const { rerender } = render(<GalleryAdmin content={content()} />)
    rerender(<GalleryAdmin content={{ gallery: [{ id: 'z', src: '/z.jpg', alt: 'Z', caption: 'zed' }] }} />)
    expect(screen.getByDisplayValue('/z.jpg')).toBeInTheDocument()
  })
})
