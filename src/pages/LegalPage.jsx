import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { LAST_UPDATED } from './legalContent.js';

const LegalPage = ({ doc }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

        <article className="mt-6 max-w-2xl">
          <h1 className="text-4xl text-forest sm:text-5xl">{doc.title}</h1>
          <p className="mt-3 text-sm text-forest-700/60">Last updated: {LAST_UPDATED}</p>

          <div className="mt-8 space-y-8">
            {doc.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-lg text-forest">{s.heading}</h2>
                <p className="mt-2 text-forest-900/75">{s.body}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;
