import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildMonthGrid,
  toDateKey,
  toMonthKey,
  MONTHS,
  DOW,
  formatTime,
  isBeforeLeadTime,
} from '../lib/dateUtils';

/**
 * Interactive month calendar + time-slot picker.
 * Props:
 *   availability: { weekly, blackouts, leadHours }
 *   bookings: array of { date, time, status }  (taken slots)
 *   value: { date, time } | null
 *   onChange: (next) => void
 */
const BookingCalendar = ({ availability, bookings, value, onChange }) => {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const grid = useMemo(() => buildMonthGrid(view.year, view.month), [view]);

  const takenSet = useMemo(() => {
    const s = new Set();
    bookings.forEach((b) => s.add(`${b.date}_${b.time}`));
    return s;
  }, [bookings]);

  const todayKey = toDateKey(today);

  const slotsForDate = (dateKey) => {
    const [y, mo, d] = dateKey.split('-').map(Number);
    const dow = new Date(y, mo - 1, d).getDay();
    if (availability.blackouts?.includes(dateKey)) return [];
    const weekly = availability.weekly?.[dow] ?? [];
    return weekly
      .filter((t) => !takenSet.has(`${dateKey}_${t}`))
      .filter((t) => !isBeforeLeadTime(dateKey, t, availability.leadHours ?? 12));
  };

  const dayHasOpenSlots = (dateKey, inMonth) => {
    if (!inMonth) return false;
    if (dateKey < todayKey) return false;
    return slotsForDate(dateKey).length > 0;
  };

  const canGoPrev = !(view.year === today.getFullYear() && view.month === today.getMonth());

  const selectedSlots = value?.date ? slotsForDate(value.date) : [];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Calendar */}
      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-forest">
            {MONTHS[view.month]} {view.year}
          </h3>
          <div className="flex gap-1">
            <button
              disabled={!canGoPrev}
              onClick={() =>
                setView((v) => {
                  const m = v.month - 1;
                  return m < 0 ? { year: v.year - 1, month: 11 } : { ...v, month: m };
                })
              }
              className="grid h-9 w-9 place-items-center rounded-lg border border-forest/15 text-forest disabled:opacity-30 hover:enabled:bg-forest-50"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() =>
                setView((v) => {
                  const m = v.month + 1;
                  return m > 11 ? { year: v.year + 1, month: 0 } : { ...v, month: m };
                })
              }
              className="grid h-9 w-9 place-items-center rounded-lg border border-forest/15 text-forest hover:bg-forest-50"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-forest-700/50">
          {DOW.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map(({ date, inMonth }) => {
            const key = toDateKey(date);
            const open = dayHasOpenSlots(key, inMonth);
            const isSelected = value?.date === key;
            const isToday = key === todayKey;
            return (
              <button
                key={key + inMonth}
                disabled={!open}
                onClick={() => onChange({ date: key, time: null })}
                className={[
                  'relative aspect-square rounded-xl text-sm font-medium transition',
                  !inMonth && 'text-forest/20',
                  inMonth && !open && 'text-forest/25',
                  open && !isSelected && 'text-forest hover:bg-forest-50',
                  isSelected && 'bg-forest text-white shadow-card',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {date.getDate()}
                {open && !isSelected && (
                  <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-lime" />
                )}
                {isToday && !isSelected && (
                  <span className="absolute inset-x-3 bottom-1 h-px bg-forest/30" />
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs text-forest-700/60">
          <span className="h-2 w-2 rounded-full bg-lime" /> Available days
        </p>
      </div>

      {/* Time slots */}
      <div className="card p-5 sm:p-6">
        <h3 className="font-display text-lg text-forest">
          {value?.date ? 'Pick a time' : 'Select a day'}
        </h3>
        <p className="mt-1 text-sm text-forest-700/60">
          {value?.date
            ? 'All sessions are 60 minutes.'
            : 'Choose an available day on the calendar to see open times.'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
          {value?.date &&
            selectedSlots.map((t) => {
              const active = value.time === t;
              return (
                <button
                  key={t}
                  onClick={() => onChange({ date: value.date, time: t })}
                  className={[
                    'rounded-xl border px-3 py-3 text-sm font-semibold transition',
                    active
                      ? 'border-forest bg-forest text-white shadow-card'
                      : 'border-forest/15 text-forest hover:border-forest hover:bg-forest-50',
                  ].join(' ')}
                >
                  {formatTime(t)}
                </button>
              );
            })}
        </div>

        {value?.date && selectedSlots.length === 0 && (
          <div className="mt-6 rounded-xl bg-forest-50 p-4 text-sm text-forest-700/70">
            No open times left for this day. Try another date.
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCalendar;
