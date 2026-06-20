'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { HumatrixLogo } from '@/components/logo';
import { useT } from '@/components/i18n/locale-provider';

function SignupForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [sport, setSport] = useState('fussball');
  const [role, setRole] = useState('trainer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signupErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, sport, role },
        emailRedirectTo: `${window.location.origin}/auth/callback?plan=${plan ?? ''}`,
      },
    });

    if (signupErr) {
      setError(signupErr.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').update({
        full_name: fullName, sport, role,
      }).eq('id', data.user.id);
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="mb-8"><HumatrixLogo /></div>
        <h1 className="font-display text-3xl tracking-[-0.02em] mb-4">
          {t('signup.successTitle')}
        </h1>
        <p className="text-muted">
          {t('signup.successText1')} <strong className="text-ink">{email}</strong>{t('signup.successText2')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Link href="/" className="inline-block mb-10"><HumatrixLogo /></Link>
      <h1 className="font-display text-4xl tracking-[-0.03em] mb-2">{t('signup.title')}</h1>
      <p className="text-muted mb-8">
        {plan ? <>{t('signup.subtitlePlanA')} <strong className="text-ink">{plan}</strong>{t('signup.subtitlePlanB')}</> : t('signup.subtitleNoPlan')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.15em] text-muted mb-2">{t('signup.nameLabel')}</label>
          <input
            type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-bone-line rounded-md bg-white focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.15em] text-muted mb-2">{t('auth.emailLabel')}</label>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-bone-line rounded-md bg-white focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-[0.15em] text-muted mb-2">{t('auth.passwordLabel')}</label>
          <input
            type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-bone-line rounded-md bg-white focus:border-gold focus:outline-none"
          />
          <div className="text-xs text-muted mt-1">{t('signup.passwordHint')}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.15em] text-muted mb-2">{t('signup.sportLabel')}</label>
            <select value={sport} onChange={e => setSport(e.target.value)}
              className="w-full px-4 py-3 border border-bone-line rounded-md bg-white focus:border-gold focus:outline-none">
              <option value="fussball">{t('options.sportFussball')}</option>
              <option value="handball">{t('options.sportHandball')}</option>
              <option value="basketball">{t('options.sportBasketball')}</option>
              <option value="volleyball">{t('options.sportVolleyball')}</option>
              <option value="eishockey">{t('options.sportEishockey')}</option>
              <option value="andere">{t('options.sportAndere')}</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-xs uppercase tracking-[0.15em] text-muted mb-2">{t('signup.roleLabel')}</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-bone-line rounded-md bg-white focus:border-gold focus:outline-none">
              <option value="trainer">{t('options.roleTrainer')}</option>
              <option value="co_trainer">{t('options.roleCoTrainer')}</option>
              <option value="sportpsychologe">{t('options.roleSportpsychologe')}</option>
              <option value="andere">{t('options.roleAndere')}</option>
            </select>
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition disabled:opacity-50">
          {loading ? t('signup.submitting') : t('signup.submit')}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-muted">
        {t('signup.haveAccount')} <Link href="/login" className="text-ink underline hover:text-gold">{t('signup.loginLink')}</Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-12" />}>
      <SignupForm />
    </Suspense>
  );
}
