import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useReveal } from '../lib/useReveal';

const Gallery = ({ gallery }) => {
  const ref = useReveal();
  const [active, setActive] = useState(null);

  // Let keyboard users close the lightbox with Escape.
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  if (!gallery?.length) return null;

  return (
    <section id="gallery" className="bg-white py-20 sm:py-28">
      <div ref={ref} className="container-x reveal">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">On the Court</span>
          <h2 className="mt-4 text-4xl text-forest sm:text-5xl">Gallery</h2>
          <p className="mt-4 text-forest-900/70">
            Moments from matches, training, and championship runs.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => setActive(img)}
              className={`group relative overflow-hidden rounded-2xl shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 ${
                i % 5 === 0 ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <div className={`${i % 5 === 0 ? 'aspect-square' : 'aspect-[3/4]'} w-full`}>
                <img
                  src={img.src}
                  alt={img.alt || 'Tennis'}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.opacity = '0.15';
                  }}
                />
              </div>
              {img.caption && (
                <span className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-forest/80 to-transparent p-3 text-left text-xs font-medium text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  {img.caption}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-[60] grid place-items-center bg-forest-900/90 p-6 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <button
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute right-6 top-6 text-white/80 hover:text-lime"
          >
            <X size={28} />
          </button>
          <img
            src={active.src}
            alt={active.alt}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-glow"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};

export default Gallery;
