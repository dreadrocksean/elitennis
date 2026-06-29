import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'

export default function Hero({ hero, pricing }) {
  return (
    <section className="relative overflow-hidden bg-forest pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* decorative lime slash */}
      <div className="pointer-events-none absolute -right-24 top-0 h-[120%] w-2/3 -rotate-12 bg-lime/10" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-lime/10 blur-3xl" />

      <div className="container-x relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-fade-up">
          <span className="eyebrow bg-lime/15 text-lime">
            <Star size={13} className="fill-lime" /> {hero.badge}
          </span>

          <h1 className="mt-6 font-display text-5xl leading-[0.95] text-white sm:text-6xl lg:text-7xl">
            {hero.title.split(' ').map((w, i) => (
              <span key={i} className={i === hero.title.split(' ').length - 1 ? 'text-lime' : ''}>
                {w}{' '}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
            {hero.subtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to="/book" className="btn-lime text-base">
              {hero.ctaPrimary} <ArrowRight size={18} />
            </Link>
            <a href="#about" className="btn-ghost border-white/25 bg-transparent text-white hover:border-lime">
              {hero.ctaSecondary}
            </a>
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm text-white/70">
            <div>
              <span className="block font-display text-2xl text-white">{pricing?.price || '$40'}</span>
              {pricing?.unit || '/ hour'}
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div>
              <span className="block font-display text-2xl text-white">Kids & Adults</span>
              all skill levels
            </div>
          </div>
        </div>

        {/* hero image card */}
        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-lime/20 shadow-glow">
            <img
              src="/images/hero.jpg"
              alt="Coach Eli on the tennis court"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextSibling.style.display = 'flex'
              }}
            />
            <div className="absolute inset-0 hidden items-center justify-center bg-forest-600 text-center text-white/60">
              <span className="px-8 text-sm">Add <code>/public/images/hero.jpg</code></span>
            </div>
          </div>

          <div className="absolute -bottom-5 -left-5 rounded-2xl bg-lime px-5 py-3 text-forest shadow-card">
            <p className="font-display text-lg leading-none">State Champion</p>
            <p className="text-xs font-medium">2024 Team · 4th Singles</p>
          </div>
        </div>
      </div>
    </section>
  )
}
