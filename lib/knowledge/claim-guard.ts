/**
 * HUMATRIX CLAIM GUARD
 * ====================
 * Sicherheitsnetz für jede Reportausgabe. Garantiert, dass gesperrte
 * Begriffe der Evidence-Weighted Claim Engine (v3) NICHT im Kundenreport
 * landen — auch dann nicht, wenn das LLM trotz Anweisung abrutscht.
 *
 * Quelle der gesperrten Wendungen:
 *   - humatrix_claim_engine_rules_v3 (forbidden_wording)
 *   - Programmierer-Implementierung v3, §2.5 (Gesperrte Begriffe)
 *
 * Verhalten: ersetzt klare Verstöße durch claim-sichere Entsprechungen
 * und liefert ein Audit der Treffer (für reports.metadata.claim_audit).
 */

type Replacement = { pattern: RegExp; replace: string; label: string };

// Reihenfolge beachten: spezifische Phrasen vor Einzelwörtern.
const REPLACEMENTS: Replacement[] = [
  { pattern: /\bmental(?:\s+|-)schwach\b/gi, replace: 'unter Druck noch ungefestigt', label: 'mental schwach' },
  // Erfolgs-/Sieggarantie (v5 ausdrücklich verboten) — VOR den generischen garantiert-Regeln.
  { pattern: /\bgarantiert\s+(?:mehr\s+)?(?:siege?|erfolg|aufstieg|titel|punkte|ergebnisse)\b/gi, replace: 'verbessert die Prozessqualität', label: 'Erfolgsgarantie' },
  { pattern: /\b(?:mehr|garantierte)\s+siege\b/gi, replace: 'bessere Prozessqualität', label: 'Sieggarantie' },
  { pattern: /\bwird funktionieren\b/gi, replace: 'wirkt unter diesen Bedingungen günstiger', label: 'wird funktionieren' },
  { pattern: /\bwird (?:scheitern|nicht funktionieren)\b/gi, replace: 'ist unter diesen Bedingungen risikoreicher', label: 'wird scheitern' },
  { pattern: /\bdiagnostizier(?:t|en|te|st)\b/gi, replace: 'zeigt Hinweise auf', label: 'diagnostizieren' },
  { pattern: /\bDiagnose(?:n)?\b/g, replace: 'Einordnung', label: 'Diagnose' },
  { pattern: /\bgarantier(?:t|en|te)\b/gi, replace: 'macht wahrscheinlicher', label: 'garantieren' },
  { pattern: /\bgarantiert\b/gi, replace: 'mit hoher Wahrscheinlichkeit', label: 'garantiert' },
  { pattern: /\bbeweis(?:t|en)\b/gi, replace: 'deutet auf', label: 'beweisen' },
  { pattern: /\bbewiesen\b/gi, replace: 'gut belegt', label: 'bewiesen' },
  { pattern: /\bunbeliebt\b/gi, replace: 'im Team weniger eingebunden', label: 'unbeliebt' },
  { pattern: /\bisoliert\b/gi, replace: 'aktuell wenig vernetzt', label: 'isoliert' },
  { pattern: /\bKrankheit(?:en)?\b/g, replace: 'Belastung', label: 'Krankheit' },
  { pattern: /\b(?:validierter\s+)?Persönlichkeitstest\b/gi, replace: 'Coaching-Standortbestimmung', label: 'Persönlichkeitstest' },
];

export type ClaimAuditEntry = { term: string; count: number };

export type ClaimAudit = {
  clean: boolean;
  hits: ClaimAuditEntry[];
  scannedAt: string;
};

/** Ersetzt gesperrte Wendungen in einem einzelnen String. */
export function softenText(input: string): { text: string; hits: ClaimAuditEntry[] } {
  let text = input;
  const hits: ClaimAuditEntry[] = [];
  for (const r of REPLACEMENTS) {
    const matches = text.match(r.pattern);
    if (matches && matches.length > 0) {
      hits.push({ term: r.label, count: matches.length });
      text = text.replace(r.pattern, r.replace);
    }
  }
  return { text, hits };
}

function mergeHits(target: ClaimAuditEntry[], more: ClaimAuditEntry[]) {
  for (const h of more) {
    const existing = target.find((t) => t.term === h.term);
    if (existing) existing.count += h.count;
    else target.push({ ...h });
  }
}

/**
 * Geht rekursiv durch ein Report-Objekt (Strings, Arrays, verschachtelte
 * Objekte) und entschärft alle Strings. Gibt das bereinigte Objekt + Audit
 * zurück. Nicht-Strings bleiben unverändert.
 */
export function softenDeep<T>(value: T): { value: T; audit: ClaimAudit } {
  const allHits: ClaimAuditEntry[] = [];

  function walk(v: unknown): unknown {
    if (typeof v === 'string') {
      const { text, hits } = softenText(v);
      if (hits.length) mergeHits(allHits, hits);
      return text;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = walk(val);
      return out;
    }
    return v;
  }

  const cleaned = walk(value) as T;
  return {
    value: cleaned,
    audit: { clean: allHits.length === 0, hits: allHits, scannedAt: new Date().toISOString() },
  };
}
