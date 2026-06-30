import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CalendarCheck, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { formatDateLong, formatTime } from '../lib/dateUtils';
import { CONTACT } from '../data/siteContent';

const BookingSuccess = () => {
  const [params] = useSearchParams();
  const date = params.get('date');
  const time = params.get('time');

  return (
    <div className="min-h-screen bg-forest-50">
      <Navbar />
      <main className="container-x grid place-items-center pt-32 pb-24">
        <div className="card w-full max-w-lg p-8 text-center sm:p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime">
            <CheckCircle2 size={34} className="text-forest" />
          </span>
          <h1 className="mt-6 text-3xl text-forest sm:text-4xl">You're booked!</h1>
          <p className="mt-3 text-forest-900/70">
            Payment received and your session is confirmed. A receipt is on its way to your inbox.
            Coach Eli will reach out with court details before your lesson.
          </p>

          {date && time && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-forest px-5 py-3 text-white">
              <CalendarCheck size={18} className="text-lime" />
              <span className="font-semibold">
                {formatDateLong(date)} · {formatTime(time)}
              </span>
            </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link to="/" className="btn-primary w-full sm:w-auto">
              Back to home <ArrowRight size={16} />
            </Link>
            <a
              href={CONTACT.phoneHref}
              className="text-sm font-medium text-forest-700 hover:text-forest"
            >
              Questions? Call {CONTACT.phone}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingSuccess;
