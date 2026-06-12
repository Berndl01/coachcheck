'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { HumatrixLogo } from '@/components/logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirectTo') ?? '/dashboard';
  const redirectTo = redirectParam.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });

    if (loginErr) {
      setError(loginErr.message);
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Link href="/" className="inline-block mb-10"><HumatrixLogo /></Link>
      <h1 className="font-display text-4xl tracking-[-0.03em] mb-2">Login</h1>
      <p className="text-muted mb-8">Willkommen zurück.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.15em] text-muted mb-2">E-Mail</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-bone-line rounded-md bg-white focus:border-gold focus:outline-none" />
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.15em] text-muted mb-2">Passwort</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-bone-line rounded-md bg-white focus:border-gold focus:outline-none" />
          <div className="text-right mt-2">
            <Link href="/passwort-vergessen" className="text-xs text-muted hover:text-gold-deep transition">
              Passwort vergessen?
            </Link>
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-50">
          {loading ? 'Wird eingeloggt…' : 'Login'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-muted">
        Noch kein Account? <Link href="/signup" className="text-ink underline hover:text-gold">Account erstellen</Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12">Lädt…</div>}>
      <LoginForm />
    </Suspense>
  );
}
