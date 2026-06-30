import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import About from '../components/About.jsx';
import Pricing from '../components/Pricing.jsx';
import Testimonials from '../components/Testimonials.jsx';
import Footer from '../components/Footer.jsx';
import CtaBand from '../components/CtaBand.jsx';
import { defaultContent, CONTACT } from '../data/siteContent';

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Hero', () => {
  it('renders the hero copy, db-driven pricing, and highlights the last word', () => {
    wrap(<Hero hero={defaultContent.hero} pricing={{ price: '$55', unit: '/ session' }} />);
    expect(screen.getByText(defaultContent.hero.badge)).toBeInTheDocument();
    expect(screen.getByText(defaultContent.hero.subtitle)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Book a Session/i })).toBeInTheDocument();
    // pricing reads from props (Firestore content)
    expect(screen.getByText('$55')).toBeInTheDocument();
    expect(screen.getByText('/ session')).toBeInTheDocument();
    // last word of the title is rendered in the lime span
    const last = screen.getByText('Lessons', { exact: false });
    expect(last).toHaveClass('text-lime');
  });

  it('falls back to default pricing when none is provided', () => {
    wrap(<Hero hero={defaultContent.hero} />);
    expect(screen.getByText('$40')).toBeInTheDocument();
    expect(screen.getByText('/ hour')).toBeInTheDocument();
  });

  it('hides the image and shows the placeholder on error', () => {
    wrap(<Hero hero={defaultContent.hero} />);
    const img = screen.getByAltText('Coach Eli on the tennis court');
    fireEvent.error(img);
    expect(img.style.display).toBe('none');
    expect(img.nextSibling.style.display).toBe('flex');
  });
});

describe('About', () => {
  it('renders bio paragraphs, highlights and stats', () => {
    wrap(<About bio={defaultContent.bio} stats={defaultContent.stats} />);
    expect(screen.getByText(defaultContent.bio.name)).toBeInTheDocument();
    defaultContent.bio.highlights.forEach((h) =>
      expect(screen.getByText(h.title)).toBeInTheDocument(),
    );
    defaultContent.stats.forEach((s) => expect(screen.getByText(s.label)).toBeInTheDocument());
  });

  it('shows the placeholder when the about image fails', () => {
    wrap(<About bio={defaultContent.bio} stats={defaultContent.stats} />);
    const img = screen.getByAltText('Coach Eli');
    fireEvent.error(img);
    expect(img.style.display).toBe('none');
    expect(img.nextSibling.style.display).toBe('flex');
  });
});

describe('Pricing', () => {
  it('renders the price and every perk', () => {
    wrap(<Pricing pricing={defaultContent.pricing} />);
    expect(screen.getByText(defaultContent.pricing.price)).toBeInTheDocument();
    defaultContent.pricing.perks.forEach((p) => expect(screen.getByText(p)).toBeInTheDocument());
  });
});

describe('Testimonials', () => {
  it('returns nothing when there are no testimonials', () => {
    const { container } = wrap(<Testimonials testimonials={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('returns nothing when testimonials is undefined', () => {
    const { container } = wrap(<Testimonials />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders cards with the right star count and falls back to 5 stars / index key', () => {
    const items = [
      { id: 't1', name: 'Sarah', role: 'Parent', quote: 'Great', rating: 3 },
      { name: 'NoId', role: 'Adult', quote: 'Also great' }, // no id, no rating
    ];
    wrap(<Testimonials testimonials={items} />);
    const sarah = screen.getByText('Sarah').closest('figure');
    // rating: 3 -> three filled stars (svg.fill-lime, excluding the Quote mark)
    expect(sarah.querySelectorAll('svg.fill-lime')).toHaveLength(3);
    const noId = screen.getByText('NoId').closest('figure');
    expect(noId.querySelectorAll('svg.fill-lime')).toHaveLength(5); // default rating
    expect(screen.getByText(/Also great/)).toBeInTheDocument();
  });
});

describe('Footer', () => {
  it('renders contact details and the current year', () => {
    wrap(<Footer />);
    expect(screen.getByText(CONTACT.phone)).toBeInTheDocument();
    expect(screen.getByText(CONTACT.website)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${new Date().getFullYear()}`))).toBeInTheDocument();
  });
});

describe('CtaBand', () => {
  it('renders the call-to-action with a booking link and phone', () => {
    wrap(<CtaBand />);
    expect(screen.getByRole('link', { name: /Book a Session/i })).toBeInTheDocument();
    expect(screen.getByText(CONTACT.phone)).toBeInTheDocument();
  });
});
