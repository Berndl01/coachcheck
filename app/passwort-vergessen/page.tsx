'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { HumatrixLogo } from '@/components/logo';

export default function PasswortVergessenPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/passwort-neu`;
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (resetErr) {
      setError(resetErr.message);
      return;
    }

    // Aus Sicherheitsgründen zeigen wir die Erfolgsmeldung immer
    // (egal ob Account existiert oder nicht)
    setSent(true);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Link href="/" className="inline-block mb-10"><HumatrixLogo /></Link>

      {sent ? (
        <>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-3">
            ✓ E-Mail unterwegs
          </div>
          <h1 className="font-display text-4xl tracking-[-0.03em] mb-3">Check dein Postfach.</h1>
          <p className="font-editorial italic text-lg text-muted leading-[1.5] mb-8">
            Falls ein Account mit dieser E-Mail existiert, bekommst du gleich einen Link zum
            Zurücksetzen deines Passworts. Schau auch im Spam-Ordner nach.
          </p>
          <Link href="/login" className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep hover:underline">
            ← Zurück zum Login
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-display text-4xl tracking-[-0.03em] mb-2">Passwort vergessen?</h1>
          <p className="text-muted mb-8">
            Kein Problem. Gib deine E-Mail-Adresse ein und wir schicken dir einen Link zum Zurücksetzen.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-xs uppercase tracking-[0.15em] text-muted mb-2">E-Mail</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 border border-bone-line rounded-md bg-white focus:border-gold focus:outline-none"
              />
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <button
              type="submit" disabled={loading}
              className="w-full py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-50"
            >
              {loading ? 'Sendet …' : 'Reset-Link senden'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted">
            <Link href="/login" className="text-ink underline hover:text-gold">← Zurück zum Login</Link>
          </div>
        </>
      )}
    </div>
  );
}
