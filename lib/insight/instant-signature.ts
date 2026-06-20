/**
 * HUMATRIX INSTANT SIGNATURE
 * ==========================
 * Erzeugt SOFORT (deterministisch, ohne KI, ohne Wartezeit) eine
 * personalisierte Signatur-Lesung aus den 6 Kernachsen eines Trainers.
 *
 * Ziel: der WOW-Moment direkt nach dem Test. Statt statischer
 * Archetyp-Texte (für jeden gleich) liest dieser Generator die KONKRETEN
 * Werte dieses Trainers — inkl. Prozenten, Spannungen und Kippmuster —
 * und formuliert sie als präzise, individuelle Aussage.
 *
 * Claim-sicher: Coaching-Hypothesen, keine Diagnose. Keine "Schwächen".
 */

import type { AxisKey, AxisScores } from '@/lib/scoring';

const AXIS_POLES: Record<AxisKey, { low: string; high: string; lowAdj: string; highAdj: string }> = {
  struktur_intuition: { low: 'Intuition', high: 'Struktur', lowAdj: 'intuitiv', highAdj: 'strukturiert' },
  autoritaet_beteiligung: { low: 'Beteiligung', high: 'Autorität', lowAdj: 'beteiligend', highAdj: 'führungsstark' },
  leistung_beziehung: { low: 'Beziehung', high: 'Leistung', lowAdj: 'beziehungsorientiert', highAdj: 'leistungsorientiert' },
  stabilisierung_aktivierung: { low: 'Stabilisierung', high: 'Aktivierung', lowAdj: 'stabilisierend', highAdj: 'aktivierend' },
  reflexion_direktheit: { low: 'Direktheit', high: 'Reflexion', lowAdj: 'direkt', highAdj: 'reflektiert' },
  standardisierung_anpassung: { low: 'Anpassung', high: 'Standardisierung', lowAdj: 'anpassend', highAdj: 'konsequent' },
};

const AXIS_ORDER: AxisKey[] = [
  'struktur_intuition',
  'autoritaet_beteiligung',
  'leistung_beziehung',
  'stabilisierung_aktivierung',
  'reflexion_direktheit',
  'standardisierung_anpassung',
];

type Pole = 'high' | 'low';

function poleOf(v: number): Pole {
  return v >= 0.5 ? 'high' : 'low';
}
function intensity(v: number): number {
  return Math.abs(v - 0.5); // 0..0.5
}
function adj(axis: AxisKey, v: number): string {
  return poleOf(v) === 'high' ? AXIS_POLES[axis].highAdj : AXIS_POLES[axis].lowAdj;
}
/**
 * Attributive (deklinierte) Form für „deine … Ausprägung" — im Deutschen muss das
 * Adjektiv vor dem Substantiv eine Endung tragen (Nominativ feminin nach Possessiv:
 * „deine strukturierte Ausprägung", nicht „deine strukturiert Ausprägung").
 * Alle AXIS_POLES-Adjektive enden auf einen Konsonanten → korrekte Endung ist „-e".
 * (Wer hier neue Adjektive ergänzt, die auf -e/-el/-er enden, muss diese Regel anpassen.)
 */
function adjAttributiv(axis: AxisKey, v: number): string {
  return `${adj(axis, v)}e`;
}
function pct(v: number): number {
  return Math.round(v * 100);
}

// Kippmuster je Achse+Pol (was unter Druck aus der Stärke wird).
const SHADOW: Record<string, string> = {
  'struktur_intuition:high': 'aus Struktur wird unter Druck leicht Kontrolle',
  'struktur_intuition:low': 'aus Gespür kann unter Druck Unschärfe werden',
  'autoritaet_beteiligung:high': 'aus klarer Führung wird unter Druck schnell Verengung',
  'autoritaet_beteiligung:low': 'aus Beteiligung kann unter Druck Richtungslosigkeit werden',
  'leistung_beziehung:high': 'aus Anspruch wird unter Druck spürbarer Druck',
  'leistung_beziehung:low': 'aus Nähe kann unter Druck Konfliktvermeidung werden',
  'stabilisierung_aktivierung:high': 'aus Energie wird unter Druck Daueraktivierung',
  'stabilisierung_aktivierung:low': 'aus Ruhe kann unter Druck Distanz werden',
  'reflexion_direktheit:high': 'aus Reflexion wird unter Druck Zögern',
  'reflexion_direktheit:low': 'aus Direktheit wird unter Druck Härte',
  'standardisierung_anpassung:high': 'aus Konsequenz wird unter Druck Starrheit',
  'standardisierung_anpassung:low': 'aus Flexibilität kann unter Druck Beliebigkeit werden',
};

// Konkreter Sofort-Hebel je Achse+Pol (eine handlungsnahe Empfehlung).
const LEVER: Record<string, string> = {
  'struktur_intuition:high': 'Gib innerhalb deiner Struktur bewusst eine Freiheitszone frei — Orientierung erweitert den Handlungsraum, Kontrolle verengt ihn.',
  'struktur_intuition:low': 'Setze pro Woche einen klaren Orientierungsanker, damit dein Gespür für die Spieler greifbar wird.',
  'autoritaet_beteiligung:high': 'Biete bei klaren Standards zwei Umsetzungswege an und lass die Spieler wählen — Verantwortung im Rahmen.',
  'autoritaet_beteiligung:low': 'Triff in unklaren Phasen sichtbare Richtungsentscheidungen — Beteiligung ersetzt keine Entscheidung.',
  'leistung_beziehung:high': 'Baue Beziehung bewusst über gemeinsame Kompetenzarbeit auf — fordern und verbinden zugleich.',
  'leistung_beziehung:low': 'Übe einen klaren Fehlerkultur-Reset: Lernsignal benennen, Mutaktion markieren, klare Korrektur — klar bleiben statt schönreden.',
  'stabilisierung_aktivierung:high': 'Mache Erholung explizit zur Leistung — definiere bewusste Pausenfenster im Wochenrhythmus.',
  'stabilisierung_aktivierung:low': 'Setze pro Training eine sichtbare aktivierende Aktion und verstärke sie positiv.',
  'reflexion_direktheit:high': 'Trainiere ein Emotion-zu-Handlung-Muster: Trigger benennen, kurze nächste Aktion, Analyse danach.',
  'reflexion_direktheit:low': 'Kombiniere deine Direktheit mit bewusster Beziehungsarbeit, damit Klarheit nicht als Härte ankommt.',
  'standardisierung_anpassung:high': 'Öffne ein kontrolliertes Flexibilitätsfenster — eine Situation pro Woche, in der du bewusst abweichst und beobachtest.',
  'standardisierung_anpassung:low': 'Verankere einen verlässlichen Standard pro Periode, damit Anpassung nicht als Unberechenbarkeit wirkt.',
};

// Bekannte Spannungs-Templates (zwei gleichzeitig starke Ausprägungen).
type TensionRule = {
  a: { axis: AxisKey; pole: Pole };
  b: { axis: AxisKey; pole: Pole };
  text: string;
};
const TENSIONS: TensionRule[] = [
  {
    a: { axis: 'struktur_intuition', pole: 'high' },
    b: { axis: 'standardisierung_anpassung', pole: 'low' },
    text: 'Du denkst in klaren Strukturen, willst sie aber im Einzelfall flexibel handhaben — Ordnung mit Ausnahmen. Diese Kombination wirkt souverän, solange die Ausnahmen für die Spieler nachvollziehbar bleiben.',
  },
  {
    a: { axis: 'autoritaet_beteiligung', pole: 'high' },
    b: { axis: 'leistung_beziehung', pole: 'low' },
    text: 'Du führst klar und beziehungsorientiert zugleich — Autorität auf Beziehungsbasis. Stark, solange deine Klarheit nicht als Widerspruch zu deiner Wärme erlebt wird.',
  },
  {
    a: { axis: 'leistung_beziehung', pole: 'high' },
    b: { axis: 'reflexion_direktheit', pole: 'low' },
    text: 'Hoher Anspruch trifft auf große Direktheit — du forderst klar und unmittelbar. Das treibt Entwicklung, kann aber unter Druck als zu hart ankommen.',
  },
  {
    a: { axis: 'reflexion_direktheit', pole: 'high' },
    b: { axis: 'autoritaet_beteiligung', pole: 'high' },
    text: 'Du reflektierst tief und führst zugleich klar — eine seltene, wirksame Verbindung. Die Spannung liegt im Tempo: zu viel Abwägen kann deine Entschlusskraft verdecken.',
  },
  {
    a: { axis: 'stabilisierung_aktivierung', pole: 'high' },
    b: { axis: 'leistung_beziehung', pole: 'high' },
    text: 'Du aktivierst stark und setzt hohe Standards — ein Energiebündel mit Anspruch. Achte darauf, dass die Daueraktivierung dem Team Erholungsfenster lässt.',
  },
  {
    a: { axis: 'struktur_intuition', pole: 'high' },
    b: { axis: 'autoritaet_beteiligung', pole: 'high' },
    text: 'Struktur und klare Führung verstärken sich bei dir — du gibst maximale Orientierung. Der wache Punkt: Unter Unsicherheit kann aus Orientierung Kontrolle werden.',
  },
];

export type InstantSignature = {
  /** Die 2-3 prägendsten Pole als Schlagworte. */
  headline: string[];
  /** Präziser Fließtext, der die konkreten Werte liest. */
  reading: string;
  /** Die schärfste Spannung im Profil (oder der Wirkungsschwerpunkt). */
  tension: string;
  /** Wie sich der Stil unter Druck verschiebt. */
  underPressure: string;
  /** Ein konkreter Sofort-Hebel. */
  lever: string;
  /** Die zwei prägendsten Achsen mit Wert (für UI-Hervorhebung). */
  defining: Array<{ axis: AxisKey; label: string; value: number; adj: string }>;
};

export function buildInstantSignature(scores: AxisScores): InstantSignature {
  const ranked = AXIS_ORDER
    .map((axis) => ({ axis, v: scores[axis] ?? 0.5, dev: intensity(scores[axis] ?? 0.5) }))
    .sort((x, y) => y.dev - x.dev);

  const top = ranked.slice(0, 3).filter((r) => r.dev >= 0.08);
  const useTop = top.length > 0 ? top : ranked.slice(0, 2);

  // Headline-Schlagworte
  const headline = useTop.slice(0, 3).map((r) =>
    poleOf(r.v) === 'high' ? AXIS_POLES[r.axis].high : AXIS_POLES[r.axis].low,
  );

  // Lese-Text aus den zwei stärksten Achsen
  const a = useTop[0];
  const b = useTop[1] ?? useTop[0];
  const readingParts: string[] = [];
  readingParts.push(
    `Mit ${pct(a.v)} % ${poleOf(a.v) === 'high' ? 'auf der Seite der' : 'in Richtung'} ${(poleOf(a.v) === 'high' ? AXIS_POLES[a.axis].high : AXIS_POLES[a.axis].low)} führst du erkennbar ${adj(a.axis, a.v)}.`,
  );
  if (b.axis !== a.axis) {
    readingParts.push(
      `Verstärkt wird das durch deine ${adjAttributiv(b.axis, b.v)} Ausprägung (${pct(b.v)} %) — diese Kombination ist die Grundfarbe deiner Führung.`,
    );
  }
  // Eine ausgeglichene Achse als Nuance erwähnen (falls vorhanden)
  const balanced = ranked.find((r) => r.dev < 0.07);
  if (balanced) {
    readingParts.push(
      `Auf der Achse ${AXIS_POLES[balanced.axis].low}–${AXIS_POLES[balanced.axis].high} bleibst du bewusst beweglich (${pct(balanced.v)} %) — hier hältst du dir beide Optionen offen.`,
    );
  }

  // Spannung suchen
  let tension = '';
  for (const t of TENSIONS) {
    const va = scores[t.a.axis] ?? 0.5;
    const vb = scores[t.b.axis] ?? 0.5;
    if (poleOf(va) === t.a.pole && poleOf(vb) === t.b.pole && intensity(va) >= 0.12 && intensity(vb) >= 0.12) {
      tension = t.text;
      break;
    }
  }
  if (!tension) {
    tension = `Dein Profil hat einen klaren Wirkungsschwerpunkt auf der ${poleOf(a.v) === 'high' ? AXIS_POLES[a.axis].high : AXIS_POLES[a.axis].low}-Seite. Je deutlicher eine Ausprägung, desto wichtiger wird ihr bewusster Gegenpol.`;
  }

  const key = `${a.axis}:${poleOf(a.v)}`;
  const underPressure = `Unter Druck zeigt sich dein Muster am deutlichsten: ${SHADOW[key] ?? 'deine stärkste Ausprägung verstärkt sich'}. Genau hier liegt dein wichtigster Entwicklungspunkt.`;
  const lever = LEVER[key] ?? 'Mache deine stärkste Ausprägung bewusst anschlussfähig für unterschiedliche Spielertypen.';

  return {
    headline,
    reading: readingParts.join(' '),
    tension,
    underPressure,
    lever,
    defining: useTop.slice(0, 2).map((r) => ({
      axis: r.axis,
      label: poleOf(r.v) === 'high' ? AXIS_POLES[r.axis].high : AXIS_POLES[r.axis].low,
      value: r.v,
      adj: adj(r.axis, r.v),
    })),
  };
}
