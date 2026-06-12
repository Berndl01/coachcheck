/**
 * HUMATRIX PROGRESS / RE-CHECK
 * ============================
 * Vergleicht zwei Standortbestimmungen desselben Trainers und macht
 * Entwicklung sichtbar — der Wiederkauf- und Mehrwert-Hebel.
 *
 * Achsen sind Stil-Positionen (keine "besser/schlechter"-Wertung) →
 * neutral als Verschiebung dargestellt.
 * Führungsreife ist gerichtet (höher = souveräner) → als Fortschritt
 * bzw. Fokusfeld dargestellt.
 *
 * Claim-sicher: Bewegungen sind Coaching-Hypothesen, kein Beweis.
 */

import type { AxisKey, MaturityKey, AxisScores, MaturityScores } from '@/lib/scoring';
import { MATURITY_KEYS, MATURITY_LABELS } from '@/lib/scoring';

const AXIS_LABELS: Record<AxisKey, { low: string; high: string }> = {
  struktur_intuition: { low: 'Intuitiv', high: 'Strukturiert' },
  autoritaet_beteiligung: { low: 'Beteiligend', high: 'Autoritär' },
  leistung_beziehung: { low: 'Beziehung', high: 'Leistung' },
  stabilisierung_aktivierung: { low: 'Stabilisierend', high: 'Aktivierend' },
  reflexion_direktheit: { low: 'Direkt', high: 'Reflektiert' },
  standardisierung_anpassung: { low: 'Anpassend', high: 'Standardisierend' },
};
const AXIS_ORDER = Object.keys(AXIS_LABELS) as AxisKey[];

const MEANINGFUL = 0.05; // 5 Prozentpunkte

export type Delta = {
  key: string;
  label: string;
  from: number; // 0..1
  to: number; // 0..1
  delta: number; // to - from
};

export type ProgressComparison = {
  daysBetween: number;
  axisDeltas: Delta[];
  maturityDeltas: Delta[];
  hasMaturity: boolean;
  /** Prägnante Überschrift für die größte Bewegung. */
  headline: string;
  /** 2-3 Sätze, claim-sicher. */
  summary: string;
  /** Top-Verbesserung (für Hervorhebung), falls vorhanden. */
  topGain: Delta | null;
  /** Wichtigstes Fokusfeld (größter Rückgang oder niedrigster Wert). */
  watch: Delta | null;
};

function pct(v: number): number {
  return Math.round(v * 100);
}

type Snapshot = {
  axisScores: AxisScores | Record<string, number>;
  maturityScores?: MaturityScores | Record<string, number> | null;
  date: string | Date;
};

export function buildProgressComparison(current: Snapshot, previous: Snapshot): ProgressComparison {
  const dCur = new Date(current.date);
  const dPrev = new Date(previous.date);
  const daysBetween = Math.max(0, Math.round((dCur.getTime() - dPrev.getTime()) / 86_400_000));

  // Achsen-Verschiebungen (neutral)
  const axisDeltas: Delta[] = AXIS_ORDER.map((axis) => {
    const from = (previous.axisScores as any)?.[axis] ?? 0.5;
    const to = (current.axisScores as any)?.[axis] ?? 0.5;
    return { key: axis, label: `${AXIS_LABELS[axis].low}–${AXIS_LABELS[axis].high}`, from, to, delta: to - from };
  });

  // Reife-Deltas (gerichtet)
  const hasMaturity = !!previous.maturityScores && !!current.maturityScores;
  const maturityDeltas: Delta[] = hasMaturity
    ? MATURITY_KEYS.map((k) => {
        const from = (previous.maturityScores as any)?.[k] ?? 0.5;
        const to = (current.maturityScores as any)?.[k] ?? 0.5;
        return { key: k, label: MATURITY_LABELS[k], from, to, delta: to - from };
      })
    : [];

  // Top-Bewegungen
  const gains = maturityDeltas.filter((d) => d.delta >= MEANINGFUL).sort((a, b) => b.delta - a.delta);
  const drops = maturityDeltas.filter((d) => d.delta <= -MEANINGFUL).sort((a, b) => a.delta - b.delta);
  const topGain = gains[0] ?? null;
  // Fokusfeld: größter Rückgang, sonst die niedrigste Reifedimension aktuell
  const lowestNow = [...maturityDeltas].sort((a, b) => a.to - b.to)[0] ?? null;
  const watch = drops[0] ?? lowestNow;

  // Headline + Summary
  let headline: string;
  let summary: string;

  if (!hasMaturity) {
    // Achsen-only Fallback (älterer Vorlauf ohne Reife-Snapshot)
    const moved = [...axisDeltas].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
    headline = Math.abs(moved.delta) >= MEANINGFUL
      ? `Dein Stil hat sich bewegt: ${moved.label} um ${moved.delta >= 0 ? '+' : ''}${pct(moved.delta)} Punkte.`
      : 'Dein Stilprofil ist über die Zeit stabil geblieben.';
    summary = `Seit der letzten Standortbestimmung (vor ${daysBetween} Tagen) zeigt sich vor allem auf der Achse ${moved.label} eine Verschiebung. Stilverschiebungen sind weder gut noch schlecht — sie zeigen, woran du gerade arbeitest. Für einen Reife-Vergleich wiederhole den vollen Selbsttest.`;
    return { daysBetween, axisDeltas, maturityDeltas, hasMaturity, headline, summary, topGain: null, watch: null };
  }

  if (topGain) {
    headline = `Deine größte Entwicklung: ${topGain.label} ${pct(topGain.from)} % → ${pct(topGain.to)} %.`;
  } else if (drops.length > 0) {
    headline = `Ein Bereich verlangt gerade mehr Aufmerksamkeit: ${drops[0].label}.`;
  } else {
    headline = 'Deine Führungsreife ist stabil geblieben — eine solide Basis.';
  }

  const parts: string[] = [];
  parts.push(`Seit deiner letzten Standortbestimmung sind ${daysBetween} Tage vergangen.`);
  if (gains.length > 0) {
    const names = gains.slice(0, 2).map((d) => `${d.label} (+${pct(d.delta)})`).join(' und ');
    parts.push(`Gewachsen ist vor allem deine ${names}.`);
  }
  if (drops.length > 0) {
    parts.push(`Etwas zurückgegangen ist deine ${drops[0].label} — ein sinnvolles Fokusfeld für die nächste Phase.`);
  } else if (gains.length === 0) {
    parts.push(`Die Werte sind weitgehend gleich geblieben — Stabilität ist in fordernden Phasen selbst ein Erfolg.`);
  }
  parts.push('Bewegungen sind Coaching-Hypothesen, kein Beweis — sie zeigen Richtung, nicht Endstand.');
  summary = parts.join(' ');

  return { daysBetween, axisDeltas, maturityDeltas, hasMaturity, headline, summary, topGain, watch };
}
