import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropic, REPORT_MODEL } from '@/lib/ai/anthropic';
import { ARCHETYPE_DEEP_DIVES } from '@/lib/archetype-deep-dive';
import { buildDeepDiveKnowledgeContext } from '@/lib/ai/trainer-knowledge';

export const maxDuration = 60;

const LEVEL_LABELS: Record<string, string> = {
  amateur_hobby: 'Amateur-Hobby-Bereich',
  amateur_ambitioniert: 'ambitionierten Amateur-Bereich',
  semi_profi: 'Semi-Profi-/Nachwuchs-Leistungsbereich',
  profi: 'Profi-Bereich',
};

const AGE_LABELS: Record<string, string> = {
  kids_u12: 'Kinder (bis U12)',
  jugend_u16: 'Jugend U13-U16',
  jugend_u18: 'Jugend U17-U19',
  erwachsene: 'Erwachsene',
  gemischt: 'gemischte Altersgruppen',
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  const { archetype_code, assessment_id } = body;

  if (!archetype_code || !assessment_id) {
    return NextResponse.json({ error: 'archetype_code + assessment_id erforderlich' }, { status: 400 });
  }

  // Load assessment
  const { data: ax } = await supabase
    .from('assessments')
    .select('id, axis_scores, maturity_scores, context_season_phase, context_team_maturity, user_id, product:products(tier)')
    .eq('id', assessment_id)
    .eq('user_id', user.id)
    .single();

  if (!ax) return NextResponse.json({ error: 'Assessment nicht gefunden' }, { status: 404 });
  if (((ax.product as any)?.tier ?? 0) < 2) {
    return NextResponse.json({ error: 'Premium-Paket erforderlich' }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, training_level, age_group, club_type, sport')
    .eq('id', user.id)
    .single();

  const deepDive = ARCHETYPE_DEEP_DIVES[archetype_code];
  if (!deepDive) return NextResponse.json({ error: 'Archetyp unbekannt' }, { status: 404 });

  // Build prompt
  const axes = ax.axis_scores as Record<string, number>;
  const maturity = ax.maturity_scores as Record<string, number> | null;
  const levelLabel = profile?.training_level ? LEVEL_LABELS[profile.training_level] ?? 'Amateur-Bereich' : 'Amateur-Bereich';
  const ageLabel = profile?.age_group ? AGE_LABELS[profile.age_group] ?? '' : '';
  const firstName = (profile?.full_name ?? 'Trainer').split(' ')[0];

  const axisLines = Object.entries(axes ?? {})
    .map(([k, v]) => `- ${k}: ${Math.round(v * 100)}%`)
    .join('\n');

  const maturityLines = maturity
    ? Object.entries(maturity).map(([k, v]) => `- ${k}: ${Math.round(v * 100)}%`).join('\n')
    : null;

  const systemPrompt = `Du bist Senior-Sportpsychologe und schreibst für einen Trainer eine persönliche Schicht über seinen Archetyp. Der Archetyp ist "${deepDive.name_de}" — die allgemeine Beschreibung hat der Trainer bereits gelesen. Jetzt brauchst du das, was NUR zu ihm passt, basierend auf seinen konkreten Werten und seinem Kontext.

${buildDeepDiveKnowledgeContext(profile?.training_level ?? undefined)}

KRITISCH:
- Schreibe im Amateur-/Semi-Profi-Ton, nicht im Consulting-Jargon
- Konkrete Handlungen aus seinem echten Alltag (Trainingsplatz, Kabine, Elterngespräch)
- Spreche ihn direkt mit Vornamen an: "${firstName}"
- Sein Niveau: ${levelLabel}${ageLabel ? ` · Altersklasse: ${ageLabel}` : ''}
- KEIN Test-Ton, kein abgehobenes Vokabular
- Antworte AUSSCHLIESSLICH mit validem JSON`;

  const userPrompt = `Der Trainer heißt ${firstName} und sein Archetyp ist "${deepDive.name_de}".

# Seine Achsen-Werte
${axisLines}

${maturityLines ? `# Seine Führungsreife\n${maturityLines}\n` : ''}

${ax.context_season_phase ? `Saisonphase: ${ax.context_season_phase}\n` : ''}
${ax.context_team_maturity ? `Team-Reife: ${ax.context_team_maturity}\n` : ''}

Erstelle folgendes JSON:

{
  "intro": "~100 Wörter. Ein Absatz, der speziell für diesen Trainer gilt (nicht generisch für alle mit seinem Archetyp). Nimm seine markantesten Achsen-Werte und zeig ihm: 'Hier liegt DEINE persönliche Ausprägung des Archetyps.' Konkret, warm, kein Jargon. Beispiel Start: '${firstName}, bei dir fällt besonders auf, dass...'",

  "heute_konkret": [
    "4 konkrete Handlungen, die er diese Woche im Training/Alltag umsetzen kann. Aus dem ${levelLabel}. KEINE allgemeinen Ratschläge. Format: jeder Eintrag ein kurzer Satz + Begründung in einem. Beispiel: 'Beim nächsten Training gehst du vor Beginn durch die Kabine und sprichst mindestens zwei Spieler persönlich an, die nicht zum Stammkader gehören. Dein Wert X zeigt, dass dir dieser Schritt schwer fällt — genau deswegen wirkt er.'"
  ],

  "dein_spezifisches_risiko": "~120 Wörter. Sein persönliches Risiko — nicht das allgemeine des Archetyps. Basierend auf seinen konkreten Werten. Konkret auf ${levelLabel} zugeschnitten. Sei ehrlich aber respektvoll."
}

Nur das JSON, kein Drumherum.`;

  try {
    const anthropic = getAnthropic();
    const msg = await anthropic.messages.create({
      model: REPORT_MODEL,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = msg.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('no text in response');

    let raw = textBlock.text.trim();
    raw = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace > 0 || lastBrace < raw.length - 1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(raw);
    return NextResponse.json({ ok: true, content: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI error';
    console.error('Personalization failed:', msg);
    return NextResponse.json({ error: `AI-Fehler: ${msg}` }, { status: 500 });
  }
}
