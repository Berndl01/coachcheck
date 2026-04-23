import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { ProfileSetupForm } from './setup-form';

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

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
          Dein Profil
        </div>
        <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.05] tracking-[-0.03em] mb-4">
          Ein paar Infos <em className="font-editorial">über dich.</em>
        </h1>
        <p className="text-muted mb-10 leading-[1.5]">
          Damit dein Report auf dich passt — nicht auf irgendeinen Durchschnitts-Trainer.
          Wir schreiben die Analyse für dein Niveau und deinen Kontext.
        </p>
        <ProfileSetupForm initialProfile={profile ?? {}} />
      </main>
      <Footer />
    </>
  );
}
