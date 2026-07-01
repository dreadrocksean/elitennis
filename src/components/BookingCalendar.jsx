import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildMonthGrid,
  toDateKey,
  toMonthKey,
  zonedDateKey,
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
  // `now` ticks every minute so slots that cross their lead-time boundary while
  // the page sits open disappear on their own (instead of staying bookable).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  // Anchor "today" and the visible month to Central time, not the visitor's.
  const todayKey = zonedDateKey(now);
  const [todayYear, todayMonth, todayDay] = todayKey.split('-').map(Number);
  const [view, setView] = useState({ year: todayYear, month: todayMonth - 1 });

  const grid = useMemo(() => buildMonthGrid(view.year, view.month), [view]);

  const takenSet = useMemo(() => {
    const s = new Set();
    bookings.forEach((b) => s.add(`${b.date}_${b.time}`));
    return s;
  }, [bookings]);

  // Returns the day's slots as { time, booked }. Taken slots are kept (shown
  // disabled with a "Booked" stamp so visitors see a busy coach); unbooked slots
  // past the lead-time cutoff are dropped.
  const slotsForDate = (dateKey) => {
    const [y, mo, d] = dateKey.split('-').map(Number);
    const dow = new Date(y, mo - 1, d).getDay();
    if (availability.blackouts?.includes(dateKey)) return [];
    const lead = availability.leadHours ?? 12;
    return (availability.weekly?.[dow] ?? [])
      .map((time) => ({ time, booked: takenSet.has(`${dateKey}_${time}`) }))
      .filter(({ time, booked }) => booked || !isBeforeLeadTime(dateKey, time, lead, now));
  };

  // First day (scanning ~1 year from today) that has an open slot, so we can
  // open on a month that actually has availability rather than one that's all
  // disabled.
  const firstAvailableKey = useMemo(() => {
    for (let i = 0; i < 366; i++) {
      const key = toDateKey(new Date(todayYear, todayMonth - 1, todayDay + i));
      if (slotsForDate(key).some((s) => !s.booked)) return key;
    }
    return null;
  }, [todayKey, availability, takenSet, now]);

  // Once availability/bookings load, jump to that first open month — unless the
  // visitor has already navigated the calendar themselves.
  const navigated = useRef(false);
  useEffect(() => {
    if (navigated.current || !firstAvailableKey) return;
    const [y, mo] = firstAvailableKey.split('-').map(Number);
    setView({ year: y, month: mo - 1 });
  }, [firstAvailableKey]);

  const dayHasOpenSlots = (dateKey, inMonth) => {
    if (!inMonth) return false;
    if (dateKey < todayKey) return false;
    return slotsForDate(dateKey).some((s) => !s.booked);
  };

  const canGoPrev = !(view.year === todayYear && view.month === todayMonth - 1);

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
              onClick={() => {
                navigated.current = true;
                setView((v) => {
                  const m = v.month - 1;
                  return m < 0 ? { year: v.year - 1, month: 11 } : { ...v, month: m };
                });
              }}
              className="grid h-9 w-9 place-items-center rounded-lg border border-forest/15 text-forest disabled:opacity-30 hover:enabled:bg-forest-50"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => {
                navigated.current = true;
                setView((v) => {
                  const m = v.month + 1;
                  return m > 11 ? { year: v.year + 1, month: 0 } : { ...v, month: m };
                });
              }}
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
                  <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#008020]" />
                )}
                {isToday && !isSelected && (
                  <span className="absolute inset-x-3 bottom-1 h-px bg-forest/30" />
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs text-forest-700/60">
          <span className="h-2 w-2 rounded-full bg-[#008020]" /> Available days
        </p>
      </div>

      {/* Time slots */}
      <div className="card p-5 sm:p-6">
        <h3 className="font-display text-lg text-forest">
          {value?.date ? 'Pick a time' : 'Select a day'}
        </h3>
        <p className="mt-1 text-sm text-forest-700/60">
          {value?.date
            ? 'All sessions are 60 minutes, shown in Central time (CT).'
            : 'Choose an available day on the calendar to see open times.'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
          {value?.date &&
            selectedSlots.map(({ time, booked }) => {
              if (booked) {
                return (
                  <div
                    key={time}
                    aria-disabled="true"
                    className="relative cursor-not-allowed select-none overflow-hidden rounded-xl border border-forest/10 bg-forest-50 px-3 py-3 text-center text-sm font-semibold text-forest/30"
                  >
                    {formatTime(time)}
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="-rotate-[24deg] rounded border border-forest/40 px-1.5 text-[0.6rem] font-extrabold uppercase tracking-widest text-forest/50">
                        Booked
                      </span>
                    </span>
                  </div>
                );
              }
              const active = value.time === time;
              return (
                <button
                  key={time}
                  onClick={() => onChange({ date: value.date, time })}
                  className={[
                    'rounded-xl border px-3 py-3 text-sm font-semibold transition',
                    active
                      ? 'border-forest bg-forest text-white shadow-card'
                      : 'border-forest/15 text-forest hover:border-forest hover:bg-forest-50',
                  ].join(' ')}
                >
                  {formatTime(time)}
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
