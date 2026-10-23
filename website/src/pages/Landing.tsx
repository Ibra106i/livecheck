import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Hero } from '../components/marketing/Hero';
import { Pillars } from '../components/marketing/Pillars';
import { CiSection } from '../components/marketing/CiSection';
import { FinalCta } from '../components/marketing/FinalCta';

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <main id="main">
        <Hero />
        <Pillars />
        <CiSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
