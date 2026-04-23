import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AssessmentRunner } from '@/components/assessment/runner';
import type { Item, AnswerValue } from '@/components/assessment/item-renderer';

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

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
        <h1 className="font-display text-3xl mb-4">Assessment nicht gefunden</h1>
        <Link href="/dashboard" className="text-gold hover:underline">Zurück zum Dashboard</Link>
      </main>
    );
  }

  // Already completed? Go to result
  if (assessment.status === 'completed' || assessment.status === 'report_ready') {
    redirect(`/assessment/${id}/result`);
  }

  // Load items for this assessment's package tier
  const { data: items, error: itemsErr } = await supabase.rpc('get_items_for_assessment', {
    assessment_uuid: id,
  });

  if (itemsErr || !items || items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl mb-4">Keine Items verfügbar</h1>
        <p className="text-muted mb-6">
          Für dieses Paket sind noch keine Items konfiguriert. (Migration 03 ausgeführt?)
        </p>
        <Link href="/dashboard" className="text-gold hover:underline">Zurück zum Dashboard</Link>
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

  const startIndex = Math.min(
    assessment.current_item_index ?? 0,
    items.length - 1
  );

  return (
    <AssessmentRunner
      assessmentId={id}
      items={items as Item[]}
      existingAnswers={existingAnswers}
      startIndex={startIndex}
    />
  );
}
