/**
 * CoachCheck · Achtsamkeits-Trigger (pure, testbar)
 * ==================================================
 * Know-how-Transfer aus Humatrix (Red-Flag-Audit 2026-06), adaptiert
 * auf den CoachCheck-Kontext (TeamCheck-Spieler-Items + Saison-Pulse).
 *
 * Übernommene Prinzipien:
 *
 *  · WERTABHÄNGIGE Trigger mit EXPLIZITER Richtung pro Item — keine
 *    Pauschalheuristik. Jede Zeile ist eine bewusste fachliche
 *    Einordnung des Wortlauts. (Humatrix-Audit: vorher erzeugte jedes
 *    beantwortete Risiko-Item einen Eintrag unabhängig vom Wert —
 *    Alarm-Fatigue ist ein dokumentiertes Screening-Risiko.)
 *  · AGGREGAT statt Einzelflut: höchstens wenige gebündelte Hinweise
 *    pro Auswertung, nie ein Eintrag pro Antwort.
 *  · SICHTBARKEITS-PRINZIP: Der Trainer ist hier zugleich Kunde UND
 *    Bezugsperson der Befragten. Hinweise erscheinen daher NUR
 *    anonym aggregiert, NIE auf Einzelpersonen rückführbar, und mit
 *    claim-sicherer Formulierung (kein Befund, keine Einordnung
 *    einzelner Personen).
 *  · NICHT-DIAGNOSTISCH: Die Hinweise markieren Themen für ein
 *    achtsames Gespräch im geschützten Rahmen — mehr nicht.
 *
 * Bewusste Abweichungen vom Humatrix-Original:
 *
 *  · KEIN Freitext-Fail-safe: CoachCheck erfasst ausschließlich
 *    numerische/Choice-Antworten (server-validiert), es existiert
 *    kein Disclosure-Kanal. Unbekannte Item-Codes routen deshalb
 *    NICHT (statt fail-safe-immer) — es gibt keine Review-Queue,
 *    in die sie fließen könnten; konservativ ist hier: schweigen
 *    statt spekulieren.
 *  · STRENGERE Anonymitätsschwelle: Hinweis nur bei ≥ MIN_RESPONDENTS
 *    Antwortenden UND ≥ MIN_CONCERNED betroffenen Antworten UND
 *    ≥ SHARE_THRESHOLD Anteil. Das spiegelt die TeamCheck-Schwelle
 *    (5) und verhindert Rückschlüsse auf Einzelne.
 */

export type CareTriggerRule =
  /** Schutzfaktor-Wortlaut: Hinweis bei Ablehnung (Wert ≤ 2). */
  | 'protective_low'
  /** Belastungs-Wortlaut (reverse): Hinweis bei Zustimmung (Wert ≥ 4). */
  | 'concern_high'
  /** Nie einzeln werten (Leistungs-/Klarheits-Items ohne Achtsamkeitsbezug). */
  | 'never';

export type CareTriggerEntry = {
  rule: CareTriggerRule;
  /** Kurzthema für die aggregierte Anzeige (claim-sicher formuliert). */
  topic: string;
  /** Gesprächsimpuls — bewusst als Einladung, nie als Befund formuliert. */
  impulse: string;
};

/**
 * Explizite fachliche Einordnung (Wortlaut-Review der Seeds 06 + 07).
 * Items ohne Eintrag werden NIE einzeln gewertet (siehe Kopfkommentar).
 */
export const CARE_TRIGGER_RULES: Readonly<Record<string, CareTriggerEntry>> = Object.freeze({
  // --- TeamCheck Spieler-Items (Migration 06) ---
  TC_ci_03: {
    rule: 'protective_low', // „Auch unter Druck bleibt mein Trainer respektvoll."
    topic: 'Respekt unter Druck',
    impulse:
      'Ein Teil der Antworten erlebt den Umgangston in Drucksituationen als weniger respektvoll. Im Team offen und ohne Schuldzuweisung ansprechen, wie Druckmomente kommuniziert werden.',
  },
  TC_ci_04: {
    rule: 'protective_low', // „Wenn ich einen Fehler mache, fühle ich mich nicht klein gemacht."
    topic: 'Umgang mit Fehlern',
    impulse:
      'Ein Teil der Antworten fühlt sich nach Fehlern herabgesetzt. Fehlerreaktionen bewusst reflektieren und im Team eine klare Vereinbarung treffen, wie Fehler besprochen werden.',
  },
  TC_ps_01: {
    rule: 'protective_low', // „Ich kann ehrlich sagen, was ich denke, ohne Konsequenzen zu fürchten."
    topic: 'Offen sprechen können',
    impulse:
      'Ein Teil der Antworten traut sich nicht, offen zu sprechen. Niedrigschwellige, geschützte Gesprächsformate anbieten (Einzelgespräche, anonyme Rückmeldewege).',
  },
  TC_ps_02: {
    rule: 'protective_low', // „In diesem Team werden Fehler als Lerngelegenheit gesehen."
    topic: 'Fehlerkultur',
    impulse:
      'Ein Teil der Antworten erlebt Fehler nicht als Lerngelegenheit. Lernmomente nach Fehlern aktiv und sichtbar gestalten.',
  },
  TC_tk_02: {
    rule: 'concern_high', // „Es gibt im Team Untergruppen, die das Klima belasten." (reverse)
    topic: 'Belastende Untergruppen',
    impulse:
      'Ein Teil der Antworten nimmt belastende Untergruppen wahr. Teamdynamik beobachten und gemeinsame Bezugspunkte schaffen — ohne einzelne Gruppen zu benennen oder bloßzustellen.',
  },
  TC_ld_01: {
    rule: 'protective_low', // „Der Druck im Team ist motivierend, nicht erdrückend."
    topic: 'Erlebter Druck',
    impulse:
      'Ein Teil der Antworten erlebt den Druck eher als belastend denn als motivierend. Belastungsquellen trennen (sportlich vs. zwischenmenschlich) und Erholungsfenster sichtbar machen.',
  },
  // Bewusst OHNE Achtsamkeits-Einordnung (Leistungs-/Klarheitsbezug,
  // wird über die Dimensions-Scores abgebildet — Alarm-Fatigue-Prävention):
  TC_ci_01: { rule: 'never', topic: '', impulse: '' },
  TC_ci_02: { rule: 'never', topic: '', impulse: '' },
  TC_tk_01: { rule: 'never', topic: '', impulse: '' },
  TC_rk_01: { rule: 'never', topic: '', impulse: '' },

  // --- Saison-Pulse-Items (Migration 07) ---
  P_ps_01: {
    rule: 'protective_low', // „Ich konnte ehrlich sagen was ich denke."
    topic: 'Offen sprechen können',
    impulse:
      'In diesem Zyklus konnte ein Teil der Antwortenden nicht offen sprechen. Kurzfristig geschützte Gesprächsangebote machen.',
  },
  P_be_01: {
    rule: 'concern_high', // „Der Druck war diese Woche zu hoch." (reverse)
    topic: 'Belastungsspitze',
    impulse:
      'Ein Teil der Antworten meldet zu hohen Druck in dieser Woche. Belastungssteuerung der kommenden Einheiten prüfen.',
  },
  P_wg_01: {
    rule: 'protective_low', // „Ich fühlte mich als Teil des Teams."
    topic: 'Zugehörigkeit',
    impulse:
      'Ein Teil der Antworten fühlte sich diese Woche weniger eingebunden. Auf Anschluss im Training achten (Gruppenbildung, Ansprache) — ohne Einzelne zu exponieren.',
  },
  P_ci_03: {
    rule: 'protective_low', // „Ich habe mich vom Trainer wertgeschätzt gefühlt."
    topic: 'Erlebte Wertschätzung',
    impulse:
      'Ein Teil der Antworten hat sich diese Woche wenig wertgeschätzt gefühlt. Bewusst individuelle Anerkennungsmomente setzen.',
  },
  P_ci_01: { rule: 'never', topic: '', impulse: '' },
  P_ci_02: { rule: 'never', topic: '', impulse: '' },
  P_tk_01: { rule: 'never', topic: '', impulse: '' },
  P_fk_01: { rule: 'never', topic: '', impulse: '' },
});

/** Mindestzahl unterschiedlicher Antwortender, bevor überhaupt ausgewertet wird. */
export const MIN_RESPONDENTS = 5;
/** Mindestzahl betroffener Antworten (verhindert Einzel-Rückschluss). */
export const MIN_CONCERNED = 2;
/** Mindestanteil betroffener Antworten am Item. */
export const SHARE_THRESHOLD = 0.25;
/** Obergrenze ausgegebener Hinweise pro Auswertung (Alarm-Fatigue-Prävention). */
export const MAX_HINTS = 3;

export type CareResponse = {
  /** Item-Code (z. B. 'TC_ps_01' oder 'P_be_01'). */
  code: string;
  /** Likert-Wert 1..5. Andere Formate nehmen nicht teil. */
  value: number;
  /** Anonymer Antwortenden-Schlüssel (Invitation-ID bzw. respondent_token). */
  respondent: string;
};

export type CareHint = {
  code: string;
  topic: string;
  /** Anteil betroffener Antworten (0..1, gerundet auf 2 Stellen). */
  share: number;
  /** Zahl der Antwortenden auf dem Item (nur zur Transparenz, nie < MIN_RESPONDENTS). */
  respondents: number;
  /** Fertig formulierter, claim-sicherer Hinweistext. */
  text: string;
};

function isConcerning(rule: CareTriggerRule, value: number): boolean {
  if (rule === 'protective_low') return value <= 2;
  if (rule === 'concern_high') return value >= 4;
  return false;
}

/**
 * Aggregierte Achtsamkeits-Auswertung über einen Satz anonymer Antworten.
 *
 * Garantien:
 *  · Kein Hinweis unterhalb der Anonymitätsschwellen (MIN_RESPONDENTS,
 *    MIN_CONCERNED, SHARE_THRESHOLD).
 *  · Höchstens MAX_HINTS Hinweise, sortiert nach Anteil (stärkstes Signal zuerst).
 *  · Unbekannte Codes und Nicht-Likert-Werte werden ignoriert.
 *  · Ausgabetexte sind nicht-diagnostisch und nennen keine Personen.
 */
export function evaluateCareSignals(responses: ReadonlyArray<CareResponse>): CareHint[] {
  // Pro Item: betroffene Antworten + unterschiedliche Antwortende zählen.
  const byCode = new Map<string, { concerned: number; respondents: Set<string> }>();

  for (const r of responses) {
    const entry = CARE_TRIGGER_RULES[r.code];
    if (!entry || entry.rule === 'never') continue;
    if (!Number.isFinite(r.value) || !Number.isInteger(r.value) || r.value < 1 || r.value > 5) continue;

    let agg = byCode.get(r.code);
    if (!agg) {
      agg = { concerned: 0, respondents: new Set<string>() };
      byCode.set(r.code, agg);
    }
    agg.respondents.add(r.respondent);
    if (isConcerning(entry.rule, r.value)) agg.concerned += 1;
  }

  const hints: CareHint[] = [];
  for (const [code, agg] of byCode) {
    const n = agg.respondents.size;
    if (n < MIN_RESPONDENTS) continue;
    if (agg.concerned < MIN_CONCERNED) continue;
    const share = agg.concerned / n;
    if (share < SHARE_THRESHOLD) continue;

    const entry = CARE_TRIGGER_RULES[code];
    hints.push({
      code,
      topic: entry.topic,
      share: Math.round(share * 100) / 100,
      respondents: n,
      text: entry.impulse,
    });
  }

  hints.sort((a, b) => b.share - a.share || a.code.localeCompare(b.code));
  return hints.slice(0, MAX_HINTS);
}

/**
 * Claim-sicherer Rahmensatz für jede Anzeige der Hinweise.
 * Wird bewusst zentral gepflegt, damit UI/PDF/Prompt identisch hedgen.
 */
export const CARE_FRAME_NOTE =
  'Achtsamkeitshinweise: anonym aggregierte Antwortmuster — kein Befund und keine Aussage über einzelne Personen. ' +
  'Gedacht als Gesprächsimpuls im geschützten Rahmen.';
