import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Hero,
  ProblemSection,
  SolutionSection,
  HowItWorks,
  ValueSection,
  PartnersSection,
  RoadmapSection,
  CTASection,
  TrustBar,
  Testimonials,
  CaseStudies,
  FAQ,
  StatsBar,
} from '../components/landing';

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <Navbar />

      <Hero />

      <TrustBar />

      <ProblemSection />

      <SolutionSection />

      <HowItWorks />

      <StatsBar />

      <ValueSection />

      <PartnersSection />

      <Testimonials />

      <CaseStudies />

      <RoadmapSection />

      <FAQ />

      <CTASection />

      <Footer />
    </div>
  );
}