import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { WiderrufForm } from './widerruf-form';

export const metadata = {
  title: 'Vertrag widerrufen · CoachCheck',
};

// TopNav liest die Server-Side Supabase-Session aus Cookies — daher muss die
// Seite dynamisch gerendert werden, sonst hängt der Build im
// "Collecting page data"-Schritt.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function WiderrufPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <>
      <TopNav />
      <main>
        <section className="bg-ink text-bone py-16 md:py-24 px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-light mb-4">
              Rechtliches · Widerruf
            </div>
            <h1 className="font-display text-[clamp(2.6rem,6vw,4.2rem)] leading-[1.04] tracking-[-0.035em] mb-4">
              Vertrag <em className="font-editorial text-gold">widerrufen.</em>
            </h1>
            <p className="font-editorial italic text-xl text-bone-soft leading-[1.5] max-w-[58ch]">
              Hier kannst du deinen Vertrag direkt online widerrufen. Wir bestätigen den Eingang
              umgehend per E-Mail und prüfen deinen Widerruf.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 md:px-8 py-16">
          <div className="bg-bone-soft border-l-2 border-gold pl-5 py-4 mb-10 text-ink leading-[1.6]">
            <p className="text-sm">
              Du kannst auch formlos per E-Mail an{' '}
              <a href="mailto:office@humatrix.cc" className="text-gold-deep underline">office@humatrix.cc</a>{' '}
              widerrufen oder das{' '}
              <a href="/legal/agb" className="text-gold-deep underline">Muster-Widerrufsformular in den AGB</a>{' '}
              verwenden. Diese Online-Funktion ist der schnellste Weg — der Eingangszeitpunkt wird
              automatisch festgehalten.
            </p>
          </div>
          <WiderrufForm defaultRef={ref} />
        </section>
      </main>
      <Footer />
    </>
  );
}
