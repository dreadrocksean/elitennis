import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Loader2, Star } from 'lucide-react';
import { Panel } from './AdminShell.jsx';
import { saveSiteContent } from '../../lib/useSiteContent';

let idc = 0;
const newId = () => `t_${Date.now()}_${idc++}`;

const TestimonialsAdmin = ({ content }) => {
  const [items, setItems] = useState(content.testimonials ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => setItems(content.testimonials ?? []), [content.testimonials]);

  const update = (id, key, v) =>
    setItems(items.map((it) => (it.id === id ? { ...it, [key]: v } : it)));
  const remove = (id) => setItems(items.filter((it) => it.id !== id));
  const add = () => setItems([...items, { id: newId(), name: '', role: '', quote: '', rating: 5 }]);

  const save = async () => {
    setSaving(true);
    try {
      await saveSiteContent({ testimonials: items });
      toast.success('Testimonials updated.');
    } catch (e) {
      toast.error(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title="Testimonials"
      description="Reviews shown on the homepage. Add, edit, or remove freely."
      action={
        <button onClick={save} disabled={saving} className="btn-primary h-10 px-5 py-0 text-sm">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
        </button>
      }
    >
      <div className="space-y-4">
        {items.map((it) => (
          <div key={it.id} className="rounded-2xl border border-forest/10 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input"
                placeholder="Name"
                value={it.name}
                onChange={(e) => update(it.id, 'name', e.target.value)}
              />
              <input
                className="input"
                placeholder="Role (e.g. Parent of junior player)"
                value={it.role}
                onChange={(e) => update(it.id, 'role', e.target.value)}
              />
            </div>
            <textarea
              className="input mt-3 min-h-[80px]"
              placeholder="Quote"
              value={it.quote}
              onChange={(e) => update(it.id, 'quote', e.target.value)}
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => update(it.id, 'rating', n)}
                    aria-label={`${n} stars`}
                  >
                    <Star
                      size={20}
                      className={n <= (it.rating ?? 5) ? 'fill-lime text-lime' : 'text-forest/20'}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={() => remove(it.id)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="btn-ghost mt-4 text-sm">
        <Plus size={16} /> Add testimonial
      </button>
    </Panel>
  );
};

export default TestimonialsAdmin;
