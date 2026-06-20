'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { HumatrixLogo } from '@/components/logo';
import { useT } from '@/components/i18n/locale-provider';

export const dynamic = 'force-dynamic';

function PasswortNeuForm() {
  const t = useT();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function prepareRecoverySession() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      // Supabase kann Recovery-Links je nach Auth-Flow als ?code=... oder als URL-Hash liefern.
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && mounted) {
          setError(t('passwordReset.errLinkInvalid'));
          return;
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session) {
        setSessionReady(true);
      } else {
        setError(t('passwordReset.errLinkInvalid'));
      }
    }

    prepareRecoverySession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session && mounted) {
        setSessionReady(true);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t('passwordReset.errTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('passwordReset.errMismatch'));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Link href="/" className="inline-block mb-10"><HumatrixLogo /></Link>
      <h1 className="font-display text-4xl tracking-[-0.03em] mb-2">{t('passwordReset.title')}</h1>
      <p className="text-muted mb-8">{t('passwordReset.lead')}</p>

      {!sessionReady && !error && (
        <p className="text-muted italic">{t('passwordReset.checking')}</p>
      )}

      {sessionReady && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.15em] text-muted mb-2">{t('passwordReset.newLabel')}</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password" minLength={8}
              className="w-full px-4 py-3 border border-bone-line rounded-md bg-white focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.15em] text-muted mb-2">{t('passwordReset.confirmLabel')}</label>
            <input
              type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password" minLength={8}
              className="w-full px-4 py-3 border border-bone-line rounded-md bg-white focus:border-gold focus:outline-none"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit" disabled={loading}
            className="w-full py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-50"
          >
            {loading ? t('passwordReset.submitting') : t('passwordReset.submit')}
          </button>
        </form>
      )}

      {error && !sessionReady && (
        <div className="mt-6">
          <Link href="/passwort-vergessen" className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep hover:underline">
            {t('passwordReset.requestNew')}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PasswortNeuPage() {
  return (
    <Suspense fallback={<div className="p-12" />}>
      <PasswortNeuForm />
    </Suspense>
  );
}
