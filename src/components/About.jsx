import { Award, Footprints, Target } from 'lucide-react'
import { useReveal } from '../lib/useReveal'

const ICONS = [Award, Footprints, Target]

export default function About({ bio, stats }) {
  const ref = useReveal()

  return (
    <section id="about" className="bg-white py-20 sm:py-28">
      <div ref={ref} className="container-x reveal">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          {/* photo + stats */}
          <div className="order-2 lg:order-1">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] shadow-card">
              <img
                src="/images/about.jpg"
                alt="Coach Eli"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextSibling.style.display = 'flex'
                }}
              />
              <div className="absolute inset-0 hidden items-center justify-center bg-forest-50 text-center text-forest/50">
                <span className="px-8 text-sm">Add <code>/public/images/about.jpg</code></span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <div className="font-display text-2xl text-forest">{s.value}</div>
                  <div className="mt-1 text-xs font-medium text-forest-700/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* copy */}
          <div className="order-1 lg:order-2">
            <span className="eyebrow">About Eli</span>
            <h2 className="mt-4 text-4xl text-forest sm:text-5xl">{bio.name}</h2>

            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-forest-900/80">
              {bio.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-1">
              {bio.highlights.map((h, i) => {
                const Icon = ICONS[i % ICONS.length]
                return (
                  <div key={h.title} className="flex gap-4 rounded-2xl border border-forest/8 p-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest text-lime">
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3 className="font-display text-base text-forest">{h.title}</h3>
                      <p className="mt-0.5 text-sm text-forest-900/70">{h.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
