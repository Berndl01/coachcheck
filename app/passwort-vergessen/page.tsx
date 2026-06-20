'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { HumatrixLogo } from '@/components/logo';
import { useT } from '@/components/i18n/locale-provider';

export default function PasswortVergessenPage() {
  const t = useT();
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
    setSent(true);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Link href="/" className="inline-block mb-10"><HumatrixLogo /></Link>

      {sent ? (
        <>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-3">
            {t('passwordForgot.sentKicker')}
          </div>
          <h1 className="font-display text-4xl tracking-[-0.03em] mb-3">{t('passwordForgot.sentTitle')}</h1>
          <p className="font-editorial italic text-lg text-muted leading-[1.5] mb-8">
            {t('passwordForgot.sentText')}
          </p>
          <Link href="/login" className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep hover:underline">
            {t('passwordForgot.backToLogin')}
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-display text-4xl tracking-[-0.03em] mb-2">{t('passwordForgot.title')}</h1>
          <p className="text-muted mb-8">
            {t('passwordForgot.lead')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-xs uppercase tracking-[0.15em] text-muted mb-2">{t('auth.emailLabel')}</label>
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
              {loading ? t('passwordForgot.submitting') : t('passwordForgot.submit')}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted">
            <Link href="/login" className="text-ink underline hover:text-gold">{t('passwordForgot.backToLogin')}</Link>
          </div>
        </>
      )}
    </div>
  );
}
