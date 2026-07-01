import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Phone, Mail, CalendarX2, CheckCircle2, Clock3 } from 'lucide-react';
import { Panel } from './AdminShell.jsx';
import { useBookings, cancelBooking } from '../../lib/useBookings';
import { formatDateLong, formatTime, toMonthKey } from '../../lib/dateUtils';

const BookingsAdmin = () => {
  const [month, setMonth] = useState(toMonthKey(new Date()));
  const { bookings, loading } = useBookings(month);

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [bookings],
  );

  const confirmed = sorted.filter((b) => b.status === 'paid' || b.status === 'confirmed');
  const pending = sorted.filter((b) => b.status === 'pending');

  const handleCancel = async (b) => {
    const paid = b.status === 'paid';
    const dollars = ((b.amount ?? 0) / 100).toFixed(0);
    const ok = confirm(
      paid
        ? `Cancel this booking and refund $${dollars} to ${b.name || 'the customer'}? ` +
            'The slot stays booked until the refund completes.'
        : 'Remove this booking? This frees the slot.',
    );
    if (!ok) return;
    try {
      const { refunded } = await cancelBooking({ id: b.id, refund: paid });
      toast.success(refunded ? 'Refunded and canceled.' : 'Booking canceled.');
    } catch (e) {
      toast.error(e.message || 'Failed to cancel.');
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Bookings"
        description="Upcoming sessions. Paid bookings are confirmed automatically after Stripe checkout."
        action={
          <label className="flex items-center gap-2 text-sm font-medium text-forest-700">
            <span>Month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input h-10 w-auto py-0"
            />
          </label>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Confirmed" value={confirmed.length} tone="green" />
          <StatCard label="Pending payment" value={pending.length} tone="amber" />
          <StatCard
            label="Revenue (paid)"
            value={`$${(confirmed.reduce((s, b) => s + (b.amount ?? 0), 0) / 100).toFixed(0)}`}
            tone="forest"
          />
        </div>
      </Panel>

      <Panel title="Confirmed sessions">
        {loading ? (
          <Empty>Loading…</Empty>
        ) : confirmed.length === 0 ? (
          <Empty>No confirmed bookings this month.</Empty>
        ) : (
          <ul className="divide-y divide-forest/10">
            {confirmed.map((b) => (
              <BookingRow key={b.id} b={b} onDelete={handleCancel} />
            ))}
          </ul>
        )}
      </Panel>

      {pending.length > 0 && (
        <Panel
          title="Pending (awaiting payment)"
          description="Holds expire if payment isn't completed. Remove stale holds to free the slot."
        >
          <ul className="divide-y divide-forest/10">
            {pending.map((b) => (
              <BookingRow key={b.id} b={b} onDelete={handleCancel} pending />
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
};

const BookingRow = ({ b, onDelete, pending }) => {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest text-center text-white">
          {pending ? (
            <Clock3 size={20} className="text-lime" />
          ) : (
            <CheckCircle2 size={20} className="text-lime" />
          )}
        </div>
        <div>
          <p className="font-semibold text-forest">
            {formatDateLong(b.date)} · {formatTime(b.time)}
          </p>
          <p className="text-sm text-forest-700/70">{b.name}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-forest-700/60">
            {b.email && (
              <a
                href={`mailto:${b.email}`}
                className="inline-flex items-center gap-1 hover:text-forest"
              >
                <Mail size={12} /> {b.email}
              </a>
            )}
            {b.phone && (
              <a
                href={`tel:${b.phone}`}
                className="inline-flex items-center gap-1 hover:text-forest"
              >
                <Phone size={12} /> {b.phone}
              </a>
            )}
          </div>
          {b.notes && (
            <p className="mt-1 max-w-md text-xs italic text-forest-700/60">“{b.notes}”</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(b)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        <Trash2 size={14} /> {pending ? 'Remove hold' : 'Cancel'}
      </button>
    </li>
  );
};

const StatCard = ({ label, value, tone }) => {
  const tones = {
    green: 'bg-lime/20 text-forest',
    amber: 'bg-amber-100 text-amber-800',
    forest: 'bg-forest text-white',
  };
  return (
    <div className={`rounded-2xl p-4 ${tones[tone]}`}>
      <div className="font-display text-2xl">{value}</div>
      <div className="text-xs font-medium opacity-80">{label}</div>
    </div>
  );
};

const Empty = ({ children }) => {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-forest-700/50">
      <CalendarX2 size={28} className="text-forest/30" />
      {children}
    </div>
  );
};

export default BookingsAdmin;
