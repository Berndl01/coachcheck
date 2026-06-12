/**
 * HUMATRIX DEVELOPMENT MATCHER
 * ============================
 * Verbindet das diagnostische Profil eines Trainers (Achsen, Führungsreife,
 * Modul-Trends, Wichtig-vs-Gelebt-Lücken) mit den evidenzbasierten
 * Interventionen aus dem Development Core.
 *
 * Ergebnis: ein priorisiertes, machbares Entwicklungsprogramm
 * (14 / 30 / 90 Tage) — Trainer-fokussiert, kontextsensibel, claim-sicher.
 *
 * Wichtig: Dies ist KEINE Diagnose, sondern eine Coaching-Hypothese.
 * Die Auswahl liefert dem Report-Generator Bausteine; die endgültige
 * sprachliche Ausgestaltung übernimmt das LLM unter den Claim-Grenzen.
 */

import {
  INTERVENTIONS,
  KNOWLEDGE_MODULE_BY_ID,
  type Intervention,
} from '@/lib/knowledge/development-core';
import type { AxisKey, MaturityKey, AxisScores, MaturityScores } from '@/lib/scoring';

export type DevelopmentHorizon = '14' | '30' | '90';

export type FocusArea = {
  /** Interner Schlüssel (Achse oder Reifedimension). */
  key: string;
  kind: 'axis' | 'maturity' | 'module_gap';
  /** Anzeigetitel, z. B. "Konfliktreife" oder "Kontrolle vs. Orientierung". */
  label: string;
  /** Wie dringend (0..1) — höher = dringlicher. */
  urgency: number;
  /** Warum dieser Fokus relevant ist (Trainer-Sprache, claim-sicher). */
  rationale: string;
};

export type ProgramItem = {
  interventionId: string;
  name: string;
  /** Auf welchen Fokus diese Intervention einzahlt. */
  focusKey: string;
  focusLabel: string;
  /** Das Wissensmodul hinter der Intervention (interner Anker). */
  moduleId: string;
  moduleName: string;
  evidence: string;
  durationMin: number | null;
  horizon: DevelopmentHorizon;
  /** Originalschritte aus der Bibliothek. */
  steps: string[];
  /** Trainer-gerichtete Rahmung: wie der Coach diesen Baustein anwendet. */
  coachFraming: string;
  contraindication: string;
};

export type DevelopmentProgram = {
  focusAreas: FocusArea[];
  items: ProgramItem[];
  byHorizon: Record<DevelopmentHorizon, ProgramItem[]>;
  /** Claim-Hinweis, der im Report sichtbar gemacht werden sollte. */
  claimNote: string;
};

// ---------------------------------------------------------------------------
// Achsen-Labels (Pole) + Risikomuster bei Extremausprägung
// ---------------------------------------------------------------------------

const AXIS_POLES: Record<AxisKey, { low: string; high: string }> = {
  struktur_intuition: { low: 'Intuitiv', high: 'Strukturiert' },
  autoritaet_beteiligung: { low: 'Beteiligend', high: 'Autoritär' },
  leistung_beziehung: { low: 'Beziehungsorientiert', high: 'Leistungsorientiert' },
  stabilisierung_aktivierung: { low: 'Stabilisierend', high: 'Aktivierend' },
  reflexion_direktheit: { low: 'Direkt', high: 'Reflektiert' },
  standardisierung_anpassung: { low: 'Anpassend', high: 'Standardisierend' },
};

const MATURITY_LABELS: Record<MaturityKey, string> = {
  selbstregulation: 'Selbstregulation',
  perspektivflexibilitaet: 'Perspektivflexibilität',
  konfliktreife: 'Konfliktreife',
  druckreife: 'Druckreife',
  verantwortungsklarheit: 'Verantwortungsklarheit',
  integrationsfaehigkeit: 'Integrationsfähigkeit',
};

/**
 * Für jede Achse: welche Intervention(en) adressieren das Kippmuster am
 * HOHEN bzw. NIEDRIGEN Pol — plus eine Trainer-gerichtete Rahmung.
 * IDs verweisen auf INTERVENTIONS aus dem Development Core.
 */
type AxisRule = {
  pole: 'high' | 'low';
  label: string;
  rationale: string;
  interventionIds: string[];
  framings: Record<string, string>;
};

const AXIS_RULES: Record<AxisKey, AxisRule[]> = {
  struktur_intuition: [
    {
      pole: 'high',
      label: 'Kontrolle vs. Orientierung',
      rationale:
        'Deine starke Strukturierung gibt Sicherheit, kann unter Druck aber in Kontrolle kippen und den Handlungsraum der Spieler verengen.',
      interventionIds: ['I027', 'I028'],
      framings: {
        I027: 'Definiere einen klaren Prinzipienrahmen und gib innerhalb dessen eine bewusste Freiheitszone frei, statt jede Ausführung vorzugeben.',
        I028: 'Baue ein kontrolliertes Flexibilitätsfenster ein: eine variable Aufgabe pro Woche, die Spieler selbst lösen — mit kurzer Review.',
      },
    },
    {
      pole: 'low',
      label: 'Orientierung schaffen',
      rationale:
        'Deine intuitive Führung ist anschlussfähig, lässt aber Spieler manchmal ohne klare Orientierung zurück.',
      interventionIds: ['I033'],
      framings: {
        I033: 'Setze pro Woche einen klaren Orientierungsanker: eine Rollenpriorität und einen 14-Tage-Standard, den alle kennen.',
      },
    },
  ],
  autoritaet_beteiligung: [
    {
      pole: 'high',
      label: 'Autonomie im Rahmen',
      rationale:
        'Deine klare Führung erzeugt Orientierung; ohne Beteiligungsfenster sinkt jedoch die autonome Motivation der Spieler.',
      interventionIds: ['I003', 'I027'],
      framings: {
        I003: 'Erkläre den Standard, biete zwei Umsetzungswege an und lass den Spieler den Weg wählen — Verantwortung im klaren Rahmen.',
        I027: 'Gib innerhalb deiner Prinzipien eine sichtbare Freiheitszone frei; das senkt Mikromanagement-Frust ohne Kontrollverlust.',
      },
    },
    {
      pole: 'low',
      label: 'Tragfähige Orientierung',
      rationale:
        'Deine beteiligende Haltung schafft Nähe; in unklaren Phasen brauchen Spieler von dir aber sichtbare Richtungsentscheidungen.',
      interventionIds: ['I033'],
      framings: {
        I033: 'Verankere bei Unklarheit eine klare Rollenpriorität — Beteiligung ersetzt keine Entscheidung.',
      },
    },
  ],
  leistung_beziehung: [
    {
      pole: 'high',
      label: 'Verbindung trotz Forderung',
      rationale:
        'Dein Leistungsfokus treibt Entwicklung; ohne tragfähige Beziehung wird Forderung aber als Druck statt als Förderung erlebt.',
      interventionIds: ['I030', 'I004'],
      framings: {
        I030: 'Setze respektvolle Direktheit ein und baue Beziehung bewusst über gemeinsame Kompetenzarbeit auf — fordern und verbinden zugleich.',
        I004: 'Führe ein Arbeitsbündnis-Check-in: Was braucht der Spieler von dir, was du von ihm — und wo entstehen Missverständnisse?',
      },
    },
    {
      pole: 'low',
      label: 'Klarheit trotz Nähe',
      rationale:
        'Deine Beziehungsorientierung schafft Sicherheit; sie kann aber in Harmonieneigung kippen und nötige Konfrontation vermeiden.',
      interventionIds: ['I005', 'I026'],
      framings: {
        I005: 'Trainiere einen Fehlerkultur-Reset: Fehler als Lernsignal benennen, Mutaktion markieren, klare Korrektur, nächste Aktion fordern — klar bleiben statt schönreden.',
        I026: 'Definiere Grenzen für Teamverantwortung, damit Beziehungspflege nicht zur Konfliktvermeidung wird.',
      },
    },
  ],
  stabilisierung_aktivierung: [
    {
      pole: 'high',
      label: 'Energie dosieren',
      rationale:
        'Deine aktivierende Energie reißt mit; dauerhafte Aktivierung ohne Erholungsfenster erhöht aber das Übersteuerungsrisiko.',
      interventionIds: ['I024'],
      framings: {
        I024: 'Mache Regeneration explizit zur Leistung: definiere Belastungsgrenzen und Pausen-Erlaubnis im Wochenrhythmus.',
      },
    },
    {
      pole: 'low',
      label: 'Sichtbare Aktivierung',
      rationale:
        'Deine stabilisierende Ruhe gibt Halt; in Phasen, die Energie brauchen, kann sie als Distanz oder Passivität erlebt werden.',
      interventionIds: ['I029'],
      framings: {
        I029: 'Setze pro Training eine sichtbare aktivierende Aktion und verstärke sie positiv — Energie in kleinen, echten Schritten.',
      },
    },
  ],
  reflexion_direktheit: [
    {
      pole: 'high',
      label: 'Vom Verstehen ins Handeln',
      rationale:
        'Deine Reflexionstiefe verhindert vorschnelle Urteile; unter Druck kann sie aber in Übererklären und Entscheidungszögern kippen.',
      interventionIds: ['I032', 'I011'],
      framings: {
        I032: 'Übe und modelliere einen Emotion-zu-Handlung-Reset: Trigger benennen, Atem, klare nächste Aktion — Analyse danach.',
        I011: 'Etabliere im Team das 3-Atemzüge-Nächste-Aktion-Muster, damit Reflexion nicht die Handlungsfähigkeit bremst.',
      },
    },
    {
      pole: 'low',
      label: 'Direktheit ohne Härte',
      rationale:
        'Deine Direktheit schafft Klarheit; unter Belastung kann sie schärfer werden als beabsichtigt und Anschlussfähigkeit kosten.',
      interventionIds: ['I030', 'I032'],
      framings: {
        I030: 'Kombiniere deine Direktheit mit bewusster Beziehungsarbeit, damit Klarheit nicht als Härte ankommt.',
        I032: 'Setze bei Frust einen kurzen Reset vor die Ansage — Emotion zuerst kanalisieren, dann klar führen.',
      },
    },
  ],
  standardisierung_anpassung: [
    {
      pole: 'high',
      label: 'Flexibilität im System',
      rationale:
        'Deine Konsequenz schafft Verlässlichkeit; ohne Anpassungsfenster wird sie aber als Starrheit erlebt und erreicht nicht jeden Spielertyp.',
      interventionIds: ['I028'],
      framings: {
        I028: 'Öffne ein kontrolliertes Flexibilitätsfenster: eine Situation pro Woche, in der du bewusst vom Standard abweichst und beobachtest.',
      },
    },
    {
      pole: 'low',
      label: 'Verlässlicher Rahmen',
      rationale:
        'Deine Anpassungsfähigkeit erreicht viele Spielertypen; ohne wiederholbaren Rahmen kann sie aber als Beliebigkeit wirken.',
      interventionIds: ['I033'],
      framings: {
        I033: 'Verankere einen verlässlichen Standard pro Periode, damit Anpassung nicht als Unberechenbarkeit ankommt.',
      },
    },
  ],
};

/**
 * Reifedimension → adressierende Interventionen + Trainer-Rahmung.
 * Greift, wenn die Reife in dieser Dimension niedrig ist.
 */
const MATURITY_RULES: Record<MaturityKey, { interventionIds: string[]; rationale: string; framings: Record<string, string> }> = {
  selbstregulation: {
    interventionIds: ['I032', 'I011'],
    rationale: 'Wie souverän du unter Druck deine Grundlinie hältst, entscheidet über die Qualität deiner Führung in den entscheidenden Momenten.',
    framings: {
      I032: 'Trainiere deinen eigenen Emotion-zu-Handlung-Reset, bevor du ihn vom Team verlangst.',
      I011: 'Nutze das 3-Atemzüge-Muster als persönlichen Reset an der Seitenlinie.',
    },
  },
  perspektivflexibilitaet: {
    interventionIds: ['I004', 'I003'],
    rationale: 'Andere Sichtweisen zuzulassen, ohne deine Linie zu verlieren, erweitert deine Wirkung über mehr Spielertypen.',
    framings: {
      I004: 'Hole im Arbeitsbündnis-Check-in aktiv die Perspektive des Spielers ein, bevor du bewertest.',
      I003: 'Biete echte Wahloptionen an — Autonomie im Rahmen schult deine eigene Perspektivflexibilität mit.',
    },
  },
  konfliktreife: {
    interventionIds: ['I005', 'I025'],
    rationale: 'Klar zu bleiben, wenn es unangenehm wird, ist der Kern reifer Führung — Vermeidung kostet langfristig Vertrauen.',
    framings: {
      I005: 'Führe einen Fehlerkultur-Reset im Training, der Klarheit erzeugt statt Widerstand.',
      I025: 'Etabliere eine Fehlerabschluss-Routine, damit Spannung bearbeitet und nicht aufgeschoben wird.',
    },
  },
  druckreife: {
    interventionIds: ['I008', 'I011'],
    rationale: 'In Krisen- und Niederlagenphasen entscheidet die Qualität deiner Führung über die Erholungsfähigkeit des Teams.',
    framings: {
      I008: 'Nutze das Crisis-Huddle-Protokoll: Fakten, Kontrollierbares, Leader-Rollen, klare 48h-Kommunikationsregel.',
      I011: 'Verankere ein gemeinsames Reset-Muster für Drucksituationen.',
    },
  },
  verantwortungsklarheit: {
    interventionIds: ['I009', 'I007'],
    rationale: 'Klare Rollen und Status verhindern Frust und machen deine Entscheidungen nachvollziehbar.',
    framings: {
      I009: 'Führe frühzeitig Bankrollen-Gespräche: Rolle erklären, Impact-Szenario, Trainingsziel, Reviewtermin.',
      I007: 'Setze eine Leadership-Rollenmatrix auf, damit Verantwortung nicht nur am Kapitän hängt.',
    },
  },
  integrationsfaehigkeit: {
    interventionIds: ['I027', 'I004'],
    rationale: 'Widersprüche auszuhalten — Struktur und Freiheit, Forderung und Beziehung — ist die anspruchsvollste Reifedimension.',
    framings: {
      I027: 'Halte Struktur und Freiheit zusammen: Prinzipienrahmen plus bewusste Freiheitszone.',
      I004: 'Integriere im Arbeitsbündnis-Check-in die beiden Pole — deine Anforderung und das Bedürfnis des Spielers.',
    },
  },
};

// Horizont-Zuordnung: kurze Reset-/Gesprächsbausteine → 14 Tage,
// strukturelle Routinen → 30 Tage, Team-/Kultur-Workshops → 90 Tage.
function horizonFor(iv: Intervention): DevelopmentHorizon {
  if (iv.id === 'I007' || iv.id === 'I002') return '90';
  if (iv.durationMin != null && iv.durationMin >= 30) return '90';
  if (iv.durationMin != null && iv.durationMin <= 10) return '14';
  return '30';
}

const IV_BY_ID: Record<string, Intervention> = Object.fromEntries(INTERVENTIONS.map((i) => [i.id, i]));

export type MatchInput = {
  axisScores: AxisScores;
  maturityScores?: MaturityScores | null;
  moduleAverages?: Record<string, number> | null;
  /** Optional: Wichtig−Gelebt-Lücke je Modul (0..1, höher = größere Lücke). */
  moduleGaps?: Record<string, number> | null;
  /** Wie viele Bausteine maximal ins Programm (Default 6). */
  maxItems?: number;
};

/**
 * Zentrale Funktion: erzeugt das priorisierte Entwicklungsprogramm.
 */
export function matchDevelopmentProgram(input: MatchInput): DevelopmentProgram {
  const maxItems = input.maxItems ?? 6;
  const focusAreas: FocusArea[] = [];

  // 1) Achsen-Extreme → Fokusfelder (Abstand von der Mitte = Dringlichkeit)
  (Object.keys(AXIS_RULES) as AxisKey[]).forEach((axis) => {
    const v = input.axisScores[axis];
    if (v == null) return;
    const dist = Math.abs(v - 0.5); // 0..0.5
    if (dist < 0.18) return; // nur deutliche Ausprägungen adressieren
    const pole: 'high' | 'low' = v >= 0.5 ? 'high' : 'low';
    const rule = AXIS_RULES[axis].find((r) => r.pole === pole);
    if (!rule) return;
    focusAreas.push({
      key: `axis:${axis}:${pole}`,
      kind: 'axis',
      label: rule.label,
      urgency: Math.min(1, dist / 0.5),
      rationale: rule.rationale,
    });
  });

  // 2) Niedrige Führungsreife → Fokusfelder (niedriger = dringlicher)
  if (input.maturityScores) {
    (Object.keys(MATURITY_RULES) as MaturityKey[]).forEach((m) => {
      const v = input.maturityScores![m];
      if (v == null) return;
      if (v >= 0.55) return; // nur Entwicklungsbedarf adressieren
      focusAreas.push({
        key: `maturity:${m}`,
        kind: 'maturity',
        label: MATURITY_LABELS[m],
        urgency: Math.min(1, (0.55 - v) / 0.55 + 0.25),
        rationale: MATURITY_RULES[m].rationale,
      });
    });
  }

  // 3) Größte Wichtig-vs-Gelebt-Lücken (Modul) → Fokus (developmental Gold)
  if (input.moduleGaps) {
    Object.entries(input.moduleGaps).forEach(([code, gap]) => {
      if (gap == null || gap < 0.2) return;
      focusAreas.push({
        key: `module_gap:${code}`,
        kind: 'module_gap',
        label: `Wichtig-vs-Gelebt-Lücke (Modul ${code})`,
        urgency: Math.min(1, gap),
        rationale:
          'Hier ist dir etwas wichtig, das du im Alltag noch nicht in der gewünschten Qualität lebst — die größten Entwicklungssprünge liegen in dieser Lücke.',
      });
    });
  }

  // Fokusfelder nach Dringlichkeit sortieren
  focusAreas.sort((a, b) => b.urgency - a.urgency);

  // 4) Interventionen je Fokus sammeln (Reihenfolge der Fokusse beachten,
  //    Duplikate vermeiden, Evidenzstärke als Tiebreak).
  const evRank: Record<string, number> = { A: 0, 'A-': 1, 'B+': 2, B: 3 };
  const seen = new Set<string>();
  const items: ProgramItem[] = [];

  function pushIv(ivId: string, focusKey: string, focusLabel: string, framing: string) {
    if (seen.has(ivId)) return;
    const iv = IV_BY_ID[ivId];
    if (!iv) return;
    seen.add(ivId);
    const mod = KNOWLEDGE_MODULE_BY_ID[iv.moduleId];
    items.push({
      interventionId: iv.id,
      name: iv.name,
      focusKey,
      focusLabel,
      moduleId: iv.moduleId,
      moduleName: mod?.name ?? iv.moduleId,
      evidence: iv.evidence,
      durationMin: iv.durationMin,
      horizon: horizonFor(iv),
      steps: iv.steps,
      coachFraming: framing,
      contraindication: iv.contraindication,
    });
  }

  for (const fa of focusAreas) {
    if (fa.kind === 'axis') {
      const [, axis, pole] = fa.key.split(':') as [string, AxisKey, 'high' | 'low'];
      const rule = AXIS_RULES[axis].find((r) => r.pole === pole);
      if (!rule) continue;
      const sorted = [...rule.interventionIds].sort(
        (a, b) => (evRank[IV_BY_ID[a]?.evidence ?? 'B'] ?? 3) - (evRank[IV_BY_ID[b]?.evidence ?? 'B'] ?? 3),
      );
      for (const id of sorted) pushIv(id, fa.key, fa.label, rule.framings[id] ?? '');
    } else if (fa.kind === 'maturity') {
      const m = fa.key.split(':')[1] as MaturityKey;
      const rule = MATURITY_RULES[m];
      for (const id of rule.interventionIds) pushIv(id, fa.key, fa.label, rule.framings[id] ?? '');
    }
    if (items.length >= maxItems) break;
  }

  const trimmed = items.slice(0, maxItems);

  const byHorizon: Record<DevelopmentHorizon, ProgramItem[]> = { '14': [], '30': [], '90': [] };
  for (const it of trimmed) byHorizon[it.horizon].push(it);

  return {
    focusAreas: focusAreas.slice(0, 4),
    items: trimmed,
    byHorizon,
    claimNote:
      'Diese Entwicklungsbausteine sind theoriegeleitete Coaching-Hypothesen auf Basis evidenzbasierter Methodik — keine klinische Diagnostik. Sie wirken am besten in Verbindung mit eigener Reflexion und kollegialem Austausch.',
  };
}

/**
 * Kompakter Text-Block für den LLM-Prompt: die ausgewählten Bausteine
 * als strukturierte, claim-sichere Vorlage. Das LLM rahmt daraus den
 * fließenden Report-Text — ohne interne IDs oder Quellen zu zeigen.
 */
export function buildProgramPromptBlock(program: DevelopmentProgram): string {
  if (program.items.length === 0) return '';
  const focus = program.focusAreas
    .map((f, i) => `${i + 1}. ${f.label} (Dringlichkeit ${Math.round(f.urgency * 100)}%): ${f.rationale}`)
    .join('\n');

  const horizonLabels: Record<DevelopmentHorizon, string> = {
    '14': '14-Tage-Sofortbausteine',
    '30': '30-Tage-Routinen',
    '90': '90-Tage-Strukturarbeit',
  };

  const blocks = (['14', '30', '90'] as DevelopmentHorizon[])
    .filter((h) => program.byHorizon[h].length > 0)
    .map((h) => {
      const its = program.byHorizon[h]
        .map(
          (it) =>
            `  • [${it.focusLabel}] ${it.name} (Evidenz ${it.evidence}): ${it.coachFraming}\n    Schritte: ${it.steps.join(' → ')}\n    Grenze: ${it.contraindication}`,
        )
        .join('\n');
      return `### ${horizonLabels[h]}\n${its}`;
    })
    .join('\n\n');

  return `
# ENTWICKLUNGSPROGRAMM — ausgewählte evidenzbasierte Bausteine (interne Vorlage)
Diese Bausteine wurden aus dem profilbasierten Matching gewählt. Nutze sie als
inhaltliche Grundlage für den Abschnitt "entwicklungsprogramm". Übersetze sie in
ruhige, präzise Beratersprache. Zeige KEINE internen IDs, Evidenzgrade oder Quellen.
Behaupte keine Diagnose — formuliere Coaching-Hypothesen und beobachtbares Verhalten.

## Priorisierte Fokusfelder
${focus}

## Bausteine nach Horizont
${blocks}
`.trim();
}
