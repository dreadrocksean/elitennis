import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  LayoutDashboard,
  Images,
  MessageSquareQuote,
  Clock,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSiteContent } from '../lib/useSiteContent';
import BookingsAdmin from '../components/admin/BookingsAdmin.jsx';
import ContentAdmin from '../components/admin/ContentAdmin.jsx';
import GalleryAdmin from '../components/admin/GalleryAdmin.jsx';
import TestimonialsAdmin from '../components/admin/TestimonialsAdmin.jsx';
import AvailabilityAdmin from '../components/admin/AvailabilityAdmin.jsx';

const TABS = [
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'content', label: 'Site Content', icon: LayoutDashboard },
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { id: 'availability', label: 'Availability', icon: Clock },
];

const Admin = () => {
  const { user, logout } = useAuth();
  const { content } = useSiteContent();
  const [tab, setTab] = useState('bookings');

  return (
    <div className="min-h-screen bg-forest-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-forest/10 bg-white/90 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-lime font-display">
              E
            </span>
            <div>
              <p className="font-display text-sm leading-none text-forest">Coach Dashboard</p>
              <p className="text-[11px] text-forest-700/60">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" target="_blank" className="btn-ghost h-9 px-4 py-0 text-xs">
              View site <ExternalLink size={14} />
            </Link>
            <button onClick={logout} className="btn-primary h-9 px-4 py-0 text-xs">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="container-x grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  'flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                  active ? 'bg-forest text-white shadow-card' : 'text-forest-700 hover:bg-white',
                ].join(' ')}
              >
                <Icon size={18} /> {t.label}
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div className="min-w-0">
          {tab === 'bookings' && <BookingsAdmin />}
          {tab === 'content' && <ContentAdmin content={content} />}
          {tab === 'gallery' && <GalleryAdmin content={content} />}
          {tab === 'testimonials' && <TestimonialsAdmin content={content} />}
          {tab === 'availability' && <AvailabilityAdmin />}
        </div>
      </div>
    </div>
  );
};

export default Admin;
