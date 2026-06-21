import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { ProfileSetupForm } from './setup-form';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const t = await getT();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, sport, club, training_level, age_group, club_type')
    .eq('id', user.id)
    .single();

  return (
    <>
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 md:px-8 py-16">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
          {t('profileSetupPage.kicker')}
        </div>
        <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.05] tracking-[-0.03em] mb-4">
          {t('profileSetupPage.h1a')} <em className="font-editorial">{t('profileSetupPage.h1emph')}</em>
        </h1>
        <p className="text-muted mb-6 leading-[1.5]">
          {t('profileSetupPage.lead')}
        </p>
        <div className="mb-10 inline-flex items-center gap-2 rounded-md border border-bone-line bg-bone-soft px-4 py-2.5 font-mono text-xs">
          <span className="uppercase tracking-[0.12em] text-muted">{t('profileSetupPage.loggedInAs')}</span>
          <span className="text-ink">{user.email}</span>
        </div>
        <ProfileSetupForm initialProfile={profile ?? {}} />
      </main>
      <Footer />
    </>
  );
}
