import { Link } from 'react-router-dom'
import { ArrowRight, Phone } from 'lucide-react'
import { CONTACT } from '../data/siteContent'
import { useReveal } from '../lib/useReveal'

export default function CtaBand() {
  const ref = useReveal()
  return (
    <section className="bg-white py-16">
      <div ref={ref} className="container-x reveal">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-lime px-8 py-14 text-center sm:px-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-forest/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-forest/10" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-4xl text-forest sm:text-5xl">
              Ready to level up your game?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-forest-900/70">
              Lock in your first session today. Pick a time that works for you and pay
              securely online — it takes two minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/book" className="btn-primary text-base">
                Book a Session <ArrowRight size={18} />
              </Link>
              <a href={CONTACT.phoneHref} className="btn-ghost text-base">
                <Phone size={17} /> {CONTACT.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
