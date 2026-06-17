import { describe, it, expect } from 'vitest';
import {
  matchDevelopmentProgram,
  buildProgramPromptBlock,
  AXIS_RULES,
  MATURITY_RULES,
} from '@/lib/knowledge/development-matcher';
import { INTERVENTIONS } from '@/lib/knowledge/development-core';
import type { AxisScores, MaturityScores } from '@/lib/scoring';

const IV_IDS = new Set(INTERVENTIONS.map((i) => i.id));

const NEUTRAL_AXES: AxisScores = {
  struktur_intuition: 0.5,
  autoritaet_beteiligung: 0.5,
  leistung_beziehung: 0.5,
  stabilisierung_aktivierung: 0.5,
  reflexion_direktheit: 0.5,
  standardisierung_anpassung: 0.5,
};

const LOW_MATURITY: MaturityScores = {
  selbstregulation: 0.2,
  perspektivflexibilitaet: 0.2,
  konfliktreife: 0.2,
  druckreife: 0.2,
  verantwortungsklarheit: 0.2,
  integrationsfaehigkeit: 0.2,
};

// Verbotene Claim-Muster, die NIE in einen kundensichtbaren Baustein fließen dürfen.
// (Knowledge-Layer wird nicht von claimcheck.mjs gescannt, deshalb hier abgesichert.)
const FORBIDDEN: { re: RegExp; label: string }[] = [
  { re: /garantiert\s+(?:mehr\s+)?(?:siege|erfolg|aufstieg|titel)/i, label: 'Erfolgsgarantie' },
  { re: /\bmental\s+schwach\b/i, label: 'mental schwach' },
  { re: /\b(?:ist|wird)\s+bewiesen\b/i, label: 'Beweis-Behauptung' },
  { re: /\bobjektive?\s+(?:trainer)?bewertung\b/i, label: 'objektive Bewertung' },
  { re: /\bvalidierter?\s+(?:psychologischer\s+)?test\b/i, label: 'validierter Test' },
  { re: /\bDiagnose(?:n)?\b/, label: 'Diagnose' },
  { re: /\bdiagnostizier/i, label: 'diagnostizieren' },
];

describe('development-matcher · Integrität der Verdrahtung', () => {
  it('alle in AXIS_RULES referenzierten Interventions-IDs existieren', () => {
    for (const rules of Object.values(AXIS_RULES)) {
      for (const rule of rules) {
        for (const id of rule.interventionIds) {
          expect(IV_IDS.has(id), `AXIS_RULES referenziert unbekannte ID ${id}`).toBe(true);
        }
        // framings-Keys müssen Teilmenge der interventionIds sein
        for (const key of Object.keys(rule.framings)) {
          expect(rule.interventionIds.includes(key), `framing-Key ${key} ohne interventionId`).toBe(true);
        }
      }
    }
  });

  it('alle in MATURITY_RULES referenzierten Interventions-IDs existieren', () => {
    for (const rule of Object.values(MATURITY_RULES)) {
      for (const id of rule.interventionIds) {
        expect(IV_IDS.has(id), `MATURITY_RULES referenziert unbekannte ID ${id}`).toBe(true);
      }
      for (const key of Object.keys(rule.framings)) {
        expect(rule.interventionIds.includes(key), `framing-Key ${key} ohne interventionId`).toBe(true);
      }
    }
  });
});

describe('development-matcher · Coach-Selbst-Bausteine (v3_26) erreichbar', () => {
  const program = matchDevelopmentProgram({
    axisScores: NEUTRAL_AXES,
    maturityScores: LOW_MATURITY,
    maxItems: 50,
  });
  const surfaced = new Set(program.items.map((i) => i.interventionId));

  it.each(['I035', 'I036', 'I037', 'I038', 'I039', 'I040'])(
    'Baustein %s wird bei niedriger Reife ausgespielt',
    (id) => {
      expect(surfaced.has(id), `${id} wurde vom Matcher nicht erreicht`).toBe(true);
    },
  );

  it('jeder ausgespielte Baustein trägt eine Trainer-Rahmung (coachFraming)', () => {
    for (const item of program.items) {
      expect(item.coachFraming.length).toBeGreaterThan(0);
    }
  });
});

describe('development-matcher · Druck/Selbstregulation surfacing', () => {
  it('niedrige Druckreife allein erzeugt Druck-Bausteine', () => {
    const program = matchDevelopmentProgram({
      axisScores: NEUTRAL_AXES,
      maturityScores: { ...LOW_MATURITY, perspektivflexibilitaet: 0.8, konfliktreife: 0.8, verantwortungsklarheit: 0.8, integrationsfaehigkeit: 0.8, selbstregulation: 0.8 },
      maxItems: 6,
    });
    const ids = program.items.map((i) => i.interventionId);
    // druckreife-Regel enthält u.a. die Vorroutine (I039) bzw. Außendruck (I036)
    expect(ids.some((id) => ['I008', 'I011', 'I039', 'I035', 'I036'].includes(id))).toBe(true);
  });

  it('respektiert maxItems', () => {
    const program = matchDevelopmentProgram({
      axisScores: NEUTRAL_AXES,
      maturityScores: LOW_MATURITY,
      maxItems: 4,
    });
    expect(program.items.length).toBeLessThanOrEqual(4);
  });

  it('Prompt-Block bleibt leer ohne Bausteine, sonst befüllt', () => {
    const empty = matchDevelopmentProgram({ axisScores: NEUTRAL_AXES, maturityScores: null });
    expect(empty.items.length).toBe(0);
    const full = matchDevelopmentProgram({ axisScores: NEUTRAL_AXES, maturityScores: LOW_MATURITY });
    const block = buildProgramPromptBlock(full);
    expect(block).toContain('ENTWICKLUNGSPROGRAMM');
  });
});

describe('development-matcher · Claim-Sicherheit der Bausteine', () => {
  it('keine verbotenen Claim-Muster in Interventionen (name/useCase/steps)', () => {
    for (const iv of INTERVENTIONS) {
      const hay = [iv.name, iv.useCase, ...iv.steps].join(' • ');
      for (const f of FORBIDDEN) {
        expect(f.re.test(hay), `Baustein ${iv.id} enthält "${f.label}": ${hay}`).toBe(false);
      }
    }
  });

  it('keine verbotenen Claim-Muster in den Matcher-Rahmungen', () => {
    const framings: string[] = [];
    for (const rules of Object.values(AXIS_RULES)) for (const r of rules) framings.push(...Object.values(r.framings));
    for (const r of Object.values(MATURITY_RULES)) framings.push(...Object.values(r.framings));
    for (const text of framings) {
      for (const f of FORBIDDEN) {
        expect(f.re.test(text), `Rahmung enthält "${f.label}": ${text}`).toBe(false);
      }
    }
  });
});
