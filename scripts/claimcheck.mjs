#!/usr/bin/env node
/**
 * claimcheck — Build-Gate gegen riskante Claims in der KUNDEN-SICHTBAREN
 * Marketing-/Legal-Oberfläche.
 *
 * Scope bewusst: Landing-Komponenten, Legal-Seiten, Homepage, Musterbericht.
 * NICHT gescannt wird der Report-Prompt (er MUSS verbotene Wörter nennen, um
 * sie dem Modell zu verbieten) — dort greift zusätzlich der Laufzeit-Claim-Guard.
 *
 * Exit 1, wenn ein verbotener Claim gefunden wird.
 *
 * Negation-aware: "diagnostisch" ist nur verboten, wenn NICHT direkt von
 * kein/keine/nicht verneint (Disclaimer wie "keine ... Diagnostik" sind ok).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = [
  'components/landing',
  'app/legal',
  'app/musterbericht',
  'supabase/migrations',
  // v3_15: Achtsamkeitshinweise enthalten endnutzer-sichtbare Texte (UI + PDF)
  'lib/safety',
  // v3_74: Die kundensichtbaren Marketing-Texte leben in den i18n-Dictionaries
  // (Landing-Komponenten enthalten nur noch t()-Keys). Ohne diese Roots würde
  // claimcheck die echten Claims gar nicht sehen.
  'lib/i18n/dictionaries',
];
const SINGLE_FILES = ['app/page.tsx'];

const EXT = new Set(['.ts', '.tsx', '.mdx', '.md', '.sql']);

// Dateien, die das verbotene Wort zwangsläufig als zu- entfernenden Such-String
// enthalten (Claim-Bereinigung selbst) — nicht als Verstoß werten.
const IGNORE_BASENAMES = new Set(['21_claim_cleanup_product_features.sql']);

// Harte, immer verbotene Phrasen (keine sinnvolle Verneinung denkbar).
const HARD = [
  { re: /garantiert\s+(?:mehr\s+)?(?:siege|erfolg|aufstieg|titel)/gi, msg: 'Erfolgsgarantie' },
  { re: /\bmental\s+schwach\b/gi, msg: 'Stigmatisierung "mental schwach"' },
  { re: /\b(?:ist|wird)\s+bewiesen\b/gi, msg: 'Beweis-Behauptung' },
  { re: /\bobjektive?\s+(?:trainer)?bewertung\b/gi, msg: 'objektive Bewertung' },
  { re: /\bvalidierter?\s+(?:psychologischer\s+)?test\b/gi, msg: 'validierter Test' },
  // v3_74: entschärfte Landing-Claims dauerhaft sperren (Regression-Guard)
  { re: /null\s+aufwand/gi, msg: 'Aufwand-Untertreibung "Null Aufwand"' },
  { re: /entscheidet\s+(?:das\s+)?spiele?\b/gi, msg: 'unbelegte Kausalbehauptung "entscheidet Spiele"' },
  { re: /kein\s+team\s+sagt\s+dir\s+die\s+wahrheit/gi, msg: 'absolute Behauptung "kein Team sagt dir die Wahrheit"' },
];

// Negation-aware: diagnostisch* nur als POSITIVER Claim verboten.
const NEG = /(kein|keine|keiner|nicht|statt|anstatt|sondern)\b[^.]{0,40}$/i;
const DIAG = /diagnostisch\w*/gi;

function walk(dir) {
  let out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) out = out.concat(walk(p));
    else if (EXT.has(extname(p)) && !IGNORE_BASENAMES.has(e)) out.push(p);
  }
  return out;
}

const files = [...ROOTS.flatMap(walk), ...SINGLE_FILES];
const violations = [];

for (const f of files) {
  let text;
  try { text = readFileSync(f, 'utf8'); } catch { continue; }
  const lines = text.split('\n');

  for (const { re, msg } of HARD) {
    lines.forEach((line, i) => {
      if (re.test(line)) violations.push(`${f}:${i + 1}  [${msg}]  ${line.trim().slice(0, 90)}`);
      re.lastIndex = 0;
    });
  }

  lines.forEach((line, i) => {
    let m;
    DIAG.lastIndex = 0;
    while ((m = DIAG.exec(line)) !== null) {
      const before = line.slice(0, m.index);
      if (!NEG.test(before)) {
        violations.push(`${f}:${i + 1}  [positiver Diagnose-Claim: "${m[0]}"]  ${line.trim().slice(0, 90)}`);
      }
    }
  });
}

if (violations.length) {
  console.error(`\n✗ claimcheck: ${violations.length} riskante Claim(s) gefunden:\n`);
  for (const v of violations) console.error('  ' + v);
  console.error('\nBitte durch claim-sichere Sprache ersetzen (analytisch / reflexiv / coachingbasiert / wissenschaftlich fundiert).\n');
  process.exit(1);
}
console.log(`✓ claimcheck: ${files.length} Dateien geprüft, keine riskanten Claims.`);
