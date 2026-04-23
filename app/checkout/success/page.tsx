import Link from 'next/link';
import { TopNav } from '@/components/top-nav';

export default function CheckoutSuccessPage() {
  return (
    <>
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-6">
          Zahlung erfolgreich
        </div>
        <h1 className="font-display text-5xl tracking-[-0.03em] mb-4">
          Willkommen an Bord.
        </h1>
        <p className="font-editorial text-xl text-muted italic mb-10 leading-relaxed">
          Dein Paket wird gerade freigeschaltet. Du bekommst gleich eine Bestätigung per E-Mail
          — und kannst direkt im Dashboard loslegen.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition">
          Zum Dashboard <span className="font-mono">→</span>
        </Link>
      </main>
    </>
  );
}
