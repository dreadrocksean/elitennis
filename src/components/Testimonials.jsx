import { Star, Quote } from 'lucide-react';
import { useReveal } from '../lib/useReveal';

const Testimonials = ({ testimonials }) => {
  const ref = useReveal();
  if (!testimonials?.length) return null;

  return (
    <section id="testimonials" className="bg-forest py-20 text-white sm:py-28">
      <div ref={ref} className="container-x reveal">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow bg-lime/15 text-lime">Reviews</span>
          <h2 className="mt-4 text-4xl text-white sm:text-5xl">What students say</h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure
              key={t.id || i}
              className="relative rounded-3xl bg-white/5 p-7 ring-1 ring-white/10 backdrop-blur"
            >
              <Quote className="absolute right-6 top-6 text-lime/30" size={40} />
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating ?? 5 }).map((_, s) => (
                  <Star key={s} size={16} className="fill-lime text-lime" />
                ))}
              </div>
              <blockquote className="mt-4 text-[15px] leading-relaxed text-white/85">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 border-t border-white/10 pt-4">
                <div className="font-display text-base text-lime">{t.name}</div>
                <div className="text-xs text-white/60">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
