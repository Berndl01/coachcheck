import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_SEASON_PHASES = [
  'vorbereitung', 'fruehe_saison', 'erfolgslauf', 'formkrise',
  'kaderumbruch', 'trainerwechsel', 'saisonendphase', 'aufstiegsdruck', 'abstiegsdruck',
] as const;
const VALID_TEAM_MATURITIES = ['jung_unerfahren', 'gemischt', 'reif_etabliert', 'umbruch'] as const;
const VALID_CONFLICT_STATES = ['stabil', 'leichte_spannungen', 'spuerbare_spannungen', 'akuter_konflikt'] as const;

function normalizeOptionalText(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function hasMissingContextColumnError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return (
    error.code === 'PGRST204' ||
    msg.includes('schema cache') ||
    msg.includes('context_age_range') ||
    msg.includes('context_notes') ||
    msg.includes('context_season_phase') ||
    msg.includes('context_team_maturity') ||
    msg.includes('context_conflict_state')
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const seasonPhase = body.seasonPhase ?? null;
  const teamMaturity = body.teamMaturity ?? null;
  const conflictState = body.conflictState ?? null;
  const ageRange = normalizeOptionalText(body.ageRange, 80);
  const notes = normalizeOptionalText(body.notes, 1200);

  if (seasonPhase !== null && !VALID_SEASON_PHASES.includes(seasonPhase)) {
    return NextResponse.json({ error: 'Ungültige Saisonphase.' }, { status: 400 });
  }
  if (teamMaturity !== null && !VALID_TEAM_MATURITIES.includes(teamMaturity)) {
    return NextResponse.json({ error: 'Ungültige Team-Reife.' }, { status: 400 });
  }
  if (conflictState !== null && !VALID_CONFLICT_STATES.includes(conflictState)) {
    return NextResponse.json({ error: 'Ungültige Konfliktlage.' }, { status: 400 });
  }

  const { data: existing, error: loadError } = await supabase
    .from('assessments')
    .select('id, metadata')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (loadError || !existing) {
    return NextResponse.json({ error: 'Assessment nicht gefunden.' }, { status: 404 });
  }

  const context = {
    seasonPhase,
    teamMaturity,
    conflictState,
    ageRange,
    notes,
    updatedAt: new Date().toISOString(),
  };

  const metadata = {
    ...((existing.metadata as Record<string, unknown> | null) ?? {}),
    context,
  };

  const updateWithColumns = {
    context_season_phase: seasonPhase,
    context_team_maturity: teamMaturity,
    context_conflict_state: conflictState,
    context_age_range: ageRange,
    context_notes: notes,
    metadata,
  };

  const { error } = await supabase
    .from('assessments')
    .update(updateWithColumns)
    .eq('id', id)
    .eq('user_id', user.id);

  if (!error) return NextResponse.json({ ok: true, storage: 'columns_and_metadata' });

  // Sicherheitsnetz: Falls die Live-Datenbank die Premium-Kontext-Spalten noch nicht kennt
  // oder PostgREST den Schema-Cache noch nicht aktualisiert hat, speichern wir den Kontext
  // trotzdem in assessments.metadata.context. Damit sieht der Kunde keinen Rohfehler.
  if (hasMissingContextColumnError(error)) {
    const { error: fallbackError } = await supabase
      .from('assessments')
      .update({ metadata })
      .eq('id', id)
      .eq('user_id', user.id);

    if (!fallbackError) {
      return NextResponse.json({ ok: true, storage: 'metadata_fallback' });
    }
  }

  console.error('[context] save failed:', error);
  return NextResponse.json({ error: 'Der Kontext konnte gerade nicht gespeichert werden. Bitte später erneut versuchen.' }, { status: 500 });
}
