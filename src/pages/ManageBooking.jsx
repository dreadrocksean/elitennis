import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Loader2, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { getManagedBooking, cancelManagedBooking } from '../lib/manage';
import { formatDateLong, formatTime } from '../lib/dateUtils';

const ManageBooking = () => {
  const [params] = useSearchParams();
  const id = params.get('id');
  const token = params.get('token');

  const [view, setView] = useState('loading'); // loading | ready | error | done
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!id || !token) {
      setView('error');
      setMessage('This link is missing details. Please use the link from your confirmation email.');
      return;
    }
    getManagedBooking({ id, token })
      .then((b) => {
        setBooking(b);
        setView('ready');
      })
      .catch((e) => {
        setMessage(e.message);
        setView('error');
      });
  }, [id, token]);

  const handleCancel = async () => {
    if (!confirm('Cancel this lesson?')) return;
    setWorking(true);
    setMessage('');
    try {
      const { refunded } = await cancelManagedBooking({ id, token });
      setMessage(
        refunded
          ? 'Your lesson is canceled and your payment has been refunded.'
          : 'Your lesson is canceled. Cancellations within 24 hours are refunded at Coach Eli’s discretion.',
      );
      setView('done');
    } catch (e) {
      setMessage(e.message);
      setWorking(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-50">
      <Navbar />
      <main className="container-x pb-20 pt-28 sm:pt-32">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest"
        >
          <ArrowLeft size={16} /> Back home
        </Link>

        <div className="mt-6 max-w-lg">
          <span className="eyebrow">Manage Booking</span>
          <h1 className="mt-4 text-4xl text-forest sm:text-5xl">Your lesson</h1>

          <div className="card mt-8 p-6">
            {view === 'loading' && (
              <p className="flex items-center gap-2 text-forest-700">
                <Loader2 size={18} className="animate-spin" /> Loading…
              </p>
            )}

            {view === 'error' && <p className="text-red-600">{message}</p>}

            {view === 'done' && (
              <p className="flex items-start gap-2 text-forest">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#008020]" /> {message}
              </p>
            )}

            {view === 'ready' && booking && (
              <>
                <div className="flex items-center gap-2 font-semibold text-forest">
                  <CalendarCheck size={18} />
                  {formatDateLong(booking.date)} · {formatTime(booking.time)} CT
                </div>
                <p className="mt-2 text-sm text-forest-700/70">
                  60-minute private lesson{booking.name ? ` for ${booking.name}` : ''}.
                </p>
                {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
                <button
                  onClick={handleCancel}
                  disabled={working}
                  className="btn-primary mt-6 w-full disabled:opacity-50"
                >
                  {working ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Canceling…
                    </>
                  ) : (
                    'Cancel this lesson'
                  )}
                </button>
                <p className="mt-3 text-center text-xs text-forest-900/50">
                  Cancel more than 24 hours ahead for an automatic refund.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ManageBooking;
