/**
 * Humatrix Coach Assessment — Scoring Engine
 *
 * Takes raw answers and computes:
 * 1. Normalized axis scores (0.0–1.0 per 6 Kernachsen)
 * 2. Primary archetype (closest Euclidean match)
 * 3. Secondary archetype (second-closest)
 * 4. Functional signature
 * 5. Pressure profile (State-Items in Modul E)
 */

export type AxisKey =
  | 'struktur_intuition'
  | 'autoritaet_beteiligung'
  | 'leistung_beziehung'
  | 'stabilisierung_aktivierung'
  | 'reflexion_direktheit'
  | 'standardisierung_anpassung';

export type AxisScores = Record<AxisKey, number>;

export const AXIS_KEYS: AxisKey[] = [
  'struktur_intuition',
  'autoritaet_beteiligung',
  'leistung_beziehung',
  'stabilisierung_aktivierung',
  'reflexion_direktheit',
  'standardisierung_anpassung',
];

export type RawAnswer = {
  item_id: number;
  format: string;
  axis_weights: Partial<AxisScores>;
  reverse_scored: boolean;
  // exactly one of these is set depending on format:
  value_numeric?: number | null;
  value_choice?: string | null;
  value_position?: number | null;
  value_jsonb?: unknown;
  // For choice-based items, we also need the options for weight lookup
  options?: Array<{ key: string; text?: string; weights: Partial<AxisScores> }> | null;
};

export type Archetype = {
  id: number;
  code: string;
  name_de: string;
  axis_profile: Record<string, number>;
};

/**
 * Normalize a Likert 1–5 value to −1..+1 scale.
 * 1 → −1, 3 → 0, 5 → +1
 */
function likertToSigned(v: number, reverse: boolean): number {
  const normalized = (v - 3) / 2; // −1..+1
  return reverse ? -normalized : normalized;
}

/**
 * Normalize spannungsfeld (0..1) to signed (−1..+1).
 */
function positionToSigned(v: number): number {
  return v * 2 - 1;
}

/**
 * Normalize state values same as likert.
 */
function stateToSigned(v: number, reverse: boolean): number {
  return likertToSigned(v, reverse);
}

/**
 * Core: accumulate axis contributions per answer.
 * Returns raw axis sums (unbounded).
 */
export function computeRawAxisSums(answers: RawAnswer[]): {
  sums: AxisScores;
  counts: Record<AxisKey, number>;
} {
  const sums: AxisScores = {
    struktur_intuition: 0,
    autoritaet_beteiligung: 0,
    leistung_beziehung: 0,
    stabilisierung_aktivierung: 0,
    reflexion_direktheit: 0,
    standardisierung_anpassung: 0,
  };
  const counts: Record<AxisKey, number> = {
    struktur_intuition: 0,
    autoritaet_beteiligung: 0,
    leistung_beziehung: 0,
    stabilisierung_aktivierung: 0,
    reflexion_direktheit: 0,
    standardisierung_anpassung: 0,
  };

  for (const a of answers) {
    let signedResponse: number | null = null;
    let weightSource: Partial<AxisScores> = a.axis_weights;

    switch (a.format) {
      case 'likert_5':
      case 'gap_wichtig':
      case 'gap_gelebt':
        if (a.value_numeric != null) {
          signedResponse = likertToSigned(a.value_numeric, a.reverse_scored);
        }
        break;
      case 'state':
        if (a.value_numeric != null) {
          signedResponse = stateToSigned(a.value_numeric, a.reverse_scored);
        }
        break;
      case 'spannungsfeld':
        if (a.value_position != null) {
          signedResponse = positionToSigned(a.value_position);
        }
        break;
      case 'forced_choice':
      case 'szenario':
      case 'dilemma':
      case 'ranking':
        if (a.value_choice && a.options) {
          const picked = a.options.find((o) => o.key === a.value_choice);
          if (picked) {
            weightSource = picked.weights;
            signedResponse = 1; // full contribution of chosen option
          }
        }
        break;
    }

    if (signedResponse == null) continue;

    for (const key of AXIS_KEYS) {
      const w = weightSource[key];
      if (w === undefined || w === null) continue;
      sums[key] += signedResponse * w;
      counts[key] += Math.abs(w);
    }
  }

  return { sums, counts };
}

/**
 * Normalize raw sums to 0..1 per axis, using weighted averages.
 * Items with stronger weights count more.
 */
export function computeAxisScores(answers: RawAnswer[]): AxisScores {
  const { sums, counts } = computeRawAxisSums(answers);
  const result: AxisScores = {} as AxisScores;
  for (const key of AXIS_KEYS) {
    if (counts[key] === 0) {
      result[key] = 0.5; // no signal → neutral
    } else {
      const avg = sums[key] / counts[key]; // in −1..+1
      result[key] = Math.max(0, Math.min(1, (avg + 1) / 2)); // to 0..1
    }
  }
  return result;
}

/**
 * Euclidean distance between two axis profiles.
 */
export function axisDistance(
  scores: AxisScores,
  profile: Record<string, number>
): number {
  let sumSq = 0;
  for (const key of AXIS_KEYS) {
    const diff = scores[key] - (profile[key] ?? 0.5);
    sumSq += diff * diff;
  }
  return Math.sqrt(sumSq);
}

/**
 * Finds the closest archetypes to the user's axis profile.
 * Returns [primary, secondary].
 */
export function determineArchetypes(
  scores: AxisScores,
  archetypes: Archetype[]
): { primary: Archetype; secondary: Archetype; distances: Array<{ archetype: Archetype; distance: number }> } {
  const ranked = archetypes
    .map((a) => ({ archetype: a, distance: axisDistance(scores, a.axis_profile) }))
    .sort((x, y) => x.distance - y.distance);

  return {
    primary: ranked[0].archetype,
    secondary: ranked[1].archetype,
    distances: ranked,
  };
}

/**
 * Builds the "Functional Signature" — human-readable axis interpretation.
 */
export function buildSignature(scores: AxisScores): {
  axis: AxisKey;
  value: number;
  label: string;
  intensity: 'hoch' | 'mittel' | 'niedrig';
}[] {
  const AXIS_LABELS: Record<AxisKey, { low: string; high: string }> = {
    struktur_intuition: { low: 'Intuitiv', high: 'Strukturiert' },
    autoritaet_beteiligung: { low: 'Beteiligend', high: 'Autoritär' },
    leistung_beziehung: { low: 'Beziehungsorientiert', high: 'Leistungsorientiert' },
    stabilisierung_aktivierung: { low: 'Stabilisierend', high: 'Aktivierend' },
    reflexion_direktheit: { low: 'Direkt', high: 'Reflektiert' },
    standardisierung_anpassung: { low: 'Anpassend', high: 'Standardisierend' },
  };

  return AXIS_KEYS.map((axis) => {
    const value = scores[axis];
    const label = value >= 0.5 ? AXIS_LABELS[axis].high : AXIS_LABELS[axis].low;
    const strength = Math.abs(value - 0.5);
    let intensity: 'hoch' | 'mittel' | 'niedrig' = 'mittel';
    if (strength > 0.25) intensity = 'hoch';
    else if (strength < 0.1) intensity = 'niedrig';
    return { axis, value, label, intensity };
  });
}

// ============== 360° DISCREPANCY ANALYSIS ==============

export type FremdbildAggregateRow = {
  item_id: number;
  format: string;
  avg_numeric: number | null;
  avg_position: number | null;
  top_choice: string | null;
  response_count: number;
};

export type FremdbildScores = {
  axisScores: AxisScores;
  responseCount: number;
};

/**
 * Computes axis scores from aggregated fremdbild responses.
 * Treats avg_numeric / avg_position the same way as own answers.
 */
export function computeFremdbildAxisScores(
  aggregates: FremdbildAggregateRow[],
  itemsLookup: Map<number, { format: string; axis_weights: Partial<AxisScores>; reverse_scored: boolean; options: Array<{ key: string; text?: string; weights: Partial<AxisScores> }> | null }>
): FremdbildScores | null {
  if (aggregates.length === 0) return null;

  const responseCount = Math.max(...aggregates.map(a => Number(a.response_count) || 0));
  if (responseCount < 3) return null; // anonymity threshold

  const mapped = aggregates.map((row): RawAnswer | null => {
    const item = itemsLookup.get(row.item_id);
    if (!item) return null;
    return {
      item_id: row.item_id,
      format: row.format,
      axis_weights: item.axis_weights,
      reverse_scored: item.reverse_scored,
      value_numeric: row.avg_numeric != null ? Number(row.avg_numeric) : undefined,
      value_position: row.avg_position != null ? Number(row.avg_position) : undefined,
      value_choice: row.top_choice ?? undefined,
      options: item.options ?? undefined,
    };
  });
  const rawAnswers: RawAnswer[] = mapped.filter((x): x is RawAnswer => x !== null);

  return {
    axisScores: computeAxisScores(rawAnswers),
    responseCount,
  };
}

export type AxisDiscrepancy = {
  axis: AxisKey;
  selfValue: number;
  fremdValue: number;
  delta: number;          // fremd - self, range -1..+1
  magnitude: 'gering' | 'moderat' | 'hoch';
  direction: 'höher' | 'niedriger' | 'übereinstimmend';
};

/**
 * Computes per-axis discrepancy between self- and fremdbild.
 * Magnitude thresholds: <0.10 gering, <0.20 moderat, ≥0.20 hoch
 */
export function computeAxisDiscrepancies(
  self: AxisScores,
  fremd: AxisScores
): AxisDiscrepancy[] {
  return AXIS_KEYS.map((axis) => {
    const selfValue = self[axis];
    const fremdValue = fremd[axis];
    const delta = fremdValue - selfValue;
    const abs = Math.abs(delta);
    let magnitude: 'gering' | 'moderat' | 'hoch' = 'gering';
    if (abs >= 0.20) magnitude = 'hoch';
    else if (abs >= 0.10) magnitude = 'moderat';
    let direction: 'höher' | 'niedriger' | 'übereinstimmend' = 'übereinstimmend';
    if (abs >= 0.05) direction = delta > 0 ? 'höher' : 'niedriger';
    return { axis, selfValue, fremdValue, delta, magnitude, direction };
  });
}

// ============== FÜHRUNGSREIFE (zweite Schicht) ==============

export type MaturityKey =
  | 'selbstregulation'        // Halten unter Druck (Modul E + autoritaet_beteiligung-Stabilität)
  | 'perspektivflexibilitaet' // Andere Sichten zulassen (Modul B + standardisierung_anpassung)
  | 'konfliktreife'           // Klar bei Spannung (Modul D + Modul G)
  | 'druckreife'              // Qualität unter Belastung (Modul E)
  | 'verantwortungsklarheit'  // Modul C + autoritaet_beteiligung
  | 'integrationsfaehigkeit'; // Widersprüche halten (Modul A + reflexion_direktheit)

export type MaturityScores = Record<MaturityKey, number>;

export const MATURITY_KEYS: MaturityKey[] = [
  'selbstregulation',
  'perspektivflexibilitaet',
  'konfliktreife',
  'druckreife',
  'verantwortungsklarheit',
  'integrationsfaehigkeit',
];

export const MATURITY_LABELS: Record<MaturityKey, string> = {
  selbstregulation: 'Selbstregulation',
  perspektivflexibilitaet: 'Perspektivflexibilität',
  konfliktreife: 'Konfliktreife',
  druckreife: 'Druckreife',
  verantwortungsklarheit: 'Verantwortungsklarheit',
  integrationsfaehigkeit: 'Integrationsfähigkeit',
};

/**
 * Berechnet Führungsreife aus Modul-Trends + Achsen-Werten.
 * Reife ist NICHT der Stil — sondern wie souverän der Trainer
 * mit den Anforderungen seines Stils umgeht.
 */
export function computeMaturityScores(
  axisScores: AxisScores,
  moduleAverages: Record<string, number>
): MaturityScores {
  const a = axisScores;
  const m = (code: string) => moduleAverages[code] ?? 0; // -1..+1

  // Heuristik: kombiniert Modul-Trends mit Polaritäts-Indikatoren der Achsen
  // - Reife = nicht-extrem + Modul-Konsistenz
  // Werte kommen normiert auf 0..1 raus
  const norm = (v: number) => Math.max(0, Math.min(1, (v + 1) / 2));
  const balance = (axis: number) => 1 - Math.abs(axis - 0.5) * 2; // 0..1, höchster Wert wenn axis=0.5

  return {
    // Selbstregulation: stabilisierend statt aktivierend unter Druck + Modul E hoch
    selbstregulation: norm(0.5 * m('E') + 0.5 * (1 - Math.abs(a.stabilisierung_aktivierung - 0.4) * 2)),
    // Perspektivflexibilität: Modul B + Anpassungsfähigkeit (nicht zu standardisierend)
    perspektivflexibilitaet: norm(0.5 * m('B') + 0.5 * (1 - a.standardisierung_anpassung)),
    // Konfliktreife: Modul D + Modul G + Beziehungs-Balance
    konfliktreife: norm(0.4 * m('D') + 0.4 * m('G') + 0.2 * balance(a.leistung_beziehung)),
    // Druckreife: Modul E + Reflexionsanteil
    druckreife: norm(0.6 * m('E') + 0.4 * a.reflexion_direktheit),
    // Verantwortungsklarheit: Modul C + Strukturanteil
    verantwortungsklarheit: norm(0.5 * m('C') + 0.5 * a.struktur_intuition),
    // Integrationsfähigkeit: Modul A + Reflexion + Balance
    integrationsfaehigkeit: norm(0.4 * m('A') + 0.3 * a.reflexion_direktheit + 0.3 * balance(a.autoritaet_beteiligung)),
  };
}

// ============== STREUUNG / POLARISIERUNG IM FREMDBILD ==============

export type DispersionInfo = {
  mean: number;
  stddev: number;
  polarized: boolean;
};

/**
 * Misst, wie einig sich Fremdeinschätzer waren.
 * Hohe Standardabweichung bei einer Frage = polarisierte Wahrnehmung.
 */
export function computeDispersion(values: number[]): DispersionInfo {
  if (values.length === 0) return { mean: 0, stddev: 0, polarized: false };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const stddev = Math.sqrt(variance);
  // Bei Likert 1-5 ist stddev > 1.2 hochpolarisiert
  return { mean, stddev, polarized: stddev > 1.2 };
}
