import { getAnthropic, REPORT_MODEL } from '@/lib/ai/anthropic';
import type { AxisScores, AxisDiscrepancy } from '@/lib/scoring';

export type ReportInput = {
  productTier: number;
  productName: string;
  traineeName?: string | null;
  sport?: string | null;
  primaryArchetype: {
    name_de: string;
    short_trait: string;
    kernmuster: string;
    staerken: string[];
    risiken: string[];
    entwicklungshebel: string[];
  };
  secondaryArchetype: {
    name_de: string;
    short_trait: string;
  };
  axisScores: AxisScores;
  moduleAverages: Record<string, number>;

  // Optional 360° data
  fremdbild?: {
    axisScores: AxisScores;
    discrepancies: AxisDiscrepancy[];
    responseCount: number;
  } | null;
};

export type ReportOutput = {
  executive_summary: string;
  archetyp_interpretation: string;
  signature_narrative: string;
  druckprofil: string;
  modul_interpretationen: Record<string, string>;
  hauptrisiken: string;
  entwicklungspfad: string;
  gespraechsleitfaden: string[];
  naechste_30_tage: string[];

  // Optional 360° outputs
  fremdbild_summary?: string;
  spiegel_narrative?: string;
  diskrepanz_interpretationen?: Record<string, string>;
  blind_spots?: string;
};

const AXIS_LABELS: Record<keyof AxisScores, { low: string; high: string }> = {
  struktur_intuition: { low: 'Intuitiv', high: 'Strukturiert' },
  autoritaet_beteiligung: { low: 'Beteiligend', high: 'Autoritär' },
  leistung_beziehung: { low: 'Beziehungsorientiert', high: 'Leistungsorientiert' },
  stabilisierung_aktivierung: { low: 'Stabilisierend', high: 'Aktivierend' },
  reflexion_direktheit: { low: 'Direkt', high: 'Reflektiert' },
  standardisierung_anpassung: { low: 'Anpassend', high: 'Standardisierend' },
};

const MODULE_TITLES: Record<string, string> = {
  A: 'Führungsidentität',
  B: 'Kommunikationsarchitektur',
  C: 'Entscheidung & Priorität',
  D: 'Fehler- & Lernkultur',
  E: 'Führung unter Druck',
  F: 'Motivation & Aktivierung',
  G: 'Beziehung & Vertrauen',
};

function buildSystemPrompt() {
  return `Du bist ein erfahrener Sportpsychologe und Führungs-Consultant im Premium-Segment der Humatrix Coach Assessment Plattform. Du schreibst Berichte für erfahrene Trainer:innen im Profisport auf Consulting-Niveau.

DEIN STIL:
- Ruhig, präzise, beratungsnah
- KEIN reißerischer Marketing-Ton
- KEIN Psychoblabla ("dein inneres Kind", "Energie", "Chakra")
- KEINE banalen Allgemeinplätze
- Sprache: hochwertig, nuanciert, respektvoll
- Duze den Trainer direkt
- Deutsch, akademisch-fundiert aber zugänglich
- Sätze dürfen lang und gedanklich komplex sein

KERNPRINZIPIEN:
1. Interpretiere Muster, nicht einzelne Scores
2. Zeige Spannungsfelder statt Schubladen
3. Nenne Risiken ehrlich, aber ohne zu verletzen
4. Formuliere Hebel konkret und umsetzbar
5. Wenn du Beispiele gibst: aus dem echten Trainer-Alltag

BEI 360°-DATEN (Selbst-vs-Fremdbild):
- Diskrepanzen sind GOLD — der eigentliche Wert des 360° Spiegels
- Sei ehrlich aber respektvoll: Wo sieht das Team den Trainer anders als er sich selbst?
- Übereinstimmungen sind Stabilität, Diskrepanzen sind Entwicklungspotenzial
- Differenziere zwischen "blind spot" (Trainer unterschätzt) und "hidden strength" (Trainer unterschätzt sich)

FORMAT:
Du antwortest AUSSCHLIESSLICH mit einem validen JSON-Objekt. Keine Einleitung, keine Erklärung, kein Markdown-Codeblock. Nur das JSON.`;
}

function buildUserPrompt(input: ReportInput): string {
  const axes = Object.entries(input.axisScores).map(([key, val]) => {
    const labels = AXIS_LABELS[key as keyof AxisScores];
    const pct = Math.round(val * 100);
    const direction = val >= 0.5 ? labels.high : labels.low;
    const intensity = Math.abs(val - 0.5) > 0.25 ? 'stark ausgeprägt' : Math.abs(val - 0.5) > 0.1 ? 'moderat' : 'neutral';
    return `- ${key}: ${pct}% → tendiert zu "${direction}" (${intensity})`;
  }).join('\n');

  const modules = Object.entries(input.moduleAverages)
    .map(([code, avg]) => `- Modul ${code} (${MODULE_TITLES[code] ?? code}): durchschnittlicher Trend ${avg >= 0 ? '+' : ''}${avg.toFixed(2)}`)
    .join('\n');

  // Build 360° section if data available
  let section360 = '';
  let extraOutputs = '';

  if (input.fremdbild) {
    const fremdAxes = Object.entries(input.fremdbild.axisScores).map(([key, val]) => {
      const labels = AXIS_LABELS[key as keyof AxisScores];
      const pct = Math.round(val * 100);
      const direction = val >= 0.5 ? labels.high : labels.low;
      return `- ${key}: ${pct}% → "${direction}"`;
    }).join('\n');

    const discrepancies = input.fremdbild.discrepancies.map((d) => {
      const labels = AXIS_LABELS[d.axis];
      const selfPct = Math.round(d.selfValue * 100);
      const fremdPct = Math.round(d.fremdValue * 100);
      const deltaPct = Math.round(d.delta * 100);
      let interpretation = '';
      if (d.magnitude === 'hoch') {
        interpretation = d.delta > 0
          ? `Team sieht ${d.axis} STÄRKER ausgeprägt als der Trainer selbst (Blind Spot? Trainer unterschätzt eigene Wirkung in Richtung "${labels.high}")`
          : `Team sieht ${d.axis} SCHWÄCHER ausgeprägt (Trainer überschätzt sich in Richtung "${labels.high}", oder Trainer unterschätzt sich in Richtung "${labels.low}")`;
      } else if (d.magnitude === 'moderat') {
        interpretation = 'moderate Abweichung — Diskussionswürdig';
      } else {
        interpretation = 'übereinstimmend — stabile Selbst-/Fremdwahrnehmung';
      }
      return `- ${d.axis}: Selbst ${selfPct}% vs. Fremd ${fremdPct}% (Δ ${deltaPct >= 0 ? '+' : ''}${deltaPct}%, ${d.magnitude}) — ${interpretation}`;
    }).join('\n');

    section360 = `

# 360°-SPIEGEL DATEN (Fremdbild aus Team)
Anzahl Einschätzungen: ${input.fremdbild.responseCount}

## Fremdbild-Achsen (wie das Team den Trainer sieht)
${fremdAxes}

## DISKREPANZ-ANALYSE (Selbst vs. Fremdbild)
${discrepancies}
`;

    extraOutputs = `,
  "fremdbild_summary": "~120 Wörter. Die zentrale Erkenntnis aus dem 360° Spiegel: Wie groß ist die Übereinstimmung zwischen Selbst- und Fremdbild? Wo liegt die größte Spannung?",
  "spiegel_narrative": "~200 Wörter. Lies die Diskrepanzen als zusammenhängende Geschichte. Welcher Achsen-Vergleich erzählt die wichtigste Wahrheit über diesen Trainer? Wo liegt der emotionale Kern? Schreibe das wie eine professionelle Beratungs-Analyse, nicht wie eine Auflistung.",
  "diskrepanz_interpretationen": {
    "struktur_intuition": "~50 Wörter — Was bedeutet die Diskrepanz auf dieser Achse konkret im Coaching-Alltag?",
    "autoritaet_beteiligung": "~50 Wörter",
    "leistung_beziehung": "~50 Wörter",
    "stabilisierung_aktivierung": "~50 Wörter",
    "reflexion_direktheit": "~50 Wörter",
    "standardisierung_anpassung": "~50 Wörter"
  },
  "blind_spots": "~150 Wörter. Die 1-2 wichtigsten Blind Spots — Punkte, an denen der Trainer sich anders sieht als das Team. Konkret. Was sollte er mit seinem Co-Trainer oder Sportpsychologen besprechen?"`;
  }

  return `Erstelle einen Premium-Diagnostik-Bericht für folgendes Assessment.

# Trainer
- Name: ${input.traineeName ?? 'nicht angegeben'}
- Sport: ${input.sport ?? 'nicht angegeben'}
- Paket: ${input.productName} (Tier ${input.productTier})

# Primärer Archetyp
**${input.primaryArchetype.name_de}** — ${input.primaryArchetype.short_trait}

Kernmuster: ${input.primaryArchetype.kernmuster}

Typische Stärken: ${input.primaryArchetype.staerken.join(', ')}
Typische Risiken: ${input.primaryArchetype.risiken.join(', ')}
Typische Entwicklungshebel: ${input.primaryArchetype.entwicklungshebel.join(', ')}

# Sekundärer Archetyp
${input.secondaryArchetype.name_de} — ${input.secondaryArchetype.short_trait}

# Selbstbild-Axis (6 Kernachsen, 0–100%)
${axes}

# Modul-Durchschnitte (Trend je Bereich)
${modules}
${section360}

---

AUFGABE: Generiere folgende Textteile als JSON. Jeder Text soll personalisiert sein, also auf die konkrete Ausprägung eingehen, nicht nur generische Archetyp-Aussagen wiederholen.

{
  "executive_summary": "3-4 Sätze. Kernbotschaft des Profils. Was macht diesen Trainer besonders, wo liegen die markantesten Spannungen?${input.fremdbild ? ' Inkludiere die 360°-Erkenntnis.' : ''}",
  "archetyp_interpretation": "~200 Wörter. Deute den primären Archetyp im Licht der konkreten Axis-Werte. Wo bestätigt sich das Muster, wo bricht es auf? Wie wirkt die Kombination Primär × Sekundär?",
  "signature_narrative": "~150 Wörter. Lies die 6 Kernachsen als zusammenhängende funktionale Signatur. Welche Achsen dominieren, welche Spannungen entstehen?",
  "druckprofil": "~150 Wörter. Wie wahrscheinlich verändert sich der Stil unter Druck? Basiert auf Modul E und den Achsen autoritaet_beteiligung + stabilisierung_aktivierung.",
  "modul_interpretationen": {
    "A": "~80 Wörter zur Führungsidentität basierend auf Modul-A-Trend",
    "B": "~80 Wörter Kommunikationsarchitektur",
    "C": "~80 Wörter Entscheidungs- und Prioritätslogik",
    "D": "~80 Wörter Fehler- & Lernkultur",
    "E": "~80 Wörter Führung unter Druck",
    "F": "~80 Wörter Motivation & Aktivierung",
    "G": "~80 Wörter Beziehungs- & Vertrauensarchitektur"
  },
  "hauptrisiken": "~150 Wörter. Die 2-3 wichtigsten Risiken für diesen konkreten Trainer, nicht generisch. Ehrlich aber konstruktiv.",
  "entwicklungspfad": "~150 Wörter. Wo genau liegt der größte Entwicklungshebel? Was sollte dieser Trainer als Nächstes angehen?",
  "gespraechsleitfaden": [
    "5 konkrete offene Fragen für ein Reflexionsgespräch oder Einzelgespräch mit einem Spieler, die zum Profil passen"
  ],
  "naechste_30_tage": [
    "4 konkrete, umsetzbare Handlungsschritte für die nächsten 30 Tage"
  ]${extraOutputs}
}

Antworte nur mit dem JSON.`;
}

export async function generateReportTexts(input: ReportInput): Promise<ReportOutput> {
  const anthropic = getAnthropic();

  const msg = await anthropic.messages.create({
    model: REPORT_MODEL,
    max_tokens: 10000,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserPrompt(input) }],
  });

  const textBlock = msg.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text block in Claude response');
  }

  let raw = textBlock.text.trim();
  raw = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace > 0 || lastBrace < raw.length - 1) {
    raw = raw.substring(firstBrace, lastBrace + 1);
  }

  let parsed: ReportOutput;
  try {
    parsed = JSON.parse(raw) as ReportOutput;
  } catch (e) {
    console.error('Failed to parse Claude response:', raw.substring(0, 500));
    throw new Error('Claude returned invalid JSON');
  }

  return parsed;
}
