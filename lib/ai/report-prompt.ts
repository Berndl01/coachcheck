import { getAnthropic, REPORT_MODEL } from '@/lib/ai/anthropic';
import type { AxisScores, AxisDiscrepancy, MaturityScores } from '@/lib/scoring';

export type SeasonPhase =
  | 'vorbereitung' | 'fruehe_saison' | 'erfolgslauf' | 'formkrise'
  | 'kaderumbruch' | 'trainerwechsel' | 'saisonendphase'
  | 'aufstiegsdruck' | 'abstiegsdruck';

export type TeamMaturity = 'jung_unerfahren' | 'gemischt' | 'reif_etabliert' | 'umbruch';
export type ConflictState = 'stabil' | 'leichte_spannungen' | 'spuerbare_spannungen' | 'akuter_konflikt';

export const SEASON_PHASE_LABELS: Record<SeasonPhase, string> = {
  vorbereitung: 'Saisonvorbereitung',
  fruehe_saison: 'Frühe Saison',
  erfolgslauf: 'Erfolgslauf',
  formkrise: 'Formkrise',
  kaderumbruch: 'Kaderumbruch',
  trainerwechsel: 'Trainerwechsel-Übergabe',
  saisonendphase: 'Saisonendphase',
  aufstiegsdruck: 'Aufstiegsdruck',
  abstiegsdruck: 'Abstiegsdruck',
};

export const TEAM_MATURITY_LABELS: Record<TeamMaturity, string> = {
  jung_unerfahren: 'Jung & unerfahren',
  gemischt: 'Gemischt',
  reif_etabliert: 'Reif & etabliert',
  umbruch: 'Im Umbruch',
};

export const CONFLICT_STATE_LABELS: Record<ConflictState, string> = {
  stabil: 'Stabil',
  leichte_spannungen: 'Leichte Spannungen',
  spuerbare_spannungen: 'Spürbare Spannungen',
  akuter_konflikt: 'Akuter Konflikt',
};

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

  // PREMIUM INTELLIGENCE LAYER
  maturityScores?: MaturityScores | null;
  context?: {
    seasonPhase?: SeasonPhase | null;
    teamMaturity?: TeamMaturity | null;
    conflictState?: ConflictState | null;
    ageRange?: string | null;
    notes?: string | null;
  } | null;

  fremdbild?: {
    axisScores: AxisScores;
    discrepancies: AxisDiscrepancy[];
    responseCount: number;
    polarizedAxes?: string[];      // Axen mit hoher Streuung im Fremdbild
  } | null;

  teamcheck?: {
    coachImpact: number;
    psySafety: number;
    teamKlima: number;
    leistungsdruck: number;
    klarheit: number;
    responseCount: number;
  } | null;
};

export type ReportOutput = {
  // === Standard ===
  executive_summary: string;
  archetyp_interpretation: string;
  signature_narrative: string;
  druckprofil: string;
  modul_interpretationen: Record<string, string>;
  hauptrisiken: string;
  entwicklungspfad: string;
  gespraechsleitfaden: string[];
  naechste_30_tage: string[];

  // === 360° (optional) ===
  fremdbild_summary?: string;
  spiegel_narrative?: string;
  diskrepanz_interpretationen?: Record<string, string>;
  blind_spots?: string;

  // === TeamCheck (optional) ===
  teamcheck_summary?: string;
  teamcheck_narrative?: string;
  team_dynamics?: string;
  team_handlungsempfehlungen?: string[];

  // === PREMIUM INTELLIGENCE LAYER (Phase 8) ===
  coach_signature_portrait?: string;     // Essayistisches Premium-Portrait
  paradoxien?: string[];                 // 2-4 Trainer-Paradoxien
  shadow_pattern?: string;               // Kippmuster unter Druck
  wirkung_je_kontext?: Record<string, string>; // Trainingsalltag, Spieltag, Niederlage, Konflikt, Krise
  fuehrungsreife_interpretation?: string; // Interpretation der 6 Reifeachsen
  no_go_warnungen?: string[];            // Was dieser Trainer NICHT tun sollte
  coach_to_team_fit?: string;            // Wie passt der Stil zum Team in dieser Phase?
  saisonphase_interpretation?: string;   // Wie wirkt der Stil in DIESER Phase?
  spielerbedarf?: string;                // Was Spieler von diesem Stil typischerweise brauchen
  beratungswuerdigkeit?: 'gering' | 'mittel' | 'hoch';
  fuehrungsenergie?: string;             // beruhigend, verdichtend, aktivierend, ordnend, ...
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

const MATURITY_LABELS: Record<string, string> = {
  selbstregulation: 'Selbstregulation',
  perspektivflexibilitaet: 'Perspektivflexibilität',
  konfliktreife: 'Konfliktreife',
  druckreife: 'Druckreife',
  verantwortungsklarheit: 'Verantwortungsklarheit',
  integrationsfaehigkeit: 'Integrationsfähigkeit',
};

function buildSystemPrompt() {
  return `Du bist ein Senior Sportpsychologe und Führungs-Consultant im Premium-Segment der Humatrix Coach Assessment Plattform — entwickelt in Tirol/Österreich gemeinsam mit Wissenschaftlern, Profitrainern und Sportlern. Du schreibst Berichte für erfahrene Trainer:innen im Profisport auf Boutique-Consulting-Niveau.

DEIN STIL:
- Ruhig, präzise, beratungsnah — nicht reißerisch, nicht therapeutisch
- KEIN Marketing-Sprech, KEIN Psychoblabla ("inneres Kind", "Energie", "Chakra")
- KEINE banalen Allgemeinplätze, KEINE 0815-Listen
- Sprache: hochwertig, nuanciert, respektvoll. Sätze dürfen lang und gedanklich komplex sein.
- Duze den Trainer
- Deutsch, akademisch-fundiert aber zugänglich

KERNPRINZIPIEN — was diesen Report von Standard-Tests unterscheidet:

1. **Trainer-Paradoxien** statt Stärken/Schwächen-Listen
   "Hohe Klarheit, aber begrenzte Anschlussfähigkeit" ist stärker als "Stärke: klar".
   Gute Führung ist immer paradox — zeige diese Paradoxien.

2. **Wirkung je Kontext** statt Pauschalurteil
   Der Trainer wirkt unterschiedlich in Trainingsalltag, Spieltag, Niederlage, Konflikt, Krise.
   Differenziere — keine Pauschalaussagen.

3. **Shadow Pattern** statt Defizit
   Ein Stil hat ein Kippmuster: aus Klarheit wird Härte, aus Ruhe wird Distanz, aus Beziehung wird Harmonievermeidung.
   Benenne dieses spezifische Kippmuster.

4. **Entwicklungsrisiken** statt Schwächen
   Niemals "Schwäche", "Defizit", "Mangel". Stattdessen: "Entwicklungsrisiko", "Wirkungsgrenze", "Übersteuerung", "blinder Fleck", "Risikozone unter Belastung".

5. **3-Ebenen-Antwortlogik** in jedem Befund
   Was sehen wir? → Was bedeutet das? → Was folgt daraus?

6. **Interventionsfähig** statt nur diagnostisch
   Nicht "mehr Kommunikation", sondern: "keine weitere Top-down-Klarheit, sondern moderierte Öffnung, sprachliche Entschärfung und sichtbare Beteiligung".

7. **Spielerperspektive einbeziehen**
   Was brauchen Spieler von diesem Stil? Wo liegt die Anschlussfähigkeit?

8. **Reduktion ist Premium**
   Lieber 3 brillante Befunde als 8 mittelmäßige.

FORMAT:
Du antwortest AUSSCHLIESSLICH mit einem validen JSON-Objekt. Keine Einleitung, keine Erklärung, kein Markdown. Nur das JSON.`;
}

function buildUserPrompt(input: ReportInput): string {
  const axes = Object.entries(input.axisScores).map(([key, val]) => {
    const labels = AXIS_LABELS[key as keyof AxisScores];
    const pct = Math.round(val * 100);
    const direction = val >= 0.5 ? labels.high : labels.low;
    const intensity = Math.abs(val - 0.5) > 0.25 ? 'stark ausgeprägt' : Math.abs(val - 0.5) > 0.1 ? 'moderat' : 'neutral';
    return `- ${key}: ${pct}% → "${direction}" (${intensity})`;
  }).join('\n');

  const modules = Object.entries(input.moduleAverages)
    .map(([code, avg]) => `- Modul ${code} (${MODULE_TITLES[code] ?? code}): Trend ${avg >= 0 ? '+' : ''}${avg.toFixed(2)}`)
    .join('\n');

  // ---------- PREMIUM INTELLIGENCE SECTIONS ----------

  let sectionMaturity = '';
  if (input.maturityScores) {
    const matLines = Object.entries(input.maturityScores)
      .map(([k, v]) => `- ${MATURITY_LABELS[k] ?? k}: ${Math.round(v * 100)}%`)
      .join('\n');
    sectionMaturity = `

# FÜHRUNGSREIFE (zweite Schicht — jenseits des Stils)
${matLines}

→ Reife ist NICHT der Stil. Sondern wie souverän der Trainer mit den Anforderungen seines Stils umgeht.
`;
  }

  let sectionContext = '';
  if (input.context) {
    const c = input.context;
    const lines: string[] = [];
    if (c.seasonPhase) lines.push(`- Saisonphase: ${SEASON_PHASE_LABELS[c.seasonPhase] ?? c.seasonPhase}`);
    if (c.teamMaturity) lines.push(`- Team-Reife: ${TEAM_MATURITY_LABELS[c.teamMaturity] ?? c.teamMaturity}`);
    if (c.conflictState) lines.push(`- Konfliktlage: ${CONFLICT_STATE_LABELS[c.conflictState] ?? c.conflictState}`);
    if (c.ageRange) lines.push(`- Altersstruktur: ${c.ageRange}`);
    if (c.notes) lines.push(`- Notizen des Trainers: "${c.notes}"`);
    if (lines.length > 0) {
      sectionContext = `

# AKTUELLER KONTEXT
${lines.join('\n')}

→ Wichtig: Derselbe Stil wirkt anders in unterschiedlichen Kontexten. Berücksichtige das in der Interpretation.
`;
    }
  }

  let section360 = '';
  let extraOutputs = '';
  if (input.fremdbild) {
    const fremdAxes = Object.entries(input.fremdbild.axisScores).map(([key, val]) => {
      const labels = AXIS_LABELS[key as keyof AxisScores];
      return `- ${key}: ${Math.round(val * 100)}% → "${val >= 0.5 ? labels.high : labels.low}"`;
    }).join('\n');

    const discrepancies = input.fremdbild.discrepancies.map((d) => {
      const labels = AXIS_LABELS[d.axis];
      const selfPct = Math.round(d.selfValue * 100);
      const fremdPct = Math.round(d.fremdValue * 100);
      const deltaPct = Math.round(d.delta * 100);
      return `- ${d.axis}: Selbst ${selfPct}% vs Fremd ${fremdPct}% (Δ ${deltaPct >= 0 ? '+' : ''}${deltaPct}%, ${d.magnitude})`;
    }).join('\n');

    const polarizedNote = input.fremdbild.polarizedAxes && input.fremdbild.polarizedAxes.length > 0
      ? `\n## ⚠ POLARISIERTE WAHRNEHMUNG\nAchsen mit hoher Streuung im Fremdbild (uneinheitliche Wirkung): ${input.fremdbild.polarizedAxes.join(', ')}\n→ Hier ist der Mittelwert nicht aussagekräftig — ein Teil des Teams erlebt den Trainer ganz anders als der Rest. Das ist oft kritischer als ein einheitlich mittelmäßiger Wert.`
      : '';

    section360 = `

# 360°-SPIEGEL (Fremdbild aus Team)
Anzahl Einschätzungen: ${input.fremdbild.responseCount}

## Fremdbild-Achsen
${fremdAxes}

## DISKREPANZEN Selbst vs Fremd
${discrepancies}
${polarizedNote}
`;

    extraOutputs = `,
  "fremdbild_summary": "~120 Wörter. Die zentrale Erkenntnis aus dem 360° Spiegel.",
  "spiegel_narrative": "~200 Wörter. Lies die Diskrepanzen als zusammenhängende Geschichte. Welcher Achsen-Vergleich erzählt die wichtigste Wahrheit?",
  "diskrepanz_interpretationen": {
    "struktur_intuition": "~50 Wörter — was bedeutet die Diskrepanz konkret im Coaching-Alltag?",
    "autoritaet_beteiligung": "~50 Wörter",
    "leistung_beziehung": "~50 Wörter",
    "stabilisierung_aktivierung": "~50 Wörter",
    "reflexion_direktheit": "~50 Wörter",
    "standardisierung_anpassung": "~50 Wörter"
  },
  "blind_spots": "~150 Wörter. Die 1-2 wichtigsten Blind Spots — konkret, mit Hinweis was im Co-Trainer-Gespräch besprochen werden sollte."`;
  }

  let sectionTeamcheck = '';
  let extraTeamcheckOutputs = '';
  if (input.teamcheck) {
    const tc = input.teamcheck;
    const fmt = (v: number) => `${Math.round(v * 100)}%`;
    sectionTeamcheck = `

# TEAMCHECK (Spielerstimmen, anonym aggregiert)
Anzahl Antworten: ${tc.responseCount}

- Coach Impact: ${fmt(tc.coachImpact)}
- Psychologische Sicherheit: ${fmt(tc.psySafety)}
- Teamklima: ${fmt(tc.teamKlima)}
- Leistungsklima: ${fmt(tc.leistungsdruck)}
- Rollenklarheit: ${fmt(tc.klarheit)}
`;

    extraTeamcheckOutputs = `,
  "teamcheck_summary": "~120 Wörter. Was sagen die Spieler über die Team-Realität?",
  "teamcheck_narrative": "~200 Wörter. Lies die Team-Scores als zusammenhängendes System.",
  "team_dynamics": "~150 Wörter. Wie hängen Coach-Impact, Psy-Safety und Leistungsklima zusammen?",
  "team_handlungsempfehlungen": [
    "4 konkrete, sofort umsetzbare Maßnahmen für die nächsten 14 Tage"
  ]`;
  }

  // ============== PREMIUM INTELLIGENCE OUTPUT REQUIREMENTS ==============
  const isPremium = input.productTier >= 2;
  let premiumOutputs = '';
  if (isPremium) {
    premiumOutputs = `,
  "coach_signature_portrait": "Essayistisches Premium-Portrait, ~250 Wörter. Kein Test-Ton, sondern Boutique-Consulting-Sprache. Beispiel-Stil: 'Dieses Profil vereint hohe Struktur, klare Führungsintention und einen ausgeprägten Anspruch an Verlässlichkeit. Die Stärke liegt in Orientierung, Berechenbarkeit und Standardsicherheit. Kritisch wird das Profil dort, wo Unsicherheit steigt und Struktur zunehmend als Kontrolle erlebt wird...'",

  "paradoxien": [
    "3-4 Trainer-Paradoxien als Kurzsätze. Beispiele: 'Hohe Klarheit, aber begrenzte Anschlussfähigkeit', 'Starke Beziehung, aber sinkende Konsequenz unter Druck'. Konkret aus den Werten dieses Trainers abgeleitet, nicht generisch."
  ],

  "shadow_pattern": "~120 Wörter. Das spezifische Kippmuster dieses Profils. Was wird unter Druck aus seiner Stärke? Beispiel: 'Das Schattenmuster dieses Profils liegt nicht in mangelnder Führung, sondern in der Tendenz zur Verengung unter steigender Unsicherheit. Was im Alltag als Struktur wirkt, kann unter Druck als erhöhte Kontrolle erlebt werden.'",

  "wirkung_je_kontext": {
    "trainingsalltag": "~50 Wörter — wie wirkt der Trainer in der Routine?",
    "spieltag": "~50 Wörter — wie wirkt er an Tagen mit Wettkampfdruck?",
    "niederlage": "~50 Wörter — wie wahrscheinlich verändert sich die Wirkung nach einer Niederlage?",
    "konflikt": "~50 Wörter — wie verhält sich der Trainer in Konfliktsituationen?",
    "krise": "~50 Wörter — wie wirkt er in akuten Krisenphasen?"
  },

  ${input.maturityScores ? '"fuehrungsreife_interpretation": "~180 Wörter. Interpretiere die 6 Reifeachsen. Wo ist der Trainer souverän, wo gibt es Reife-Lücken? Reife ≠ Stil — kläre das.",' : ''}

  "no_go_warnungen": [
    "3-5 konkrete No-Go-Hinweise je nach Profil. Was sollte dieser Trainer NICHT tun? Beispiele bei kontrollstarkem Profil: 'Nicht noch mehr Kontrolle erhöhen wenn Unsicherheit steigt', 'Keine pauschale Teamkritik im Kollektiv'. Sehr praktisch, nicht moralisch."
  ],

  ${input.context?.seasonPhase ? `"saisonphase_interpretation": "~150 Wörter. Wie wirkt dieser konkrete Stil in der aktuellen Phase '${SEASON_PHASE_LABELS[input.context.seasonPhase]}'? Was sind die Vorteile und Risiken DIESES Stils in DIESER Phase?",` : ''}

  ${input.context?.teamMaturity ? `"coach_to_team_fit": "~150 Wörter. Wie gut passt dieser Stil zu einem '${TEAM_MATURITY_LABELS[input.context.teamMaturity]}' Team? Was funktioniert, was nicht?",` : ''}

  "spielerbedarf": "~150 Wörter. Was brauchen Spieler von diesem konkreten Stil, damit er anschlussfähig wird? Konkret formuliert, nicht abstrakt.",

  "beratungswuerdigkeit": "Eines von: 'gering', 'mittel', 'hoch'. Wie hoch ist der Beratungsbedarf bei diesem Profil?",

  "fuehrungsenergie": "Ein bis zwei Adjektive aus: beruhigend, verdichtend, aktivierend, verengend, ordnend, destabilisierend, verbindend, distanzierend, mobilisierend, stabilisierend. Beispiel: 'ordnend und stabilisierend' oder 'verdichtend und distanzierend'."`;
  }

  return `Erstelle einen Premium-Diagnostik-Bericht.

# Trainer
- Name: ${input.traineeName ?? 'nicht angegeben'}
- Sport: ${input.sport ?? 'nicht angegeben'}
- Paket: ${input.productName} (Tier ${input.productTier})

# Primärer Archetyp
**${input.primaryArchetype.name_de}** — ${input.primaryArchetype.short_trait}
Kernmuster: ${input.primaryArchetype.kernmuster}
Stärken: ${input.primaryArchetype.staerken.join(', ')}
Risiken: ${input.primaryArchetype.risiken.join(', ')}
Hebel: ${input.primaryArchetype.entwicklungshebel.join(', ')}

# Sekundärer Archetyp
${input.secondaryArchetype.name_de} — ${input.secondaryArchetype.short_trait}

# Selbstbild-Achsen (6 Kernachsen, 0–100%)
${axes}

# Modul-Durchschnitte
${modules}
${sectionMaturity}${sectionContext}${section360}${sectionTeamcheck}

---

AUFGABE: Generiere folgendes JSON. Jeder Text personalisiert auf die konkrete Ausprägung — nicht generisch.

{
  "executive_summary": "3-4 Sätze. Kernbotschaft. Was macht diesen Trainer besonders, wo liegt die markanteste Spannung?${input.fremdbild ? ' Inkludiere die 360°-Erkenntnis.' : ''}",
  "archetyp_interpretation": "~200 Wörter. Deute den primären Archetyp im Licht der konkreten Axis-Werte.",
  "signature_narrative": "~150 Wörter. Lies die 6 Achsen als zusammenhängende funktionale Signatur.",
  "druckprofil": "~150 Wörter. Wie verändert sich der Stil unter Druck?",
  "modul_interpretationen": {
    "A": "~80 Wörter Führungsidentität",
    "B": "~80 Wörter Kommunikation",
    "C": "~80 Wörter Entscheidung",
    "D": "~80 Wörter Fehlerkultur",
    "E": "~80 Wörter Druck",
    "F": "~80 Wörter Motivation",
    "G": "~80 Wörter Beziehung"
  },
  "hauptrisiken": "~150 Wörter. Die 2-3 wichtigsten Risiken, NICHT 'Schwächen' nennen — verwende 'Entwicklungsrisiken', 'Wirkungsgrenzen', 'Übersteuerungen'.",
  "entwicklungspfad": "~150 Wörter. Wo liegt der größte Hebel?",
  "gespraechsleitfaden": ["5 konkrete offene Fragen für Reflexionsgespräch"],
  "naechste_30_tage": ["4 konkrete Schritte für 30 Tage"]${extraOutputs}${extraTeamcheckOutputs}${premiumOutputs}
}

Antworte nur mit dem JSON.`;
}

export async function generateReportTexts(input: ReportInput): Promise<ReportOutput> {
  const anthropic = getAnthropic();

  const msg = await anthropic.messages.create({
    model: REPORT_MODEL,
    max_tokens: 16000,
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
