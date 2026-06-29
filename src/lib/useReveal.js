import { useEffect, useRef } from 'react'

/** Adds `is-visible` to a `.reveal` element when it scrolls into view. */
export function useReveal(options = {}) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          obs.unobserve(el)
        }
      },
      { threshold: 0.12, ...options }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}
