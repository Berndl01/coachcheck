#!/usr/bin/env node
/**
 * PREFLIGHT RELEASE — Live-Datenbank gegen den Release-Vertrag prüfen.
 *
 * Ruft check_release_contract() (Migration 45) auf der ECHTEN Datenbank auf und
 * gleicht zusätzlich die schema_meta-Version mit dem Code (lib/release-contract)
 * ab. Schlägt mindestens eine Bedingung fehl, endet das Script mit Exit-Code 1 —
 * der Release ist dann NICHT freigabefähig.
 *
 * Nutzung:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/preflight-release.mjs
 *
 * .env.local wird, falls vorhanden, automatisch geladen.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- .env.local minimal laden (KEY=VALUE, ohne externe Abhängigkeit) ---------
function loadEnvLocal() {
  const p = join(ROOT, '.env.local');
  if (!existsSync(p)) return;
  for (const raw of readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

// --- Erwartete Versionen aus dem Code spiegeln (muss zu lib/release-contract passen) ---
const EXPECTED = { schema: 46, scoring: '2.0.0', itempool: '2025-06-A' };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

let failed = false;

console.log('— Preflight: Release-Vertrag gegen Live-DB —\n');

// 1) Vertragsprüfung
const { data: checks, error } = await admin.rpc('check_release_contract');
if (error) {
  console.error(`✗ check_release_contract fehlgeschlagen: ${error.message}`);
  console.error('  (Migration 45 angewendet?)');
  process.exit(1);
}

for (const row of checks ?? []) {
  const mark = row.ok ? '✓' : '✗';
  console.log(`${mark} ${row.check_name.padEnd(34)} ${row.detail}`);
  if (!row.ok) failed = true;
}

// 2) Versionen
const { data: meta, error: metaErr } = await admin
  .from('schema_meta')
  .select('schema_version, scoring_version, itempool_version')
  .eq('id', true)
  .maybeSingle();

console.log('');
if (metaErr || !meta) {
  console.error('✗ schema_meta nicht lesbar/vorhanden.');
  failed = true;
} else {
  const checkVer = (name, got, want) => {
    const ok = got === want;
    console.log(`${ok ? '✓' : '✗'} ${('version_' + name).padEnd(34)} DB=${got} erwartet=${want}`);
    if (!ok) failed = true;
  };
  checkVer('schema', meta.schema_version, EXPECTED.schema);
  checkVer('scoring', meta.scoring_version, EXPECTED.scoring);
  checkVer('itempool', meta.itempool_version, EXPECTED.itempool);
}

console.log('');
if (failed) {
  console.error('RESULT: ✗ Release NICHT freigabefähig — mindestens eine Vertragsbedingung verletzt.');
  process.exit(1);
}
console.log('RESULT: ✓ Live-DB entspricht dem Release-Vertrag.');
process.exit(0);
