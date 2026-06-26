import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/top-nav';
import { Footer } from '@/components/landing/footer';
import { getT, getLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

type ProductRef = { name_de?: string | null; tier?: number | null } | null;

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const t = await getT();
  const locale = await getLocale();
  const dateLocale = locale === 'en' ? 'en-GB' : 'de-AT';

  // Wert-Labels (Schlüssel stabil, Labels lokalisiert — wie im Dashboard).
  const SPORT_LABELS: Record<string, string> = {
    fussball: t('dashboard.sportFussball'), handball: t('dashboard.sportHandball'),
    basketball: t('dashboard.sportBasketball'), volleyball: t('dashboard.sportVolleyball'),
    eishockey: t('dashboard.sportEishockey'), andere: t('dashboard.sportAndere'),
  };
  const LEVEL_LABELS: Record<string, string> = {
    amateur_hobby: t('dashboard.levelHobby'), amateur_ambitioniert: t('dashboard.levelAmb'),
    semi_profi: t('dashboard.levelSemi'), profi: t('dashboard.levelProfi'),
  };
  const AGE_LABELS: Record<string, string> = {
    kids_u12: t('dashboard.ageKids'), jugend_u16: t('dashboard.ageJugend16'),
    jugend_u18: t('dashboard.ageJugend18'), erwachsene: t('dashboard.ageErwachsene'),
    gemischt: t('dashboard.ageGemischt'),
  };
  const CLUBTYPE_LABELS: Record<string, string> = {
    dorfverein: t('profileSetup.clubDorf'), stadtverein: t('profileSetup.clubStadt'),
    leistungszentrum: t('profileSetup.clubLZ'), akademie: t('profileSetup.clubAkademie'),
    sonstige: t('profileSetup.clubSonstige'),
  };
  const ROLE_LABELS: Record<string, string> = locale === 'en'
    ? { trainer: 'Coach', co_trainer: 'Assistant coach', sportpsychologe: 'Sport psychologist', andere: 'Other' }
    : { trainer: 'Trainer', co_trainer: 'Co-Trainer', sportpsychologe: 'Sportpsychologe', andere: 'Andere' };

  const PURCHASE_STATUS: Record<string, { label: string; cls: string }> = {
    paid: { label: t('profile.statusPaid'), cls: 'text-petrol border-petrol/40 bg-petrol/5' },
    refunded: { label: t('profile.statusRefunded'), cls: 'text-muted border-bone-line bg-bone-soft' },
    pending: { label: t('profile.statusPending'), cls: 'text-gold-deep border-gold/40 bg-gold/5' },
    failed: { label: t('profile.statusFailed'), cls: 'text-red-700 border-red-200 bg-red-50' },
  };

  const [{ data: profile }, { data: purchases }, { data: assessments }, { data: activeFoci }, { data: invites }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('purchases')
        .select('id, amount_cents, currency, status, paid_at, created_at, product:products(name_de, tier)')
        .order('created_at', { ascending: false }),
      supabase
        .from('assessments')
        .select('id, status, completed_at, product:products(name_de, tier), primary:primary_archetype_id(name_de, code)')
        .order('created_at', { ascending: false }),
      supabase.from('action_plans').select('id').eq('status', 'active'),
      supabase.from('invitations').select('parent_assessment_id, status').eq('invitation_type', 'fremdbild'),
    ]);

  const firstName = profile?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? t('profile.nameFallback');
  const initials = (profile?.full_name ?? user.email ?? 'T')
    .split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join('');

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })
    : null;

  const assessmentList = (assessments ?? []) as Array<{ id: string; status: string; product: ProductRef; primary: { name_de?: string; code?: string } | null }>;
  const completedCount = assessmentList.filter((a) => a.status === 'completed' || a.status === 'report_ready').length;
  const activeFociCount = (activeFoci ?? []).length;

  // 360°: Antworten je Eltern-Assessment zählen.
  const inviteRows = (invites ?? []) as Array<{ parent_assessment_id: string; status: string }>;
  const respondedTotal = inviteRows.filter((i) => i.status === 'completed').length;
  const sentByAssessment: Record<string, { sent: number; responded: number }> = {};
  for (const inv of inviteRows) {
    const e = (sentByAssessment[inv.parent_assessment_id] ??= { sent: 0, responded: 0 });
    e.sent += 1;
    if (inv.status === 'completed') e.responded += 1;
  }
  const threeSixty = assessmentList.filter((a) => (a.product?.tier ?? 0) >= 3);

  const priceFmt = (cents: number, currency: string) =>
    (cents / 100).toLocaleString(locale === 'en' ? 'en-IE' : 'de-AT', {
      style: 'currency', currency: (currency || 'eur').toUpperCase(),
    });

  const profileComplete = !!profile?.full_name && !!profile?.training_level;

  const Stat = ({ value, label }: { value: number | string; label: string }) => (
    <div className="bg-bone-soft border border-bone-line rounded-md px-5 py-4">
      <div className="font-display text-[2rem] leading-none tracking-[-0.02em]">{value}</div>
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted mt-2">{label}</div>
    </div>
  );

  const DataRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-bone-line/60 last:border-0">
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted">{label}</span>
      <span className={`text-sm text-right ${value ? 'text-ink' : 'text-muted italic'}`}>{value || t('profile.notSet')}</span>
    </div>
  );

  return (
    <>
      <TopNav />
      <main className="max-w-[1000px] mx-auto px-4 md:px-8 py-10 md:py-14">

        {/* HEADER */}
        <header className="mb-12 pb-8 border-b border-bone-line">
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold-deep mb-5">
            {t('profile.kicker')}
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-ink text-bone flex items-center justify-center font-display text-2xl tracking-[-0.02em] shrink-0">
              {initials || 'T'}
            </div>
            <div className="flex-grow min-w-0">
              <h1 className="font-display text-[clamp(2rem,4.5vw,3rem)] leading-[1.02] tracking-[-0.03em]">
                {firstName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted">
                <span>{user.email}</span>
                {memberSince && (
                  <>
                    <span className="text-bone-line">·</span>
                    <span>{t('profile.memberSince')} {memberSince}</span>
                  </>
                )}
              </div>
            </div>
            <Link
              href="/profil/setup"
              className="font-mono text-xs uppercase tracking-[0.1em] px-4 py-2.5 border border-bone-line rounded-full text-muted hover:bg-ink hover:text-bone hover:border-ink transition whitespace-nowrap"
            >
              {t('profile.edit')} →
            </Link>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12">

          {/* LEFT COLUMN */}
          <div className="space-y-12">

            {/* MEINE KÄUFE */}
            <section>
              <div className="flex items-baseline gap-3 mb-1">
                <h2 className="font-display text-2xl tracking-[-0.02em]">{t('profile.purchases')}</h2>
              </div>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted mb-5">{t('profile.purchasesSub')}</p>

              {(!purchases || purchases.length === 0) ? (
                <div className="bg-bone-soft border border-bone-line rounded-md p-8 text-center">
                  <p className="font-editorial italic text-muted mb-4">{t('profile.purchasesEmpty')}</p>
                  <Link href="/#products" className="font-mono text-xs uppercase tracking-[0.1em] text-gold-deep hover:underline">
                    {t('profile.purchasesEmptyCta')} →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {(purchases as Array<{ id: string; amount_cents: number; currency: string; status: string; paid_at: string | null; created_at: string; product: ProductRef }>).map((p) => {
                      const st = PURCHASE_STATUS[p.status] ?? PURCHASE_STATUS.pending;
                      const when = (p.paid_at ?? p.created_at)
                        ? new Date(p.paid_at ?? p.created_at).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : null;
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-4 bg-bone border border-bone-line rounded-md px-4 py-3.5">
                          <div className="min-w-0">
                            <div className="font-display text-[1.05rem] tracking-[-0.01em] truncate">{p.product?.name_de ?? '—'}</div>
                            <div className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted mt-0.5">{when}</div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm tabular-nums">{priceFmt(p.amount_cents, p.currency)}</span>
                            <span className={`font-mono text-[0.58rem] uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border ${st.cls}`}>
                              {st.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[0.72rem] text-muted-dark leading-[1.5] mt-3 border-l-2 border-bone-line pl-3">
                    {t('profile.contractNote')}
                  </p>
                </>
              )}
            </section>

            {/* SELBSTBILD & FREMDBILD (360°) */}
            <section>
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold-deep mb-4 flex items-center gap-3">
                <span className="w-8 h-px bg-gold" /> {t('profile.threeSixtyTitle')}
              </div>

              {threeSixty.length > 0 ? (
                <>
                  <p className="text-sm text-muted leading-[1.55] mb-5 max-w-[58ch]">{t('profile.threeSixtyDesc')}</p>
                  <div className="space-y-2">
                    {threeSixty.map((a) => {
                      const c = sentByAssessment[a.id] ?? { sent: 0, responded: 0 };
                      return (
                        <div key={a.id} className="flex items-center justify-between gap-4 bg-bone-soft border border-bone-line rounded-md px-4 py-3.5">
                          <div className="min-w-0">
                            <div className="font-display text-[1.05rem] tracking-[-0.01em] truncate">{a.product?.name_de ?? '—'}</div>
                            <div className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted mt-0.5">
                              {c.sent === 0
                                ? t('profile.threeSixtyNone')
                                : `${c.responded} ${t('profile.threeSixtyResponses')} · ${c.sent - c.responded} ${t('profile.threeSixtyOpen')}`}
                            </div>
                          </div>
                          <Link
                            href={`/assessment/${a.id}/result`}
                            className="font-mono text-[0.62rem] uppercase tracking-[0.1em] px-3.5 py-2 rounded-full bg-ink text-bone hover:bg-gold hover:text-ink transition whitespace-nowrap shrink-0"
                          >
                            {t('profile.threeSixtyManage')} →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="bg-petrol text-bone rounded-md p-6">
                  <div className="font-display text-lg tracking-[-0.01em] mb-2">{t('profile.threeSixtyLockedTitle')}</div>
                  <p className="text-sm text-bone-soft leading-[1.55] mb-4 max-w-[54ch]">{t('profile.threeSixtyLockedDesc')}</p>
                  <Link href="/#products" className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-gold-light hover:text-gold transition">
                    {t('profile.threeSixtyLockedCta')} →
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-12">

            {/* MEIN FORTSCHRITT */}
            <section>
              <h2 className="font-display text-2xl tracking-[-0.02em] mb-5">{t('profile.progress')}</h2>
              <div className="grid grid-cols-3 gap-3">
                <Stat value={completedCount} label={t('profile.statAssessments')} />
                <Stat value={activeFociCount} label={t('profile.statActiveFoci')} />
                <Stat value={respondedTotal} label={t('profile.statFremdbild')} />
              </div>
            </section>

            {/* STAMMDATEN */}
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display text-2xl tracking-[-0.02em]">{t('profile.stammdaten')}</h2>
                <Link href="/profil/setup" className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-gold-deep hover:underline">
                  {t('profile.edit')}
                </Link>
              </div>
              <div className="bg-bone-soft border border-bone-line rounded-md px-5 py-3">
                <DataRow label={t('profile.role')} value={profile?.role ? ROLE_LABELS[profile.role] ?? profile.role : null} />
                <DataRow label={t('profile.sport')} value={profile?.sport ? SPORT_LABELS[profile.sport] ?? profile.sport : null} />
                <DataRow label={t('profile.club')} value={profile?.club} />
                <DataRow label={t('profile.clubType')} value={profile?.club_type ? CLUBTYPE_LABELS[profile.club_type] ?? profile.club_type : null} />
                <DataRow label={t('profile.level')} value={profile?.training_level ? LEVEL_LABELS[profile.training_level] ?? profile.training_level : null} />
                <DataRow label={t('profile.ageGroup')} value={profile?.age_group ? AGE_LABELS[profile.age_group] ?? profile.age_group : null} />
              </div>

              {!profileComplete && (
                <div className="mt-4 p-4 bg-gold/10 border-l-4 border-gold rounded-r-md">
                  <p className="text-sm mb-2">{t('profile.completeText')}</p>
                  <Link href="/profil/setup" className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-gold-deep hover:underline font-semibold">
                    {t('profile.completeCta')} →
                  </Link>
                </div>
              )}
            </section>

            {/* DATEN & SICHERHEIT */}
            <section>
              <h2 className="font-display text-2xl tracking-[-0.02em] mb-4">{t('profile.dataSecurity')}</h2>
              <div className="flex flex-col gap-2.5">
                <Link href="/konto/daten" className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink transition">
                  → {t('profile.myData')}
                </Link>
                <Link href="/dashboard" className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink transition">
                  → {t('profile.backDashboard')}
                </Link>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink transition">
                    → {t('profile.logout')}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
