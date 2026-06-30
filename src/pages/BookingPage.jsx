import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarCheck, Loader2, Lock } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import BookingCalendar from '../components/BookingCalendar.jsx';
import { useAvailability, useBookings, createPendingBooking, slotId } from '../lib/useBookings';
import { useSiteContent } from '../lib/useSiteContent';
import { startCheckout } from '../lib/checkout';
import { formatDateLong, formatTime, toMonthKey, isBeforeLeadTime } from '../lib/dateUtils';

const BookingPage = () => {
  const { availability } = useAvailability();
  const { content } = useSiteContent();
  const [slot, setSlot] = useState(null); // { date, time }
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  // Arriving from a scrolled-down page (e.g. the home "Book" CTA) otherwise
  // keeps that scroll position, leaving the calendar below the fold.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Watch the visible month's bookings so taken slots disappear in realtime.
  const monthKey = useMemo(
    () => (slot?.date ? slot.date.slice(0, 7) : toMonthKey(new Date())),
    [slot?.date],
  );
  const { bookings } = useBookings(monthKey);

  const ready = slot?.date && slot?.time && form.name.trim() && validEmail(form.email);
  const price = content.pricing?.price || '$40';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ready || submitting) return;
    // Re-check lead time at submit: the calendar may have been open long enough
    // for the chosen slot to slip past its cutoff since it was picked.
    if (isBeforeLeadTime(slot.date, slot.time, availability.leadHours ?? 12)) {
      toast.error('That time just passed — please pick another.');
      setSlot((s) => ({ ...s, time: null }));
      return;
    }
    setSubmitting(true);
    try {
      // Atomically hold the slot. Firestore rules reject if it already exists.
      await createPendingBooking({
        date: slot.date,
        time: slot.time,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
      });

      await startCheckout({
        bookingId: slotId(slot.date, slot.time),
        date: slot.date,
        time: slot.time,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
      });
      // On success the browser redirects to Stripe; code below won't run.
    } catch (err) {
      const taken = String(err?.message || '').toLowerCase();
      if (taken.includes('permission') || taken.includes('exists')) {
        toast.error('Sorry — that slot was just taken. Please pick another.');
        // Clear just the time so the user re-picks an open slot on the same day.
        setSlot((s) => ({ ...s, time: null }));
      } else {
        toast.error(err.message || 'Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-50">
      <Navbar />
      <main className="container-x pt-28 pb-20 sm:pt-32">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest"
        >
          <ArrowLeft size={16} /> Back home
        </Link>

        <div className="mt-6 max-w-2xl">
          <span className="eyebrow">Book a Session</span>
          <h1 className="mt-4 text-4xl text-forest sm:text-5xl">Reserve your court time</h1>
          <p className="mt-3 text-forest-900/70">
            Pick an open day and time, share a few details, and pay securely. Your{' '}
            {content.pricing?.title?.toLowerCase() || 'session'} is {price} for 60 minutes.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          {/* Step 1+2: calendar/time */}
          <div>
            <BookingCalendar
              availability={availability}
              bookings={bookings}
              value={slot}
              onChange={setSlot}
            />
          </div>

          {/* Step 3: details + pay */}
          <form onSubmit={handleSubmit} className="card h-fit p-6 lg:sticky lg:top-24">
            <h3 className="font-display text-lg text-forest">Your details</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="label">Full name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jordan Smith"
                  required
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@email.com"
                  required
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(913) 555-0123"
                />
              </div>
              <div>
                <label className="label">Anything Eli should know?</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Skill level, goals, who the lesson is for…"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="mt-5 rounded-2xl bg-forest-50 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-forest">
                <CalendarCheck size={16} />
                {slot?.date ? formatDateLong(slot.date) : 'No date selected'}
                {slot?.time ? ` · ${formatTime(slot.time)}` : ''}
              </div>
              <div className="mt-2 flex items-center justify-between text-forest-900/70">
                <span>60-min private lesson</span>
                <span className="font-display text-base text-forest">{price}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!ready || submitting}
              className="btn-primary mt-5 w-full text-base disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Redirecting…
                </>
              ) : (
                <>
                  <Lock size={16} /> Pay {price} & Confirm
                </>
              )}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-forest-900/50">
              <Lock size={12} /> Secure payment via Stripe. You won't be charged until checkout.
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default BookingPage;
