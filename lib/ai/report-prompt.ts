import { getAnthropic, REPORT_MODEL } from '@/lib/ai/anthropic';
import type { AxisScores, AxisDiscrepancy, MaturityScores } from '@/lib/scoring';
import { buildKnowledgeContext } from '@/lib/ai/trainer-knowledge';
import { matchDevelopmentProgram, buildProgramPromptBlock } from '@/lib/knowledge/development-matcher';
import { buildOperatingManual, buildPlayerTypeMatrix } from '@/lib/insight/operating-manual';

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
  /**
   * Distanz-Differenz zwischen Primär- und Sekundär-Archetyp (absolut).
   * Nur noch Kontext/Fallback — die kanonische Mischprofil-Entscheidung kommt
   * aus `profileType` (gleiche Schwelle wie Result-Seite & finalize).
   */
  archetypeDistanceDelta?: number | null;
  /**
   * KANONISCHER Profiltyp aus classifyProfile (Bestcase §9/§10): 'mixed' →
   * Report formuliert ausdrücklich die Mischung, nie „Du bist eindeutig X".
   * Optional/Fallback auf archetypeDistanceDelta für Alt- und Sample-Aufrufer.
   */
  profileType?: 'dominant' | 'mixed' | null;
  axisScores: AxisScores;
  moduleAverages: Record<string, number>;
  /**
   * Wichtig−Gelebt-Lücke je Modul (0..1, höher = größere Lücke zwischen
   * dem, was dem Trainer wichtig ist, und dem, was er aktuell lebt).
   * Speist das profilbasierte Entwicklungs-Matching.
   */
  moduleGaps?: Record<string, number> | null;

  // PREMIUM INTELLIGENCE LAYER
  maturityScores?: MaturityScores | null;
  context?: {
    seasonPhase?: SeasonPhase | null;
    teamMaturity?: TeamMaturity | null;
    conflictState?: ConflictState | null;
    ageRange?: string | null;
    notes?: string | null;
    trainingLevel?: string | null;  // amateur_hobby | amateur_ambitioniert | semi_profi | profi
    ageGroup?: string | null;        // kids_u12 | jugend_u16 | jugend_u18 | erwachsene | gemischt
    clubType?: string | null;
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
    /** Achtsamkeitshinweise — anonym aggregiert, nicht-diagnostisch (lib/safety/care-triggers.ts). */
    careHints?: { topic: string; text: string }[];
  } | null;

  /** Antwortqualität (#6) — steuert claim-sicheres Hedging im Report. */
  responseQuality?: {
    dataQuality: 'gut' | 'eingeschraenkt' | 'nicht_interpretierbar';
    confidence: 'hoch' | 'mittel' | 'niedrig';
    note: string;
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

  // === ENTWICKLUNGSPROGRAMM (evidenzbasiert, Tier ≥ 2) ===
  entwicklungsprogramm?: {
    kernfokus: string;            // ~120 Wörter: die 1-2 wichtigsten Fokusfelder
    vierzehn_tage: string[];      // konkrete Sofort-Bausteine
    dreissig_tage: string[];      // Routinen
    neunzig_tage: string[];       // Strukturarbeit
    wissenschaftlicher_hinweis: string; // claim-sicherer Evidenz-Hinweis
  };

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

  // === Wirkung je Spielertyp + Bedienungsanleitung (Tier ≥ 2) ===
  wirkung_je_spielertyp?: Array<{ spielertyp: string; wirkung: string; anpassung: string }>;
  bedienungsanleitung?: {
    ueberschrift: string;
    kernsatz: string;
    staerken: string[];
    unterDruck: string;
    soErreichstDuMich: string;
    soGibstDuFeedback: string;
    vermeide: string;
  };
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
  return `Du bist ein Senior Sportpsychologe und Führungs-Consultant im Premium-Segment der CoachCheck Assessment Plattform — entwickelt in Tirol/Österreich gemeinsam mit Wissenschaftlern, Profitrainern und Sportlern. Du schreibst Berichte für erfahrene Trainer:innen im Profisport auf Boutique-Consulting-Niveau.

${buildKnowledgeContext()}

DEIN STIL:
- Ruhig, präzise, beratungsnah — nicht reißerisch, nicht therapeutisch
- KEIN Marketing-Sprech, KEIN Psychoblabla ("inneres Kind", "Energie", "Chakra")
- KEINE banalen Allgemeinplätze, KEINE 0815-Listen
- Sprache: hochwertig, nuanciert, respektvoll. Sätze dürfen lang und gedanklich komplex sein.
- Duze den Trainer
- Deutsch, akademisch-fundiert aber zugänglich
- KONKRET vor abstrakt: Jeder zentrale Befund wird an einer beobachtbaren Szene aus dem Trainer-Alltag festgemacht (Halbzeit beim Rückstand, Auswechslung, Trainingsabbruch, Kabinenansprache nach einer Niederlage, Gespräch mit einem unzufriedenen Stammspieler). Lieber ein präzises Bild aus dem Spielbetrieb als ein weiterer abstrakter Satz.
- BILDLICHE SPRACHE ist erwünscht — aber bodenständig und aus Sport/Alltag, nicht esoterisch: Metaphern wie "deine Klarheit ist das Geländer, an dem sich die Mannschaft festhält" oder "unter Druck ziehst du die Zügel an, statt das Tempo rauszunehmen". Das ist das Gegenteil von Psychoblabla: konkret, anschaulich, überprüfbar.
- Die Wissensbasis oben ist dein theoretischer Hintergrund — arbeite damit, aber ZITIERE NIE wörtlich. Nutze ihre Logik, um Befunde präzise zu rahmen.

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

9. **Konkrete Mini-Beispiele statt Theorie**
   Mindestens in Überblick, Druckprofil, "Wirkung je Kontext" und im Entwicklungspfad: jeweils eine kurze, konkrete Szene aus dem Fußballalltag, die den Befund greifbar macht ("Beim Stand von 0:1 zur Halbzeit ...", "Wenn ein Stammspieler auf der Bank sitzt ..."). Abstrakte Aussagen ohne Beispiel wirken theoretisch — vermeide das.

10. **Bildhaft, nicht akademisch-trocken**
   Nutze ein bis zwei tragfähige Bilder/Metaphern aus Sport und Alltag, um die Führungssignatur und das Kippmuster anschaulich zu machen. Bodenständig, kein Eso-Vokabular.

11. **Entwicklungsprogramm: evidenzbasiert, nicht erfunden**
   Wenn im User-Prompt ein Block "ENTWICKLUNGSPROGRAMM — ausgewählte evidenzbasierte Bausteine" vorkommt, leite das Feld "entwicklungsprogramm" AUSSCHLIESSLICH aus diesen vorausgewählten Bausteinen ab. Übersetze sie in ruhige Beratersprache und handlungsnahe Sätze. Erfinde keine zusätzlichen Methoden. Zeige NIEMALS interne IDs, Evidenzgrade, Modulnamen oder Quellen. Formuliere Coaching-Hypothesen und beobachtbares Verhalten — keine Diagnose, kein "du musst nur mental stärker werden", kein "mehr Druck = mehr Motivation".

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

  // ---------- ENTWICKLUNGSPROGRAMM (evidenzbasiertes Matching) ----------
  // Verbindet das Profil mit konkreten Bausteinen aus dem Science Knowledge Core.
  const program = matchDevelopmentProgram({
    axisScores: input.axisScores,
    maturityScores: input.maturityScores ?? null,
    moduleAverages: input.moduleAverages,
    moduleGaps: input.moduleGaps ?? null,
    maxItems: 6,
  });
  const sectionProgram = program.items.length > 0 ? `\n\n${buildProgramPromptBlock(program)}` : '';

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
    if (c.trainingLevel) {
      const LEVEL_LABELS: Record<string, string> = {
        amateur_hobby: 'Amateur-Hobby (Freizeit, Spaß-Fokus)',
        amateur_ambitioniert: 'Ambitionierter Amateur (Liga-Fokus)',
        semi_profi: 'Semi-Profi / Nachwuchs-Leistungssport',
        profi: 'Profi-Vollzeit',
      };
      lines.push(`- Niveau: ${LEVEL_LABELS[c.trainingLevel] ?? c.trainingLevel}`);
    }
    if (c.ageGroup) {
      const AGE_LABELS: Record<string, string> = {
        kids_u12: 'Kinder (bis U12)',
        jugend_u16: 'Jugend U13-U16',
        jugend_u18: 'Jugend U17-U19',
        erwachsene: 'Erwachsene',
        gemischt: 'gemischte Altersgruppen',
      };
      lines.push(`- Altersklasse der Spieler: ${AGE_LABELS[c.ageGroup] ?? c.ageGroup}`);
    }
    if (c.seasonPhase) lines.push(`- Saisonphase: ${SEASON_PHASE_LABELS[c.seasonPhase] ?? c.seasonPhase}`);
    if (c.teamMaturity) lines.push(`- Team-Reife: ${TEAM_MATURITY_LABELS[c.teamMaturity] ?? c.teamMaturity}`);
    if (c.conflictState) lines.push(`- Konfliktlage: ${CONFLICT_STATE_LABELS[c.conflictState] ?? c.conflictState}`);
    if (c.ageRange) lines.push(`- Altersstruktur: ${c.ageRange}`);
    if (c.notes) lines.push(`- Notizen des Trainers: "${c.notes}"`);
    if (lines.length > 0) {
      sectionContext = `

# AKTUELLER KONTEXT
${lines.join('\n')}

→ Wichtig: Schreibe den Report SPEZIFISCH für dieses Niveau. Ein Amateur-Hobby-Trainer braucht andere Beispiele und einen anderen Ton als ein Profi-Trainer. Die Szenen sollten aus dem echten Alltag dieses Niveaus stammen. Derselbe Stil wirkt in verschiedenen Kontexten unterschiedlich.
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
  "blind_spots": "~150 Wörter. Die 1-2 wichtigsten blinden Flecken — konkret, mit Hinweis was im Co-Trainer-Gespräch besprochen werden sollte."`;
  }

  let sectionTeamcheck = '';
  let extraTeamcheckOutputs = '';
  if (input.teamcheck) {
    const tc = input.teamcheck;
    const fmt = (v: number) => `${Math.round(v * 100)}%`;
    sectionTeamcheck = `

# TEAMCHECK (Spielerstimmen, anonym aggregiert)
Anzahl Antworten: ${tc.responseCount}

- Coach-Wirkung: ${fmt(tc.coachImpact)}
- Psychologische Sicherheit: ${fmt(tc.psySafety)}
- Teamklima: ${fmt(tc.teamKlima)}
- Leistungsklima: ${fmt(tc.leistungsdruck)}
- Rollenklarheit: ${fmt(tc.klarheit)}
`;

    if (tc.careHints && tc.careHints.length > 0) {
      sectionTeamcheck += `
## Achtsamkeitshinweise (anonym aggregierte Antwortmuster — KEIN Befund, KEINE Aussage über Einzelpersonen)
${tc.careHints.map((h) => `- ${h.topic}: ${h.text}`).join('\n')}

WICHTIG für deine Texte: Greife diese Hinweise in teamcheck_narrative und team_handlungsempfehlungen sensibel auf — als Gesprächsimpulse im geschützten Rahmen. Spekuliere NIE über einzelne Spieler, nenne keine Rollen oder Positionen, leite keine Einordnungen über Personen ab und formuliere nichts, was Rückschlüsse auf Einzelne erlauben würde.
`;
    }

    extraTeamcheckOutputs = `,
  "teamcheck_summary": "~120 Wörter. Was sagen die Spieler über die Team-Realität?",
  "teamcheck_narrative": "~200 Wörter. Lies die Team-Scores als zusammenhängendes System.",
  "team_dynamics": "~150 Wörter. Wie hängen Coach-Wirkung, psychologische Sicherheit und Leistungsklima zusammen?",
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

  "fuehrungsenergie": "Ein bis zwei Adjektive aus: beruhigend, verdichtend, aktivierend, verengend, ordnend, destabilisierend, verbindend, distanzierend, mobilisierend, stabilisierend. Beispiel: 'ordnend und stabilisierend' oder 'verdichtend und distanzierend'.",

  "wirkung_je_spielertyp": [
    "Genau diese vier Spielertypen, je ein Objekt {\"spielertyp\", \"wirkung\", \"anpassung\"}. spielertyp WÖRTLICH: 'Der selbstbewusste Leistungsträger', 'Der unsichere, zurückhaltende Spieler', 'Der kreative Eigenständige', 'Der junge Entwicklungsspieler'. wirkung (~40 Wörter): wie DIESER konkrete Stil bei diesem Typ ankommt — Stärke UND mögliche Reibung, abgeleitet aus den Achsenwerten. anpassung (~25 Wörter): EINE konkrete, sofort umsetzbare Anpassung. Kein Pauschalurteil, keine Diagnose."
  ],

  "bedienungsanleitung": {
    "ueberschrift": "Der Archetyp-Name dieses Trainers.",
    "kernsatz": "Ein Wiedererkennungssatz (~25 Wörter), der den Stil auf den Punkt bringt.",
    "staerken": ["3 Kernstärken als Kurzbegriffe (1-3 Wörter)."],
    "unterDruck": "Ein Satz: wie der Stil unter Druck kippt (Stärke → Wirkungsgrenze).",
    "soErreichstDuMich": "~30 Wörter: wie man diesen Trainer am besten erreicht und motiviert.",
    "soGibstDuFeedback": "~30 Wörter: wie man IHM Feedback geben sollte, damit es ankommt.",
    "vermeide": "~25 Wörter: was man im Umgang mit ihm vermeiden sollte."
  }`;
  }

  // ============== ENTWICKLUNGSPROGRAMM OUTPUT (Tier ≥ 2) ==============
  let programOutput = '';
  if (isPremium && program.items.length > 0) {
    programOutput = `,
  "entwicklungsprogramm": {
    "kernfokus": "~120 Wörter. Formuliere aus den priorisierten Fokusfeldern oben die 1-2 wichtigsten Entwicklungsrichtungen für DIESEN Trainer — als ruhige Beratersprache, nicht als To-do-Liste. Mache klar, warum gerade diese Felder den größten Hebel haben.",
    "vierzehn_tage": ["2-3 konkrete, sofort umsetzbare Bausteine aus den 14-Tage-Vorlagen oben, in eigene Trainer-Sprache übersetzt (kein Listenkürzel, vollständige handlungsnahe Sätze)."],
    "dreissig_tage": ["2-3 Routinen aus den 30-Tage-Vorlagen, als beobachtbares Verhalten formuliert."],
    "neunzig_tage": ["1-2 strukturelle Bausteine aus den 90-Tage-Vorlagen (Team-/Kulturarbeit)."],
    "wissenschaftlicher_hinweis": "~40 Wörter. Ein claim-sicherer Hinweis, dass diese Bausteine theoriegeleitete Coaching-Hypothesen auf Basis evidenzbasierter Methodik sind — keine Diagnose. KEINE Quellen, KEINE internen Begriffe zitieren."
  }`;
  }

  return `Erstelle einen Premium-Coaching-Analyse-Bericht.

Wichtig für die Sprache: Dies ist KEINE klinische Diagnostik und KEIN
validierter Persönlichkeitstest. Formuliere Aussagen als Coaching-Hypothesen
und Beobachtungen über Muster, nicht als feststehende Diagnosen über die
Person. Worte wie "diagnostiziert", "Diagnose", "wer du wirklich bist",
"validiert" vermeiden. Stattdessen: "Muster zeigen", "deine Daten deuten auf",
"als Coaching-Sprache", "Hypothese für das Gespräch".

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
${(input.profileType === 'mixed' || (input.profileType == null && input.archetypeDistanceDelta != null && input.archetypeDistanceDelta < 0.05)) ? `
⚠ MISCHPROFIL-HINWEIS: Primär- und Sekundär-Archetyp liegen bei dieser Person nahezu gleich nah. Schreibe NICHT "Du bist [Primär]" und nicht "Du bist eindeutig [Primär]", sondern formuliere es ausdrücklich als Mischprofil. Beispiel: "Dein Profil ist ein Mischprofil aus [Primär] und [Sekundär] — beide Muster sind bei dir aktuell etwa gleich stark präsent." Behandle die Person als hybriden Typ, nicht als reinen Vertreter eines Archetyps.
` : ''}

# Selbstbild-Achsen (6 Kernachsen, 0–100%)
${axes}

# Modul-Durchschnitte
${modules}
${sectionMaturity}${sectionContext}${section360}${sectionTeamcheck}${sectionProgram}
${input.responseQuality && input.responseQuality.dataQuality !== 'gut' ? `
# ⚠ DATENQUALITÄT: ${input.responseQuality.dataQuality === 'nicht_interpretierbar' ? 'NICHT INTERPRETIERBAR' : 'EINGESCHRÄNKT'}
${input.responseQuality.note}
Formuliere ALLE Aussagen entsprechend vorsichtiger und mit explizitem Vorbehalt. Vermeide präzise Zuschreibungen. Weise im executive_summary klar darauf hin, dass die Aussagekraft begrenzt ist und eine Wiederholung in Ruhe sinnvoll wäre.
` : ''}
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
  "naechste_30_tage": ["4 konkrete Schritte für 30 Tage"]${extraOutputs}${extraTeamcheckOutputs}${premiumOutputs}${programOutput}
}

Antworte nur mit dem JSON.`;
}

export const PROMPT_VERSION = 'report-v2.10-2026-06-01';

// Pflicht-Textfelder mit Mindesttiefe (Zeichen) — Premium heißt Substanz, nicht 10 Zeichen.
const REQUIRED_FIELD_MIN: Record<string, number> = {
  executive_summary: 220,
  archetyp_interpretation: 180,
  signature_narrative: 150,
  druckprofil: 150,
  hauptrisiken: 150,
  entwicklungspfad: 150,
};

// Listen-Mindestlängen.
const LIST_FIELD_MIN: Record<string, number> = {
  gespraechsleitfaden: 3,
  naechste_30_tage: 3,
};

// Tokens, die auf KI-Ausfall, Platzhalter oder Floskel-Müll hindeuten → Report verwerfen & neu rollen.
const JUNK_RE = /\bals (eine?r? )?ki\b|as an ai\b|i am an ai|i'?m sorry|i cannot (help|assist|provide)|lorem ipsum|\btodo\b|\bfixme\b|platzhalter|\{\{|\[\s*(name|hier|einf[üu]gen|insert|todo)/i;

/** Alle String-Werte (auch verschachtelt) flach einsammeln. */
function collectStrings(o: unknown, out: string[] = []): string[] {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) for (const x of o) collectStrings(x, out);
  else if (o && typeof o === 'object') for (const v of Object.values(o)) collectStrings(v, out);
  return out;
}

/**
 * Premium-Schema-Validierung (#8): prüft nicht nur Existenz, sondern SUBSTANZ.
 * Liefert Liste der Mängel. Leer = report ist tief genug für Premium-Auslieferung.
 */
export function validateReportOutput(o: unknown): string[] {
  const problems: string[] = [];
  if (!o || typeof o !== 'object') return ['kein Objekt'];
  const r = o as Record<string, unknown>;

  for (const [f, min] of Object.entries(REQUIRED_FIELD_MIN)) {
    const v = r[f];
    if (typeof v !== 'string' || v.trim().length < min) problems.push(`${f} (<${min} Zeichen)`);
  }

  // Alle 7 Module vorhanden UND substanziell.
  const mods = r.modul_interpretationen;
  if (!mods || typeof mods !== 'object') {
    problems.push('modul_interpretationen');
  } else {
    for (const code of Object.keys(MODULE_TITLES)) {
      const t = (mods as Record<string, unknown>)[code];
      if (typeof t !== 'string' || t.trim().length < 80) problems.push(`modul_${code}`);
    }
  }

  // Listen nicht leer, Einträge substanziell.
  for (const [f, min] of Object.entries(LIST_FIELD_MIN)) {
    const arr = r[f];
    if (!Array.isArray(arr) || arr.length < min || arr.some((x) => typeof x !== 'string' || x.trim().length < 15)) {
      problems.push(`${f} (≥${min} substanzielle Einträge)`);
    }
  }

  // Floskel-/Platzhalter-/KI-Ausfall-Scan über alle Texte.
  if (JUNK_RE.test(collectStrings(r).join(' \n '))) problems.push('platzhalter/floskel/ki-ausfall-text');

  return problems;
}

/**
 * Deterministischer Fallback-Report OHNE KI (#8). Verhindert, dass ein
 * KI-Ausfall den Userflow zerstört. Claim-sicher, klar als reduziert markiert.
 */
export function buildFallbackReport(input: ReportInput): ReportOutput {
  const a = input.primaryArchetype;
  const staerken = (a.staerken ?? []).join(', ');
  const risiken = (a.risiken ?? []).join(', ');
  const hebel = (a.entwicklungshebel ?? []).join(', ');
  const modul: Record<string, string> = {};
  for (const code of Object.keys(MODULE_TITLES)) {
    modul[code] = `Im Bereich „${MODULE_TITLES[code]}" zeigen deine Antworten ein erkennbares Muster, das sich gut in das Gesamtbild von „${a.name_de}" einfügt. Es liefert einen belastbaren Ansatzpunkt, um deine Wirkung in genau diesem Feld bewusst weiterzuentwickeln und im Trainingsalltag gezielt zu beobachten.`;
  }
  return {
    executive_summary: `Diese kompakte Auswertung verdichtet die belastbaren Kernbefunde deines Profils. Dein Antwortverhalten tendiert deutlich zu „${a.name_de}" (${a.short_trait}). Kernmuster: ${a.kernmuster}. Du erhältst damit eine klare Orientierung darüber, wie du führst, wo deine Stärken tragen und an welchen Stellen dein Stil unter Belastung an Wirkungsgrenzen stößt. Die folgenden Abschnitte ordnen dein Muster entlang der sechs Kernachsen und der sieben Module ein — als Coaching-Sprache für deine eigene Reflexion und das Gespräch mit deinem Umfeld.`,
    archetyp_interpretation: `Dein Antwortprofil zeigt Muster, die zu „${a.name_de}" passen: ${a.kernmuster}. Charakteristisch sind dabei vor allem ${staerken || 'die in den sechs Achsen sichtbaren Ausprägungen'}. Diese Zuordnung ist eine Coaching-Hypothese für deine Reflexion und das gemeinsame Gespräch — ausdrücklich keine Diagnose und keine abschließende Bewertung deiner Person. Sie beschreibt, wie dein Stil typischerweise wirkt, und macht sichtbar, wo er trägt und wo er an Grenzen stößt.`,
    signature_narrative: `Deine funktionale Trainer-Signatur ergibt sich aus dem Zusammenspiel der sechs Kernachsen und verdichtet sich im Profil „${a.name_de}". Sie zeigt, welche Haltung dein Führungsverhalten trägt — und welche Spannungen du dabei aushältst. Im Trainingsalltag, am Spieltag und unter Druck wirkt diese Signatur jeweils etwas anders; genau diese Unterschiede sind der Hebel für deine Weiterentwicklung.`,
    druckprofil: `Unter Belastung verstärken sich erfahrungsgemäß die markantesten Ausprägungen eines Stils — bei „${a.name_de}" sind das die oben genannten Muster. Aus einer Stärke kann dann eine Wirkungsgrenze werden: Klarheit kippt in Härte, Ruhe in Distanz, Nähe in Harmoniestreben. Achte darauf, in Drucksituationen bewusst die Wirkung zu wählen, die deine Mannschaft in diesem Moment wirklich braucht.`,
    modul_interpretationen: modul,
    hauptrisiken: `Mögliche Entwicklungsfelder in diesem Profil: ${risiken || 'die Wirkungsgrenzen deines dominanten Stils'}. Sie sind als Wirkungsgrenzen und Risikozonen unter Belastung zu verstehen — nicht als Defizite. Entscheidend ist, unter welchen Bedingungen sie auftreten und woran du sie früh erkennst, bevor sie deine Wirkung im Team schmälern.`,
    entwicklungspfad: `Sinnvolle nächste Schritte orientieren sich an: ${hebel || 'der Anschlussfähigkeit deines Stils'}. Entscheidend ist nicht „mehr vom Gleichen", sondern gezielte Arbeit daran, wie dein Stil bei unterschiedlichen Spielertypen ankommt. Beginne mit einer konkreten Situation, in der deine Wirkung zuletzt nicht so war, wie du sie dir gewünscht hast — und leite daraus einen kleinen, beobachtbaren Schritt ab.`,
    gespraechsleitfaden: [
      'Welche dieser Muster erkennst du im Alltag mit deiner Mannschaft wieder?',
      'Wo trägt dich dein Stil besonders — und wo spürst du seine Grenzen?',
      'Welche Spielertypen erreichst du gut, welche weniger gut?',
      'An welchem Punkt möchtest du als Erstes ansetzen?',
    ],
    naechste_30_tage: [
      'Eine konkrete Situation der letzten Wochen notieren, in der dein Stil klar gewirkt hat.',
      'Eine Situation festhalten, in der du dir eine andere Wirkung gewünscht hättest.',
      'In einem Training bewusst eine kleine Verhaltensänderung ausprobieren und ihre Wirkung beobachten.',
      'Das Ergebnis kurz reflektieren und daraus einen nächsten konkreten Schritt ableiten.',
    ],
    wirkung_je_spielertyp: buildPlayerTypeMatrix(a, input.axisScores),
    bedienungsanleitung: buildOperatingManual(a, input.axisScores),
  };
}

export type ReportGenerationMeta = {
  output: ReportOutput;
  promptVersion: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  attempts: number;
  fallback: boolean;
};

function isTransient(err: unknown): boolean {
  const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return /429|500|502|503|504|overloaded|timeout|rate|temporar|econn/.test(m);
}

/** Wie generateReportTexts, aber mit Retry, Validierung, Usage + Fallback. */
export async function generateReportTextsWithMeta(input: ReportInput, maxAttempts = 3): Promise<ReportGenerationMeta> {
  // Client-Init (z. B. fehlender ANTHROPIC_API_KEY) darf nicht hart werfen —
  // sonst läuft der aufrufende Report-Job ins Leere. Stattdessen Fallback-Report.
  let anthropic: ReturnType<typeof getAnthropic>;
  try {
    anthropic = getAnthropic();
  } catch (err) {
    console.error('[report] Anthropic client unavailable, using fallback:', err instanceof Error ? err.message : err);
    return {
      output: buildFallbackReport(input),
      promptVersion: PROMPT_VERSION,
      model: REPORT_MODEL,
      promptTokens: null,
      completionTokens: null,
      attempts: 0,
      fallback: true,
    };
  }
  let lastErr: unknown = null;
  let correction = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model: REPORT_MODEL,
        max_tokens: 16000,
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: buildUserPrompt(input) + correction }],
      });

      const textBlock = msg.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') throw new Error('No text block in Claude response');

      let raw = textBlock.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      const firstBrace = raw.indexOf('{');
      const lastBrace = raw.lastIndexOf('}');
      if (firstBrace > 0 || lastBrace < raw.length - 1) raw = raw.substring(firstBrace, lastBrace + 1);

      const parsed = JSON.parse(raw) as ReportOutput;
      const problems = validateReportOutput(parsed);
      if (problems.length) throw new Error(`schema validation failed: ${problems.join(', ')}`);

      // Wirkung-je-Spielertyp + Bedienungsanleitung garantiert vorhanden machen:
      // liefert die KI sie nicht (oder unvollständig), deterministisch ergänzen.
      // Damit hängen PDF, Ergebnisseite und öffentliche Karte nie an der KI.
      if (!Array.isArray(parsed.wirkung_je_spielertyp) || parsed.wirkung_je_spielertyp.length === 0) {
        parsed.wirkung_je_spielertyp = buildPlayerTypeMatrix(input.primaryArchetype, input.axisScores);
      }
      if (!parsed.bedienungsanleitung || !parsed.bedienungsanleitung.kernsatz) {
        parsed.bedienungsanleitung = buildOperatingManual(input.primaryArchetype, input.axisScores);
      }

      return {
        output: parsed,
        promptVersion: PROMPT_VERSION,
        model: REPORT_MODEL,
        promptTokens: msg.usage?.input_tokens ?? null,
        completionTokens: msg.usage?.output_tokens ?? null,
        attempts: attempt,
        fallback: false,
      };
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[report] attempt ${attempt}/${maxAttempts} failed:`, message);

      // Schema-/Qualitätsmängel sind re-rollbar: präziser Korrektur-Hinweis fürs nächste Mal,
      // damit der nächste Versuch genau die zu dünnen Stellen vertieft — statt in den Fallback zu fallen.
      const isSchema = /schema validation failed/i.test(message);
      if (isSchema) {
        const mangel = message.replace(/^schema validation failed:\s*/i, '');
        correction = `\n\nKORREKTUR (vorheriger Entwurf war nicht Premium-tief genug): Die folgenden Felder waren zu kurz, generisch oder enthielten Platzhalter/Floskeln: ${mangel}. Schreibe sie deutlich substanzieller, spezifisch auf dieses Profil bezogen, ohne Füllsätze, ohne Selbstbezug als KI. Liefere erneut AUSSCHLIESSLICH das vollständige, valide JSON-Objekt.`;
      }

      if (attempt < maxAttempts && (isTransient(err) || isSchema)) {
        await new Promise((r) => setTimeout(r, (isSchema ? 200 : 800) * attempt));
        continue;
      }
      break;
    }
  }

  console.error('[report] all attempts failed, using fallback:', lastErr instanceof Error ? lastErr.message : lastErr);
  return {
    output: buildFallbackReport(input),
    promptVersion: PROMPT_VERSION,
    model: REPORT_MODEL,
    promptTokens: null,
    completionTokens: null,
    attempts: maxAttempts,
    fallback: true,
  };
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
