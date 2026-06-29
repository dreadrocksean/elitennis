import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { defaultContent } from '../data/siteContent'

vi.mock('../lib/useSiteContent', () => ({
  useSiteContent: () => ({ content: defaultContent, loading: false }),
}))

import Home from '../pages/Home.jsx'

describe('Home', () => {
  it('renders the full marketing page', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    expect(screen.getByText(defaultContent.hero.badge)).toBeInTheDocument()
    expect(screen.getByText(defaultContent.bio.highlights[0].title)).toBeInTheDocument()
    // gallery + testimonials seeded from defaults
    expect(screen.getByText(/Moments from matches/)).toBeInTheDocument()
    expect(screen.getByText('What students say')).toBeInTheDocument()
  })
})
