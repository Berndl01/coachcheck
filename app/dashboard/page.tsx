import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/top-nav';
import { FocusTracker } from '@/components/assessment/focus-tracker';
import { Footer } from '@/components/landing/footer';
import { getT, getLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const t = await getT();
  const locale = await getLocale();

  // DB-Schlüssel -> übersetzte Labels (Schlüssel bleiben stabil, nur Labels lokalisiert).
  const STATUS_LABELS: Record<string, string> = {
    pending: t('dashboard.statusPending'),
    in_progress: t('dashboard.statusInProgress'),
    completed: t('dashboard.statusCompleted'),
    report_ready: t('dashboard.statusReportReady'),
    archived: t('dashboard.statusArchived'),
  };
  const LEVEL_LABELS: Record<string, string> = {
    amateur_hobby: t('dashboard.levelHobby'),
    amateur_ambitioniert: t('dashboard.levelAmb'),
    semi_profi: t('dashboard.levelSemi'),
    profi: t('dashboard.levelProfi'),
  };
  const AGE_LABELS: Record<string, string> = {
    kids_u12: t('dashboard.ageKids'),
    jugend_u16: t('dashboard.ageJugend16'),
    jugend_u18: t('dashboard.ageJugend18'),
    erwachsene: t('dashboard.ageErwachsene'),
    gemischt: t('dashboard.ageGemischt'),
  };
  const SPORT_LABELS: Record<string, string> = {
    fussball: t('dashboard.sportFussball'),
    handball: t('dashboard.sportHandball'),
    basketball: t('dashboard.sportBasketball'),
    volleyball: t('dashboard.sportVolleyball'),
    eishockey: t('dashboard.sportEishockey'),
    andere: t('dashboard.sportAndere'),
  };
  function statusCTA(status: string, id: string) {
    if (status === 'report_ready' || status === 'completed') {
      return { href: `/assessment/${id}/result`, label: t('dashboard.ctaResult') };
    }
    if (status === 'in_progress') {
      return { href: `/assessment/${id}`, label: t('dashboard.ctaContinue') };
    }
    return { href: `/assessment/${id}`, label: t('dashboard.ctaStart') };
  }

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, status, progress_pct, created_at, completed_at, product:products(id, name_de, slug, tier, price_cents), primary:primary_archetype_id(name_de, code)')
    .order('created_at', { ascending: false });

  const { data: allProducts } = await supabase
    .from('products').select('*').eq('active', true).order('tier', { ascending: true });

  const { data: seasons } = await supabase
    .from('seasons').select('id, name, status').eq('user_id', user.id).order('created_at', { ascending: false });

  // Aktionsbereich (Bestcase §11/§12): aktive 7-Tage-Foki. RLS (owner-select) beschränkt automatisch.
  const { data: activeFoci } = await supabase
    .from('action_plans')
    .select('id, title, action, assessment_id, created_at, target_days')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const { data: completedFoci } = await supabase
    .from('action_plans')
    .select('id, title, action, assessment_id, completed_at')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(8);

  const focusPlanIds = [
    ...(activeFoci ?? []).map((f: any) => f.id),
    ...(completedFoci ?? []).map((f: any) => f.id),
  ];
  const checkinDatesByPlan: Record<string, string[]> = {};
  if (focusPlanIds.length) {
    const { data: checkins } = await supabase
      .from('action_checkins')
      .select('plan_id, checkin_date')
      .in('plan_id', focusPlanIds);
    for (const c of checkins ?? []) {
      (checkinDatesByPlan[(c as any).plan_id] ??= []).push((c as any).checkin_date);
    }
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  function focusProgress(planId: string) {
    const dates = checkinDatesByPlan[planId] ?? [];
    const set = new Set(dates);
    const todayChecked = set.has(todayStr);
    let streak = 0;
    const cursor = new Date();
    if (!set.has(cursor.toISOString().slice(0, 10))) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    while (set.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return { count: set.size, todayChecked, streak };
  }

  const ownedProductIds = new Set((assessments ?? []).map((a: any) => a.product?.id).filter(Boolean));
  const ownedProducts = (allProducts ?? []).filter((p: any) => ownedProductIds.has(p.id));
  const availableProducts = (allProducts ?? []).filter((p: any) => !ownedProductIds.has(p.id));

  const firstName = profile?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? t('dashboard.nameFallback');
  const profileComplete = !!profile?.full_name && !!profile?.training_level;

  const chips: string[] = [];
  if (profile?.training_level) chips.push(LEVEL_LABELS[profile.training_level] ?? profile.training_level);
  if (profile?.sport) chips.push(SPORT_LABELS[profile.sport] ?? profile.sport);
  if (profile?.age_group) chips.push(AGE_LABELS[profile.age_group] ?? profile.age_group);
  if (profile?.club) chips.push(profile.club);

  const dayUnit = (n: number) => (n === 1 ? t('dashboard.dayOne') : t('dashboard.dayMany'));
  const priceFmt = (cents: number) => (cents / 100).toLocaleString(locale === 'en' ? 'en-IE' : 'de-AT');

  return (
    <>
      <TopNav />
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-14">

        {/* ZONE 1 — PROFIL-HEADER */}
        <header className="mb-12 pb-8 border-b border-bone-line">
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold-deep mb-3">
            {t('dashboard.profileKicker')}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex-grow">
              <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.03em] mb-3">
                {firstName}
              </h1>
              {chips.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {chips.map((c, i) => (
                    <span key={i} className="font-mono text-[0.65rem] uppercase tracking-[0.12em] px-3 py-1.5 bg-bone-soft border border-bone-line rounded-full text-muted">
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted italic">{t('dashboard.profileIncomplete')}</p>
              )}
            </div>
            <Link
              href="/profil/setup"
              className="font-mono text-xs uppercase tracking-[0.1em] px-4 py-2.5 border border-bone-line rounded-full text-muted hover:bg-ink hover:text-bone hover:border-ink transition whitespace-nowrap"
            >
              {profileComplete ? t('dashboard.edit') : t('dashboard.complete')} →
            </Link>
          </div>

          {!profileComplete && (
            <div className="mt-6 p-4 bg-gold/10 border-l-4 border-gold rounded-r-md">
              <p className="text-sm">
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep mr-2">{t('dashboard.noticeLabel')}</span>
                {t('dashboard.noticeText')} <Link href="/profil/setup" className="text-gold-deep hover:underline font-semibold">{t('dashboard.noticeCta')}</Link>
              </p>
            </div>
          )}
        </header>

        {/* ZONE 1.5 — AKTIVER FOKUS */}
        {activeFoci && activeFoci.length > 0 && (
          <section className="mb-16">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold-deep mb-4">
              {t('dashboard.activeFocus')}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {activeFoci.map((f: any) => {
                const p = focusProgress(f.id);
                return (
                  <FocusTracker
                    key={f.id}
                    planId={f.id}
                    assessmentId={f.assessment_id}
                    title={f.title}
                    action={f.action}
                    targetDays={f.target_days ?? 7}
                    initialCount={p.count}
                    initialTodayChecked={p.todayChecked}
                    initialStreak={p.streak}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ZONE 1.6 — ABGESCHLOSSENE FOKI */}
        {completedFoci && completedFoci.length > 0 && (
          <section className="mb-16">
            <div className="flex items-baseline gap-3 mb-4">
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold-deep">
                {t('dashboard.completedFoci')}
              </div>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted">
                {completedFoci.length} {completedFoci.length === 1 ? t('dashboard.focusOne') : t('dashboard.focusMany')}
              </span>
            </div>
            <div className="space-y-2">
              {completedFoci.map((f: any) => {
                const c = focusProgress(f.id).count;
                const when = f.completed_at
                  ? new Date(f.completed_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-AT', { day: '2-digit', month: '2-digit', year: '2-digit' })
                  : null;
                return (
                  <div key={f.id} className="flex items-center justify-between gap-4 bg-bone-soft border border-bone-line rounded-md px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{f.action}</p>
                      {f.title && (
                        <span className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-muted">{f.title}</span>
                      )}
                    </div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted whitespace-nowrap text-right">
                      <span className="text-gold-deep">{c} {dayUnit(c)}</span>
                      {when && <span> · {when}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ZONE 2 — MEINE AUSWERTUNGEN */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-2xl tracking-[-0.02em]">{t('dashboard.myAssessments')}</h2>
            {(assessments && assessments.length > 0) && (
              <div className="font-mono text-xs uppercase tracking-[0.1em] text-muted">
                {assessments.length} {assessments.length === 1 ? t('dashboard.assessmentOne') : t('dashboard.assessmentMany')}
              </div>
            )}
          </div>

          {(!assessments || assessments.length === 0) ? (
            <div className="bg-bone-soft p-10 rounded-md border border-bone-line text-center">
              <div className="font-editorial text-xl italic text-muted mb-2">
                {t('dashboard.noAssessmentsTitle')}
              </div>
              <p className="text-sm text-muted mb-6 max-w-[40ch] mx-auto">
                {t('dashboard.noAssessmentsText')}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {assessments.map((a: any) => {
                const cta = statusCTA(a.status, a.id);
                const ready = a.status === 'report_ready' || a.status === 'completed';
                const tier = a.product?.tier ?? 0;
                return (
                  <div
                    key={a.id}
                    className={`p-6 rounded-md border-2 transition ${
                      ready ? 'bg-ink text-bone border-ink' : 'bg-bone border-bone-line hover:border-gold'
                    }`}
                  >
                    <div className={`font-mono text-[0.65rem] uppercase tracking-[0.15em] mb-2 ${ready ? 'text-gold' : 'text-gold-deep'}`}>
                      {a.product?.name_de}
                    </div>
                    {ready && a.primary?.name_de ? (
                      <>
                        <div className={`font-display text-2xl tracking-[-0.02em] mb-1 ${ready ? '' : 'text-ink'}`}>
                          {a.primary.name_de}
                        </div>
                        <div className={`font-mono text-[0.65rem] uppercase tracking-[0.12em] mb-4 ${ready ? 'text-bone-soft' : 'text-muted'}`}>
                          {STATUS_LABELS[a.status]} · {t('dashboard.tier')} {tier}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`font-display text-xl tracking-[-0.02em] mb-1 ${ready ? '' : 'text-ink'}`}>
                          {STATUS_LABELS[a.status]}
                        </div>
                        {a.progress_pct > 0 && a.progress_pct < 100 && (
                          <div className="font-mono text-xs text-muted mb-4">{a.progress_pct}{t('dashboard.progressSuffix')}</div>
                        )}
                      </>
                    )}
                    <div className="flex gap-2 flex-wrap mt-4">
                      <Link
                        href={cta.href}
                        className={`font-mono text-[0.65rem] uppercase tracking-[0.1em] px-4 py-2 rounded-full transition ${
                          ready ? 'bg-gold text-ink hover:bg-bone' : 'bg-ink text-bone hover:bg-gold hover:text-ink'
                        }`}
                      >
                        {cta.label} →
                      </Link>
                      {ready && tier >= 2 && a.primary?.code && (
                        <Link
                          href={`/archetyp/${a.primary.code}?assessment=${a.id}`}
                          className="font-mono text-[0.65rem] uppercase tracking-[0.1em] px-4 py-2 rounded-full border border-gold text-gold hover:bg-gold hover:text-ink transition"
                        >
                          {t('dashboard.deepDive')}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ZONE 3 — MEINE PAKETE + TOOLS */}
        {(ownedProducts.length > 0 || (seasons && seasons.length > 0)) && (
          <section className="mb-16">
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-6">{t('dashboard.myPackages')}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {ownedProducts.map((p: any) => (
                <div key={p.id} className="p-5 bg-bone-soft rounded-md border border-bone-line">
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-gold-deep mb-2">
                    {t('dashboard.unlocked')}
                  </div>
                  <div className="font-display text-lg tracking-[-0.01em] mb-2">{p.name_de}</div>
                  <div className="text-xs text-muted leading-[1.5]">
                    {p.tier >= 2 && t('dashboard.featPremium')}
                    {p.tier >= 3 && t('dashboard.feat360')}
                    {p.tier >= 4 && t('dashboard.featTeam')}
                    {p.tier >= 5 && t('dashboard.featSeason')}
                  </div>
                </div>
              ))}

              {(seasons && seasons.length > 0) && (
                <Link
                  href="/saison"
                  className="p-5 bg-petrol text-bone rounded-md hover:bg-petrol-soft transition block"
                >
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-gold-light mb-2">
                    {t('dashboard.toolSeason')}
                  </div>
                  <div className="font-display text-lg tracking-[-0.01em] mb-2">
                    {seasons.length} {seasons.length === 1 ? t('dashboard.seasonOne') : t('dashboard.seasonMany')} {t('dashboard.seasonActive')}
                  </div>
                  <div className="font-mono text-xs uppercase tracking-[0.1em] text-gold">
                    {t('dashboard.open')}
                  </div>
                </Link>
              )}
            </div>
          </section>
        )}

        {/* ZONE 4 — WEITERE MÖGLICHKEITEN */}
        {availableProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="font-display text-2xl tracking-[-0.02em]">{t('dashboard.moreOptions')}</h2>
              <Link href="/#products" className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep hover:underline">
                {t('dashboard.allPackages')}
              </Link>
            </div>
            <p className="font-editorial italic text-muted mb-6 leading-[1.5]">
              {ownedProducts.length > 0 ? t('dashboard.nextStep') : t('dashboard.notUnlocked')}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableProducts.slice(0, 3).map((p: any) => (
                <Link
                  key={p.id}
                  href={p.tier >= 4 ? `/kontakt?plan=${p.slug}` : `/checkout/${p.slug}`}
                  className="p-5 border border-bone-line rounded-md hover:border-gold hover:bg-bone-soft transition block"
                >
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted mb-2">
                    {t('dashboard.tier')} {p.tier}
                  </div>
                  <div className="font-display text-lg tracking-[-0.01em] mb-1">{p.name_de}</div>
                  <div className="font-mono text-xs text-gold-deep mb-3">
                    {p.price_cents < 10000 ? `${Math.floor(p.price_cents / 100)} €` : `${t('dashboard.fromPrefix')} ${priceFmt(p.price_cents)} €`}
                  </div>
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                    {p.tier >= 4 ? t('dashboard.inquire') : t('dashboard.unlock')}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Logout */}
        <div className="pt-8 border-t border-bone-line flex flex-wrap gap-6 items-center">
          <a href="/profil" className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink transition">
            {t('nav.profile')}
          </a>
          <a href="/konto/daten" className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink transition">
            {t('dashboard.myData')}
          </a>
          <form action="/auth/signout" method="post">
            <button type="submit" className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink transition">
              {t('dashboard.logout')}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
