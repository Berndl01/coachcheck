import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AssessmentRunner } from '@/components/assessment/runner';
import type { AnswerValue } from '@/components/assessment/item-renderer';
import { sanitizeItemsForClient } from '@/lib/utils/sanitize-items';
import { checkItemsAgainstContract } from '@/lib/release/contract';
import { getT } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getT();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Load assessment
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*, product:products(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!assessment) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl mb-4">{t('assessmentPage.notFoundTitle')}</h1>
        <Link href="/dashboard" className="text-gold hover:underline">{t('assessmentPage.backToDashboard')}</Link>
      </main>
    );
  }

  // Already completed? Go to result
  if (assessment.status === 'completed' || assessment.status === 'report_ready') {
    redirect(`/assessment/${id}/result`);
  }

  // Noch nicht freigeschaltet: die Vertragsbestätigung (dauerhafter Datenträger)
  // ist noch nicht zugestellt. Erst danach beginnt die Leistung. Kein 404, kein
  // Fehler — ruhiger Wartezustand mit Selbst-Aktualisierung.
  if (assessment.status === 'awaiting_contract_confirmation') {
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
          {t('assessmentPage.awaitingKicker')}
        </div>
        <h1 className="font-display text-3xl tracking-[-0.02em] mb-4">
          {t('assessmentPage.awaitingTitle')}
        </h1>
        <p className="text-muted leading-[1.6] mb-6 max-w-[44ch] mx-auto">
          {t('assessmentPage.awaitingBody')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`/assessment/${id}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition"
          >
            {t('assessmentPage.reload')} <span className="font-mono">↻</span>
          </a>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-bone-line rounded-full text-ink hover:border-gold transition"
          >
            {t('assessmentPage.backToDashboard')}
          </Link>
        </div>
        <p className="text-xs text-muted mt-8 max-w-[44ch] mx-auto">
          {t('assessmentPage.awaitingSpam')}{' '}
          <a href="mailto:office@humatrix.cc" className="text-gold-deep hover:underline">
            office@humatrix.cc
          </a>
          .
        </p>
      </main>
    );
  }

  // Load items for this assessment's package tier
  const { data: items, error: itemsErr } = await supabase.rpc('get_items_for_assessment', {
    assessment_uuid: id,
  });

  if (itemsErr || !items || items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl mb-4">{t('assessmentPage.noItemsTitle')}</h1>
        <p className="text-muted mb-6">
          {t('assessmentPage.noItemsBody')}
        </p>
        <Link href="/dashboard" className="text-gold hover:underline">{t('assessmentPage.backToDashboard')}</Link>
      </main>
    );
  }

  // Load existing answers
  const { data: existing } = await supabase
    .from('answers')
    .select('item_id, value_numeric, value_choice, value_position')
    .eq('assessment_id', id);

  const existingAnswers: Record<number, AnswerValue> = {};
  (existing ?? []).forEach((row: any) => {
    existingAnswers[row.item_id] = {
      value_numeric: row.value_numeric ?? undefined,
      value_choice: row.value_choice ?? undefined,
      value_position: row.value_position ?? undefined,
    };
  });

  // ----------------------------------------------------------------------
  // RELEASE-VERTRAG (verbindliche Release-Bedingung): bevor der Fragebogen
  // angezeigt wird, MUSS der real geladene Itempool dem Vertrag entsprechen.
  // Stimmt die Itemzahl nicht mit der beworbenen `product.item_count` überein
  // oder fehlt einem Spannungsfeld-Item ein Pol (bzw. ist er ein Platzhalter
  // wie „Pol A"), wird KEIN Fragebogen geöffnet — geschlossener, neutraler
  // technischer Fehlerzustand statt unvollständiger Fragen + Weiterklick.
  // ----------------------------------------------------------------------
  const sanitized = sanitizeItemsForClient(items);
  const expectedCount = (assessment.product?.item_count as number | null | undefined) ?? null;
  const contract = checkItemsAgainstContract(sanitized, expectedCount);
  if (!contract.ok) {
    const ref = contract.violations.map((v) => v.kind).join(',');
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-4">
          {t('assessmentPage.releaseBlockedRef')}: ITEM-CONTRACT
        </div>
        <h1 className="font-display text-3xl tracking-[-0.02em] mb-4">
          {t('assessmentPage.releaseBlockedTitle')}
        </h1>
        <p className="text-muted leading-[1.6] mb-6 max-w-[48ch] mx-auto">
          {t('assessmentPage.releaseBlockedBody')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`/assessment/${id}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition"
          >
            {t('assessmentPage.reload')} <span className="font-mono">↻</span>
          </a>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-bone-line rounded-full text-ink hover:border-gold transition"
          >
            {t('assessmentPage.backToDashboard')}
          </Link>
        </div>
        <p className="sr-only" data-contract-violation={ref}>{ref}</p>
      </main>
    );
  }

  const startIndex = Math.min(
    assessment.current_item_index ?? 0,
    items.length - 1
  );

  return (
    <AssessmentRunner
      assessmentId={id}
      items={sanitized}
      existingAnswers={existingAnswers}
      startIndex={startIndex}
      productName={assessment.product?.name_de ?? null}
    />
  );
}
