import Link from 'next/link';
import { HumatrixLogo } from './logo';
import { createClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { LanguageToggle } from './i18n/language-toggle';

export async function TopNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getT();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bone/85 border-b border-bone-line">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        <Link href="/" aria-label={t('nav.home')}>
          <HumatrixLogo />
        </Link>
        <nav className="hidden md:flex gap-7 font-mono text-xs uppercase tracking-[0.14em] text-muted">
          <Link href="/#products" className="hover:text-ink transition">{t('nav.products')}</Link>
          <Link href="/#architecture" className="hover:text-ink transition">{t('nav.architecture')}</Link>
          <Link href="/#archetypes" className="hover:text-ink transition">{t('nav.types')}</Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          {user ? (
            <Link
              href="/dashboard"
              className="font-mono text-xs uppercase tracking-[0.1em] px-4 py-2.5 bg-ink text-bone rounded-full hover:bg-gold hover:text-ink transition"
            >
              {t('nav.dashboard')}
            </Link>
          ) : (
            <Link
              href="/login"
              className="font-mono text-xs uppercase tracking-[0.1em] px-4 py-2.5 bg-ink text-bone rounded-full hover:bg-gold hover:text-ink transition"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
