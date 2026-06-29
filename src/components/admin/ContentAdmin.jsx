import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Save, Plus, Trash2, Loader2 } from 'lucide-react'
import { Panel, Field } from './AdminShell.jsx'
import { saveSiteContent } from '../../lib/useSiteContent'

export default function ContentAdmin({ content }) {
  const [hero, setHero] = useState(content.hero)
  const [bio, setBio] = useState(content.bio)
  const [pricing, setPricing] = useState(content.pricing)
  const [stats, setStats] = useState(content.stats)
  const [saving, setSaving] = useState(false)

  // Re-sync if Firestore pushes a fresh snapshot.
  useEffect(() => setHero(content.hero), [content.hero])
  useEffect(() => setBio(content.bio), [content.bio])
  useEffect(() => setPricing(content.pricing), [content.pricing])
  useEffect(() => setStats(content.stats), [content.stats])

  async function save() {
    setSaving(true)
    try {
      await saveSiteContent({ hero, bio, pricing, stats })
      toast.success('Content saved — site updates live.')
    } catch (e) {
      toast.error(e.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const setBioPara = (i, v) =>
    setBio({ ...bio, paragraphs: bio.paragraphs.map((p, idx) => (idx === i ? v : p)) })
  const setHighlight = (i, key, v) =>
    setBio({
      ...bio,
      highlights: bio.highlights.map((h, idx) => (idx === i ? { ...h, [key]: v } : h)),
    })
  const setStat = (i, key, v) =>
    setStats(stats.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)))

  return (
    <div className="space-y-6">
      <Panel
        title="Hero"
        description="The first thing visitors see at the top of the homepage."
        action={
          <button onClick={save} disabled={saving} className="btn-primary h-10 px-5 py-0 text-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save all
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Badge">
            <input className="input" value={hero.badge} onChange={(e) => setHero({ ...hero, badge: e.target.value })} />
          </Field>
          <Field label="Title">
            <input className="input" value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
          </Field>
          <Field label="Subtitle" >
            <textarea className="input min-h-[80px]" value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary button">
              <input className="input" value={hero.ctaPrimary} onChange={(e) => setHero({ ...hero, ctaPrimary: e.target.value })} />
            </Field>
            <Field label="Secondary button">
              <input className="input" value={hero.ctaSecondary} onChange={(e) => setHero({ ...hero, ctaSecondary: e.target.value })} />
            </Field>
          </div>
        </div>
      </Panel>

      <Panel title="About / Bio" description="Your story and the three highlight cards.">
        <Field label="Heading">
          <input className="input" value={bio.name} onChange={(e) => setBio({ ...bio, name: e.target.value })} />
        </Field>
        <div className="mt-4 space-y-3">
          {bio.paragraphs.map((p, i) => (
            <Field key={i} label={`Paragraph ${i + 1}`}>
              <textarea className="input min-h-[90px]" value={p} onChange={(e) => setBioPara(i, e.target.value)} />
            </Field>
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {bio.highlights.map((h, i) => (
            <div key={i} className="rounded-2xl border border-forest/10 p-3">
              <input className="input mb-2 font-semibold" value={h.title} onChange={(e) => setHighlight(i, 'title', e.target.value)} />
              <textarea className="input min-h-[70px] text-sm" value={h.body} onChange={(e) => setHighlight(i, 'body', e.target.value)} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Stats strip" description="Four small credibility stats next to your photo.">
        <div className="grid gap-3 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl border border-forest/10 p-3">
              <input className="input mb-2 text-center font-display" value={s.value} onChange={(e) => setStat(i, 'value', e.target.value)} />
              <input className="input text-center text-xs" value={s.label} onChange={(e) => setStat(i, 'label', e.target.value)} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Label"><input className="input" value={pricing.title} onChange={(e) => setPricing({ ...pricing, title: e.target.value })} /></Field>
          <Field label="Price"><input className="input" value={pricing.price} onChange={(e) => setPricing({ ...pricing, price: e.target.value })} /></Field>
          <Field label="Unit"><input className="input" value={pricing.unit} onChange={(e) => setPricing({ ...pricing, unit: e.target.value })} /></Field>
        </div>
        <Field label="Note" >
          <input className="input mt-4" value={pricing.note} onChange={(e) => setPricing({ ...pricing, note: e.target.value })} />
        </Field>
        <div className="mt-4">
          <span className="label">Perks</span>
          <div className="space-y-2">
            {pricing.perks.map((perk, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input"
                  value={perk}
                  onChange={(e) => setPricing({ ...pricing, perks: pricing.perks.map((p, idx) => (idx === i ? e.target.value : p)) })}
                />
                <button
                  onClick={() => setPricing({ ...pricing, perks: pricing.perks.filter((_, idx) => idx !== i) })}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-forest/15 text-forest-700 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setPricing({ ...pricing, perks: [...pricing.perks, 'New perk'] })}
              className="btn-ghost mt-1 h-9 px-4 py-0 text-xs"
            >
              <Plus size={14} /> Add perk
            </button>
          </div>
        </div>
      </Panel>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save all changes
        </button>
      </div>
    </div>
  )
}
