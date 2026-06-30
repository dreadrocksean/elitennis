import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { useReveal } from '../lib/useReveal';

const Pricing = ({ pricing }) => {
  const ref = useReveal();

  return (
    <section id="pricing" className="bg-forest-50 py-20 sm:py-28">
      <div ref={ref} className="container-x reveal">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Simple Pricing</span>
          <h2 className="mt-4 text-4xl text-forest sm:text-5xl">
            One rate. Every session tailored to you.
          </h2>
          <p className="mt-4 text-forest-900/70">
            No packages to puzzle over — just focused, one-on-one coaching that meets you where you
            are.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          <div className="card overflow-hidden">
            <div className="bg-forest px-8 py-8 text-center text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime">
                {pricing.title}
              </p>
              <div className="mt-3 flex items-end justify-center gap-1">
                <span className="font-display text-6xl text-white">{pricing.price}</span>
                <span className="mb-2 text-lg text-white/70">{pricing.unit}</span>
              </div>
              <p className="mx-auto mt-3 max-w-xs text-sm text-white/70">{pricing.note}</p>
            </div>

            <div className="px-8 py-8">
              <ul className="space-y-3">
                {pricing.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-sm text-forest-900/80">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime text-forest">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <Link to="/book" className="btn-primary mt-8 w-full text-base">
                Book Your Session <ArrowRight size={18} />
              </Link>
              <p className="mt-3 text-center text-xs text-forest-900/50">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
