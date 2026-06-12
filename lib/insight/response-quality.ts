/**
 * Antwortqualität (#6) — rein serverseitig aus vorhandenen Antwortdaten +
 * Assessment-Dauer berechnet. KEINE Frontend-Änderung nötig.
 *
 * Ziel: Wer 80 Fragen in 2 Minuten "durchklickt" oder alles gleich beantwortet,
 * bekommt KEINEN scheinbar präzisen Premium-Report. Der Report hedged dann
 * claim-sicher ("nur eingeschränkt interpretierbar").
 */

export type QualityAnswer = {
  /** Likert 1..5, falls vorhanden (nur diese fließen in Straightlining/Mitte ein). */
  likert: number | null;
  reverse: boolean;
};

export type ResponseQualityFlags = {
  too_fast: boolean;
  straightlining: boolean;
  excessive_middle_answers: boolean;
  inconsistent_reverse_items: boolean;
  low_completion_quality: boolean;
};

export type DataQuality = 'gut' | 'eingeschraenkt' | 'nicht_interpretierbar';
export type Confidence = 'hoch' | 'mittel' | 'niedrig';

export type ResponseQuality = {
  flags: ResponseQualityFlags;
  dataQuality: DataQuality;
  confidence: Confidence;
  answeredItems: number;
  durationSec: number | null;
  secondsPerItem: number | null;
  note: string;
};

const DATA_QUALITY_NOTE: Record<DataQuality, string> = {
  gut: 'Die Antwortqualität ist gut — das Profil ist belastbar interpretierbar.',
  eingeschraenkt: 'Die Antwortqualität ist eingeschränkt. Einzelne Aussagen sollten im Gespräch geprüft und nicht als endgültig gelesen werden.',
  nicht_interpretierbar: 'Das Antwortmuster deutet auf sehr schnelles oder gleichförmiges Ausfüllen hin. Die Ergebnisse sind nur sehr eingeschränkt interpretierbar — eine Wiederholung in Ruhe wird empfohlen.',
};

export function computeResponseQuality(
  answers: QualityAnswer[],
  durationMs: number | null,
): ResponseQuality {
  const answeredItems = answers.length;
  const likertVals = answers.map((a) => a.likert).filter((v): v is number => v != null);

  // Straightlining: dominanter Wert > 90 % bei genügend Items.
  let straightlining = false;
  if (likertVals.length >= 10) {
    const counts = new Map<number, number>();
    likertVals.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
    const maxShare = Math.max(...counts.values()) / likertVals.length;
    straightlining = maxShare > 0.9;
  }

  // Übermäßig viele Mitte-Antworten (3 auf 1..5).
  let excessive_middle_answers = false;
  if (likertVals.length >= 10) {
    const middle = likertVals.filter((v) => v === 3).length / likertVals.length;
    excessive_middle_answers = middle > 0.6;
  }

  // Reverse-Inkonsistenz (Proxy): identische Rohantworten trotz reverse-Items
  // → Items wurden vermutlich nicht gelesen.
  const hasReverse = answers.some((a) => a.reverse && a.likert != null);
  const inconsistent_reverse_items = straightlining && hasReverse;

  // Tempo.
  const durationSec = durationMs != null && durationMs > 0 ? Math.round(durationMs / 1000) : null;
  const secondsPerItem = durationSec != null && answeredItems > 0 ? durationSec / answeredItems : null;
  const too_fast = secondsPerItem != null && answeredItems >= 10 && secondsPerItem < 2;

  const low_completion_quality = too_fast || straightlining;

  const flags: ResponseQualityFlags = {
    too_fast,
    straightlining,
    excessive_middle_answers,
    inconsistent_reverse_items,
    low_completion_quality,
  };

  // Datenqualität ableiten.
  let dataQuality: DataQuality = 'gut';
  if (too_fast && straightlining) dataQuality = 'nicht_interpretierbar';
  else if (too_fast || straightlining || excessive_middle_answers) dataQuality = 'eingeschraenkt';

  const confidence: Confidence =
    dataQuality === 'gut' ? 'hoch' : dataQuality === 'eingeschraenkt' ? 'mittel' : 'niedrig';

  return {
    flags,
    dataQuality,
    confidence,
    answeredItems,
    durationSec,
    secondsPerItem: secondsPerItem != null ? Math.round(secondsPerItem * 10) / 10 : null,
    note: DATA_QUALITY_NOTE[dataQuality],
  };
}
