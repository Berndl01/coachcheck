import { TopNav } from '@/components/top-nav';
import { Hero } from '@/components/landing/hero';
import { StatsStrip } from '@/components/landing/stats-strip';
import { Ticker } from '@/components/landing/ticker';
import { ProblemSection } from '@/components/landing/problem';
import { ProductsSection } from '@/components/landing/products';
import { ArchetypesSection } from '@/components/landing/archetypes';
import { MiniCheck } from '@/components/landing/mini-check';
import { ArchitectureSection } from '@/components/landing/architecture';
import { HowItWorks } from '@/components/landing/how-it-works';
import { VoicesSection } from '@/components/landing/voices';
import { QuoteBreak } from '@/components/landing/quote-break';
import { TrustBand } from '@/components/landing/trust-band';
import { FaqSection } from '@/components/landing/faq';
import { FinalCta } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';

export default function HomePage() {
  return (
    <>
      <TopNav />
      <main>
        <Hero />
        <StatsStrip />
        <Ticker />
        <ProblemSection />
        <ProductsSection />
        <ArchetypesSection />
        <MiniCheck />
        <ArchitectureSection />
        <HowItWorks />
        <QuoteBreak />
        <VoicesSection />
        <TrustBand />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
