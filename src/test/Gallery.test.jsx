import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Gallery from '../components/Gallery.jsx'

const items = [
  { id: 'g1', src: '/a.jpg', alt: 'Alpha', caption: 'First' }, // featured (i%5===0)
  { id: 'g2', src: '/b.jpg', alt: 'Beta' }, // no caption
  { src: '/c.jpg' }, // no id (-> index key) and no alt (-> 'Tennis' fallback)
]

describe('Gallery', () => {
  it('returns nothing when the gallery is empty', () => {
    const { container } = render(<Gallery gallery={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('returns nothing when gallery is undefined', () => {
    const { container } = render(<Gallery />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders thumbnails and dims a broken image', () => {
    render(<Gallery gallery={items} />)
    const alpha = screen.getByAltText('Alpha')
    expect(alpha).toBeInTheDocument()
    fireEvent.error(alpha)
    expect(alpha.style.opacity).toBe('0.15')
    // caption only renders when present
    expect(screen.getByText('First')).toBeInTheDocument()
    // item without alt uses the 'Tennis' fallback
    expect(screen.getByAltText('Tennis')).toBeInTheDocument()
  })

  it('opens and closes the lightbox', () => {
    render(<Gallery gallery={items} />)
    // open by clicking the first thumbnail button
    fireEvent.click(screen.getByAltText('Alpha').closest('button'))
    // lightbox shows a large image with the same alt
    const large = screen.getAllByAltText('Alpha').find((n) => n.className.includes('max-h'))
    expect(large).toBeTruthy()
    // clicking the image itself does not close (stopPropagation)
    fireEvent.click(large)
    expect(
      screen.getAllByAltText('Alpha').some((n) => n.className.includes('max-h'))
    ).toBe(true)
    // clicking the backdrop closes
    fireEvent.click(large.parentElement)
    expect(
      screen.queryAllByAltText('Alpha').some((n) => n.className.includes('max-h'))
    ).toBe(false)
  })
})
