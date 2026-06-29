import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Save, Loader2, GripVertical } from 'lucide-react'
import { Panel } from './AdminShell.jsx'
import { saveSiteContent } from '../../lib/useSiteContent'

let idc = 0
const newId = () => `g_${Date.now()}_${idc++}`

export default function GalleryAdmin({ content }) {
  const [items, setItems] = useState(content.gallery ?? [])
  const [saving, setSaving] = useState(false)

  useEffect(() => setItems(content.gallery ?? []), [content.gallery])

  const update = (id, key, v) =>
    setItems(items.map((it) => (it.id === id ? { ...it, [key]: v } : it)))
  const remove = (id) => setItems(items.filter((it) => it.id !== id))
  const add = () =>
    setItems([...items, { id: newId(), src: '', alt: '', caption: '' }])

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const copy = [...items]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    setItems(copy)
  }

  async function save() {
    setSaving(true)
    try {
      await saveSiteContent({ gallery: items })
      toast.success('Gallery updated.')
    } catch (e) {
      toast.error(e.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel
      title="Photo Gallery"
      description="Paste an image URL for each photo. Upload images to /public/images or use a hosted URL."
      action={
        <button onClick={save} disabled={saving} className="btn-primary h-10 px-5 py-0 text-sm">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      }
    >
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={it.id} className="flex flex-col gap-3 rounded-2xl border border-forest/10 p-3 sm:flex-row sm:items-center">
            <div className="flex shrink-0 flex-col items-center gap-1 text-forest-700/40">
              <button onClick={() => move(i, -1)} className="hover:text-forest" aria-label="Move up">▲</button>
              <GripVertical size={16} />
              <button onClick={() => move(i, 1)} className="hover:text-forest" aria-label="Move down">▼</button>
            </div>
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-forest-50">
              {it.src && (
                <img src={it.src} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.opacity = '0.2')} />
              )}
            </div>
            <div className="grid flex-1 gap-2 sm:grid-cols-3">
              <input className="input sm:col-span-3" placeholder="Image URL (/images/court-1.jpg)" value={it.src} onChange={(e) => update(it.id, 'src', e.target.value)} />
              <input className="input" placeholder="Alt text" value={it.alt} onChange={(e) => update(it.id, 'alt', e.target.value)} />
              <input className="input sm:col-span-2" placeholder="Caption (optional)" value={it.caption} onChange={(e) => update(it.id, 'caption', e.target.value)} />
            </div>
            <button onClick={() => remove(it.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-forest/15 text-forest-700 hover:bg-red-50 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add} className="btn-ghost mt-4 text-sm">
        <Plus size={16} /> Add photo
      </button>
    </Panel>
  )
}
