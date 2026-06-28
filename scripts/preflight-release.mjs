/**
 * RELEASE-PREFLIGHT (Live-Datenbank).
 *
 * Ruft die geschützte Readiness-API gegen die echte (migrierte) Umgebung auf
 * und beendet sich mit Exit-Code != 0, solange NICHT „ready: true" (HTTP 200)
 * gemeldet wird. Damit lässt sich vor jedem Deploy maschinell sicherstellen,
 * dass das deployte Modell dem Release-Vertrag entspricht (Module, Pole,
 * Itemzahlen, Archetypen).
 *
 * Aufruf:
 *   PREFLIGHT_BASE_URL=https://coachcheck.humatrix.cc \
 *   CRON_SECRET=*** \
 *   node scripts/preflight-release.mjs
 *
 * Default-Basis-URL: NEXT_PUBLIC_APP_URL bzw. http://localhost:3000.
 */

const BASE =
  process.env.PREFLIGHT_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';
const SECRET = process.env.CRON_SECRET;

function fail(msg) {
  console.error(`✗ Preflight: ${msg}`);
  process.exit(1);
}

if (!SECRET) {
  fail('CRON_SECRET ist nicht gesetzt — die Readiness-API ist ohne Bearer-Token nicht erreichbar.');
}

const url = `${BASE.replace(/\/$/, '')}/api/admin/readiness`;

try {
  const res = await fetch(url, {
    method: 'GET',
    headers: { authorization: `Bearer ${SECRET}` },
  });

  let body;
  try {
    body = await res.json();
  } catch {
    fail(`Antwort von ${url} war kein JSON (HTTP ${res.status}).`);
  }

  if (res.status === 200 && body?.ready === true) {
    console.log(`✓ Preflight OK — Release-Vertrag erfüllt (${url}).`);
    for (const c of body.checks ?? []) {
      console.log(`  · ${c.ok ? 'OK ' : 'ERR'} ${c.id}: ${c.detail}`);
    }
    process.exit(0);
  }

  console.error(`✗ Preflight: Readiness meldet NICHT bereit (HTTP ${res.status}).`);
  for (const c of body?.checks ?? []) {
    if (!c.ok) console.error(`  · ERR ${c.id}: ${c.detail}`);
  }
  process.exit(1);
} catch (err) {
  fail(`Readiness-API nicht erreichbar (${url}): ${err?.message ?? err}`);
}
