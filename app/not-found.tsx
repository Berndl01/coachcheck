import Link from 'next/link';
import { ThinkingHead } from '@/components/thinking-head';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bone flex items-center justify-center px-4 py-12">
      <div className="max-w-xl text-center">
        <div className="flex justify-center mb-10">
          <ThinkingHead size={180} />
        </div>

        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
          Seite nicht gefunden · 404
        </div>

        <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] font-light tracking-[-0.02em] leading-[1.1] mb-5">
          Dieser Pfad{' '}
          <em className="font-editorial text-gold">existiert nicht</em> — oder
          nicht mehr.
        </h1>

        <p className="font-editorial italic text-xl text-muted leading-[1.5] max-w-[50ch] mx-auto mb-8">
          Entweder hat sich ein Link verirrt oder die Seite wurde verschoben.
          Lass uns dich zurück zu etwas Sinnvollem bringen.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition"
          >
            Zur Startseite <span className="font-mono">→</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 border border-ink text-ink rounded-full font-semibold hover:bg-ink hover:text-bone transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
