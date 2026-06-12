import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { CheckoutConsent } from './consent-form';

export const dynamic = 'force-dynamic';

/**
 * Consent-Gate VOR dem Stripe-Checkout (P0 #4).
 *
 * Diese Seite ersetzt den früheren Auto-Redirect-Route-Handler. AGB,
 * Datenschutz und das Verständnis der KI-gestützten Auswertung werden NICHT
 * mehr beim bloßen Klick gespeichert, sondern erst nach aktiver Zustimmung
 * (drei Checkboxen) — siehe /checkout/[slug]/start.
 */
export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ consent?: string }>;
}) {
  const { slug } = await params;
  const { consent } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/checkout/${slug}`);
  }

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!product) {
    return (
      <>
        <TopNav />
        <main className="max-w-2xl mx-auto px-4 md:px-8 py-24 text-center">
          <h1 className="font-display text-3xl mb-3">Paket nicht gefunden</h1>
          <p className="text-muted">Dieses Paket existiert nicht oder ist nicht mehr verfügbar.</p>
        </main>
        <Footer />
      </>
    );
  }

  // Tier 4+ → Kontaktformular statt Stripe (kein Zahlungs-Consent nötig).
  if (product.tier >= 4) {
    redirect(`/kontakt?plan=${slug}`);
  }

  const priceEur = (product.price_cents / 100).toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
  });

  return (
    <>
      <TopNav />
      <main className="min-h-[70vh] bg-bone">
        <section className="max-w-2xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-5 flex items-center gap-3">
            <span className="w-10 h-px bg-gold" /> Vor dem Kauf
          </div>
          <h1 className="font-display font-light text-[clamp(2rem,5vw,3.2rem)] leading-[1.05] tracking-[-0.03em] mb-4" style={{ fontVariationSettings: "'opsz' 144" }}>
            {product.name_de}
          </h1>
          {product.description && (
            <p className="text-muted leading-[1.6] max-w-[55ch] mb-8">{product.description}</p>
          )}

          <div className="flex items-baseline gap-3 mb-10 pb-8 border-b border-bone-line">
            <span className="font-display text-3xl text-ink">{priceEur}</span>
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">einmalig · inkl. MwSt.</span>
          </div>

          <CheckoutConsent slug={slug} />

          {consent === 'incomplete' && (
            <p className="mt-5 text-sm text-red-600 font-mono">
              Bitte bestätige alle drei Punkte, um fortzufahren.
            </p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
