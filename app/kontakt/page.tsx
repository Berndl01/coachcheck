import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { ContactForm } from './contact-form';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata() {
  const t = await getT();
  return { title: t('kontaktPage.metaTitle') };
}

// TopNav liest die Server-Side Supabase-Session aus Cookies — daher muss
// die Seite dynamisch gerendert werden, sonst hängt der Build im
// "Collecting page data"-Schritt.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function KontaktPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const t = await getT();

  const planLabels: Record<string, string> = {
    teamcheck: t('kontaktPage.planTeamcheck'),
    saison_beratung: t('kontaktPage.planSaison'),
  };

  const selectedPlan = plan ? planLabels[plan] : null;

  return (
    <>
      <TopNav />
      <main>
        <section className="bg-ink text-bone py-16 md:py-24 px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-light mb-4">
              {t('kontaktPage.kicker')}
            </div>
            <h1 className="font-display text-[clamp(2.8rem,6vw,4.6rem)] leading-[1.02] tracking-[-0.035em] mb-4">
              {t('kontaktPage.h1a')} <em className="font-editorial text-gold">{t('kontaktPage.h1emph')}</em>
            </h1>
            {selectedPlan ? (
              <p className="font-editorial italic text-xl text-bone-soft leading-[1.5] max-w-[55ch]">
                {t('kontaktPage.leadSelectedA')} <strong className="text-gold">{selectedPlan}</strong>{t('kontaktPage.leadSelectedB')}
              </p>
            ) : (
              <p className="font-editorial italic text-xl text-bone-soft leading-[1.5] max-w-[55ch]">
                {t('kontaktPage.leadDefault')}
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
