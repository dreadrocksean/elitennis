import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Save, Loader2, Plus, X } from 'lucide-react'
import { Panel, Field } from './AdminShell.jsx'
import { useAvailability, saveAvailability, defaultAvailability } from '../../lib/useBookings'
import { DOW, formatTime } from '../../lib/dateUtils'

// Half-hour options 6:00 AM – 9:00 PM
const TIME_OPTIONS = []
for (let h = 6; h <= 21; h++) {
  for (const m of ['00', '30']) {
    const v = `${String(h).padStart(2, '0')}:${m}`
    TIME_OPTIONS.push(v)
  }
}

export default function AvailabilityAdmin() {
  const { availability } = useAvailability()
  const [weekly, setWeekly] = useState(defaultAvailability.weekly)
  const [blackouts, setBlackouts] = useState([])
  const [leadHours, setLeadHours] = useState(12)
  const [newBlackout, setNewBlackout] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setWeekly(availability.weekly ?? defaultAvailability.weekly)
    setBlackouts(availability.blackouts ?? [])
    setLeadHours(availability.leadHours ?? 12)
  }, [availability])

  const toggleSlot = (dow, time) => {
    const cur = weekly[dow] ?? []
    const next = cur.includes(time) ? cur.filter((t) => t !== time) : [...cur, time].sort()
    setWeekly({ ...weekly, [dow]: next })
  }

  const addBlackout = () => {
    if (!newBlackout || blackouts.includes(newBlackout)) return
    setBlackouts([...blackouts, newBlackout].sort())
    setNewBlackout('')
  }

  async function save() {
    setSaving(true)
    try {
      await saveAvailability({ weekly, blackouts, leadHours: Number(leadHours) })
      toast.success('Availability saved.')
    } catch (e) {
      toast.error(e.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Panel
        title="Weekly availability"
        description="Click the times you want to offer each day. These repeat every week."
        action={
          <button onClick={save} disabled={saving} className="btn-primary h-10 px-5 py-0 text-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          </button>
        }
      >
        <div className="space-y-4">
          {DOW.map((label, dow) => (
            <div key={dow} className="rounded-2xl border border-forest/10 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-sm text-forest">{label}</span>
                <span className="text-xs text-forest-700/50">
                  {(weekly[dow] ?? []).length} slot{(weekly[dow] ?? []).length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TIME_OPTIONS.map((t) => {
                  const on = (weekly[dow] ?? []).includes(t)
                  return (
                    <button
                      key={t}
                      onClick={() => toggleSlot(dow, t)}
                      className={[
                        'rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                        on ? 'bg-forest text-white' : 'bg-forest-50 text-forest-700/70 hover:bg-forest-100',
                      ].join(' ')}
                    >
                      {formatTime(t)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Booking rules & blackout dates">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Minimum notice (hours)" hint="How far ahead a client must book. e.g. 12 = no same-evening bookings.">
            <input
              type="number"
              min="0"
              className="input"
              value={leadHours}
              onChange={(e) => setLeadHours(e.target.value)}
            />
          </Field>

          <div>
            <span className="label">Blackout dates</span>
            <div className="flex gap-2">
              <input type="date" className="input" value={newBlackout} onChange={(e) => setNewBlackout(e.target.value)} />
              <button onClick={addBlackout} className="btn-ghost h-11 shrink-0 px-4 py-0">
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {blackouts.length === 0 && <span className="text-xs text-forest-700/50">No blackout dates.</span>}
              {blackouts.map((d) => (
                <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1.5 text-xs font-medium text-forest">
                  {d}
                  <button onClick={() => setBlackouts(blackouts.filter((x) => x !== d))} className="text-forest-700/50 hover:text-red-600">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}
