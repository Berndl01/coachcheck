import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { ContactForm } from './contact-form';

export const metadata = {
  title: 'Kontakt · Humatrix Coach',
};

export default async function KontaktPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;

  const planLabels: Record<string, string> = {
    teamcheck: 'TeamCheck (ab 299 €)',
    saison_begleitung: 'Saison & Beratung (ab 1.490 €)',
  };

  const selectedPlan = plan ? planLabels[plan] : null;

  return (
    <>
      <TopNav />
      <main>
        <section className="bg-ink text-bone py-16 md:py-24 px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-light mb-4">
              Kontakt · Beratung
            </div>
            <h1 className="font-display text-[clamp(2.8rem,6vw,4.6rem)] leading-[1.02] tracking-[-0.035em] mb-4">
              Lass uns <em className="font-editorial text-gold">reden.</em>
            </h1>
            {selectedPlan ? (
              <p className="font-editorial italic text-xl text-bone-soft leading-[1.5] max-w-[55ch]">
                Du interessierst dich für <strong className="text-gold">{selectedPlan}</strong>. Wir melden uns innerhalb von 24 Stunden.
              </p>
            ) : (
              <p className="font-editorial italic text-xl text-bone-soft leading-[1.5] max-w-[55ch]">
                Ob Paket, Einzelfall oder Individualberatung — schreib uns und wir finden heraus, ob Humatrix Coach für dein Team das Richtige ist.
              </p>
            )}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 md:px-8 py-16">
          <ContactForm defaultPlan={plan} />
        </section>
      </main>
      <Footer />
    </>
  );
}
