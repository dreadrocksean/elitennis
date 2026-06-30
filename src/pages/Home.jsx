import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import About from '../components/About.jsx';
import Pricing from '../components/Pricing.jsx';
import Gallery from '../components/Gallery.jsx';
import Testimonials from '../components/Testimonials.jsx';
import CtaBand from '../components/CtaBand.jsx';
import Footer from '../components/Footer.jsx';
import { useSiteContent } from '../lib/useSiteContent';

const Home = () => {
  const { content } = useSiteContent();

  return (
    <div className="min-h-screen bg-white">
      <Navbar onDark />
      <main>
        <Hero hero={content.hero} pricing={content.pricing} />
        <About bio={content.bio} stats={content.stats} />
        <Pricing pricing={content.pricing} />
        <Gallery gallery={content.gallery} />
        <Testimonials testimonials={content.testimonials} />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
