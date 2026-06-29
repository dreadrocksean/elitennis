import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { CONTACT } from '../data/siteContent'

const LINKS = [
  { label: 'About', href: '/#about' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Reviews', href: '/#testimonials' },
]

export default function Navbar({ onDark = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Light text only while floating transparently over the dark hero.
  // On light pages, or once scrolled, the bar is solid white with dark text.
  const light = onDark && !scrolled

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        light ? 'bg-transparent' : 'bg-white/85 shadow-card backdrop-blur-md'
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between sm:h-20">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-lime">
            <RacketMark />
          </span>
          <span className={`font-display text-lg tracking-tight ${light ? 'text-white' : 'text-forest'}`}>
            {CONTACT.brand}
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                light ? 'text-white/90 hover:bg-white/10' : 'text-forest-700 hover:bg-forest-50'
              }`}
            >
              {l.label}
            </a>
          ))}
          <Link to="/book" className="btn-lime ml-2">
            Book Now
          </Link>
        </div>

        <button
          className={`grid h-10 w-10 place-items-center rounded-xl md:hidden ${
            light ? 'text-white' : 'text-forest'
          }`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-forest/10 bg-white px-5 pb-6 pt-2 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-base font-medium text-forest-700 hover:bg-forest-50"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => {
              setOpen(false)
              navigate('/book')
            }}
            className="btn-lime mt-2 w-full"
          >
            Book Now
          </button>
        </div>
      )}
    </header>
  )
}

function RacketMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 6l6 6M15 6l-6 6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 15.5V22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
