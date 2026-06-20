import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');
const DE_DICT = read('lib', 'i18n', 'dictionaries', 'de.ts');

const ENT = read('lib', 'auth', 'assessment-entitlement.ts');
const WEBHOOK = read('app', 'api', 'stripe', 'webhook', 'route.ts');
const MIG39 = read('supabase', 'migrations', '39_season_hardening.sql');
const MIG40 = read('supabase', 'migrations', '40_live_response_count_and_refund_cascade.sql');
const CLOSE = read('app', 'api', 'seasons', '[id]', 'cycles', '[cycleId]', 'close', 'route.ts');
const ARCHIVE = read('app', 'api', 'seasons', '[id]', 'cycles', '[cycleId]', 'archive', 'route.ts');
const SUBMIT = read('app', 'api', 'pulse', '[token]', 'submit', 'route.ts');
const SEASON_PAGE = read('app', 'saison', '[id]', 'page.tsx');

// ============================================================
// P0 Blocker 1 · Zentrale Entitlement-Prüfung für alle Einladungswege
// ============================================================
describe('P0/1 · requireActiveAssessmentEntitlement Helper', () => {
  it('exportiert beide Helfer', () => {
    expect(ENT).toMatch(/export async function requireActiveAssessmentEntitlement/);
    expect(ENT).toMatch(/export async function requireActiveInvitationByToken/);
  });
  it('sperrt awaiting_contract_confirmation mit 409', () => {
    expect(ENT).toMatch(/awaiting_contract_confirmation/);
    expect(ENT).toMatch(/status:\s*409/);
  });
  it('verlangt paid + confirmation_sent_at und kennt 402', () => {
    expect(ENT).toMatch(/status !== 'paid'/);
    expect(ENT).toMatch(/status:\s*402/);
    expect(ENT).toMatch(/confirmation_sent_at/);
  });
  it('unterstützt optionale minTier-Prüfung', () => {
    expect(ENT).toMatch(/minTier/);
    expect(ENT).toMatch(/tier < opts\.minTier/);
  });
});

describe('P0/1 · alle sechs Einladungsrouten nutzen den Helper', () => {
  const adminRoutes: [string, string[]][] = [
    ['invitations/create', ['app', 'api', 'invitations', 'create', 'route.ts']],
    ['invitations/bulk', ['app', 'api', 'invitations', 'bulk', 'route.ts']],
    ['invitations/send', ['app', 'api', 'invitations', 'send', 'route.ts']],
  ];
  for (const [name, p] of adminRoutes) {
    it(`${name}: requireActiveAssessmentEntitlement`, () => {
      expect(read(...p)).toMatch(/requireActiveAssessmentEntitlement/);
    });
  }
  const tokenRoutes: [string, string[]][] = [
    ['[token]/open', ['app', 'api', 'invitations', '[token]', 'open', 'route.ts']],
    ['[token]/answer', ['app', 'api', 'invitations', '[token]', 'answer', 'route.ts']],
    ['[token]/complete', ['app', 'api', 'invitations', '[token]', 'complete', 'route.ts']],
  ];
  for (const [name, p] of tokenRoutes) {
    it(`${name}: requireActiveInvitationByToken`, () => {
      expect(read(...p)).toMatch(/requireActiveInvitationByToken/);
    });
  }
  it('bulk verlangt Tier 4 und begrenzt Tokenmenge', () => {
    const b = read('app', 'api', 'invitations', 'bulk', 'route.ts');
    expect(b).toMatch(/ent\.tier < 4/);
    expect(b).toMatch(/MAX_ACTIVE_PLAYER_TOKENS\s*=\s*200/);
    expect(b).toMatch(/MAX_PER_REQUEST\s*=\s*50/);
  });
  it('create verlangt Tier 3', () => {
    const c = read('app', 'api', 'invitations', 'create', 'route.ts');
    expect(c).toMatch(/ent\.tier < 3/);
  });
});

describe('P0/1 · Refund-Cascade im Stripe-Webhook', () => {
  it('deaktiviert normale Einladungen (expired) und Share-Link', () => {
    expect(WEBHOOK).toMatch(/status:\s*'expired'/);
    expect(WEBHOOK).toMatch(/not\('status',\s*'in',\s*'\(completed,expired\)'\)/);
    expect(WEBHOOK).toMatch(/share_enabled:\s*false/);
    expect(WEBHOOK).toMatch(/share_token:\s*null/);
  });
});

// ============================================================
// P0 Blocker 1 · Refund-Lockdown (Variante A) bei Lesezugriff
// ============================================================
describe('P0/1 · Refund-Lockdown bei Report/Result/Share', () => {
  it('report-status gated mit checkPaidEntitlement + 402', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'report-status', 'route.ts');
    expect(r).toMatch(/checkPaidEntitlement/);
    expect(r).toMatch(/status:\s*402/);
  });
  it('result-Seite gated mit checkPaidEntitlement', () => {
    const r = read('app', 'assessment', '[id]', 'result', 'page.tsx');
    expect(r).toMatch(/checkPaidEntitlement/);
    expect(DE_DICT).toMatch(/Zugriff gesperrt/);
    expect(r).toMatch(/resultPage\.lockedKicker/);
  });
  it('share-Aktivierung gated mit checkPaidEntitlement + 402', () => {
    const r = read('app', 'api', 'assessment', '[id]', 'share', 'route.ts');
    expect(r).toMatch(/checkPaidEntitlement/);
    expect(r).toMatch(/status:\s*402/);
  });
});

// ============================================================
// P0 Blocker 2 · Saison nach Refund nicht mehr lesbar
// ============================================================
describe('P0/2 · Saison-Lesezugriff serverseitig gated', () => {
  it('page lädt erst nach requireSeasonEntitlement', () => {
    expect(SEASON_PAGE).toMatch(/requireSeasonEntitlement/);
    expect(SEASON_PAGE).toMatch(/seasonDetail\.lockedKicker/);
    expect(DE_DICT).toMatch(/Saison-Monitor · Zugriff gesperrt/);
  });
  it('Daten werden via admin (service_role) geladen, nicht mit User-Client', () => {
    expect(SEASON_PAGE).toMatch(/admin\s*\n?\s*\.from\('pulse_cycles'\)/);
    expect(SEASON_PAGE).toMatch(/admin\s*\n?\s*\.from\('pulse_invitations'\)/);
    // User-Client darf NICHT direkt Saisondaten laden.
    expect(SEASON_PAGE).not.toMatch(/supabase\s*\n?\s*\.from\('pulse_cycles'\)/);
  });
  it('Migration 40 verschärft RLS auf pulse_cycles/pulse_invitations', () => {
    expect(MIG40).toMatch(/pulse_cycles_owner_select/);
    expect(MIG40).toMatch(/pulse_invitations_owner_select/);
  });
});

// ============================================================
// P0 Blocker 3 · Live-Antwortzähler + sicheres Schließen
// ============================================================
describe('P0/3 · Live-Zählfunktion (Migration 40)', () => {
  it('reine Zählfunktion nur für service_role', () => {
    expect(MIG40).toMatch(/create or replace function public\.get_pulse_cycle_response_count/);
    expect(MIG40).toMatch(/count\(distinct pr\.respondent_token\)/);
    expect(MIG40).toMatch(/grant\s+execute on function public\.get_pulse_cycle_response_count\(uuid\) to service_role/);
    expect(MIG40).toMatch(/revoke execute on function public\.get_pulse_cycle_response_count\(uuid\) from authenticated/);
  });
  it('refresh-Funktion schreibt response_count, nur service_role', () => {
    expect(MIG40).toMatch(/create or replace function public\.refresh_pulse_cycle_response_count/);
    expect(MIG40).toMatch(/grant\s+execute on function public\.refresh_pulse_cycle_response_count\(uuid\) to service_role/);
  });
});

describe('P0/3 · Submit aktualisiert Live-Zähler', () => {
  it('ruft refresh_pulse_cycle_response_count und gibt responseCount zurück', () => {
    expect(SUBMIT).toMatch(/refresh_pulse_cycle_response_count/);
    expect(SUBMIT).toMatch(/return ok\(\{ saved: records\.length, responseCount \}\)/);
  });
});

describe('P0/3 · Close-Route härtet Anonymitätsschwelle', () => {
  it('prüft status open, verlangt >=5, hat Race-Guard', () => {
    expect(CLOSE).toMatch(/cycle\.status !== 'open'/);
    expect(CLOSE).toMatch(/refresh_pulse_cycle_response_count/);
    expect(CLOSE).toMatch(/Noch nicht genügend vollständige Antworten/);
    expect(CLOSE).toMatch(/status:\s*409/);
    expect(CLOSE).toMatch(/\.eq\('status',\s*'open'\)/);
  });
});

describe('P0/3 · Archive-Route (ohne Auswertung)', () => {
  it('setzt status archived ohne Snapshot, mit Entitlement und Open-Check', () => {
    expect(ARCHIVE).toMatch(/requireSeasonEntitlement/);
    expect(ARCHIVE).toMatch(/status:\s*'archived'/);
    expect(ARCHIVE).toMatch(/\.eq\('status',\s*'open'\)/);
    expect(ARCHIVE).not.toMatch(/snapshot:/);
  });
});

// ============================================================
// P0 · Migration 39 Preflight (Dedup vor Unique-Index)
// ============================================================
describe('P0 · Migration 39 dedupliziert offene Cycles vor dem Index', () => {
  it('archiviert ältere offene Cycles, bevor der Unique-Index gebaut wird', () => {
    const dedupIdx = MIG39.indexOf("set status = 'archived'");
    const uniqueIdx = MIG39.indexOf('pulse_cycles_one_open_per_season');
    expect(dedupIdx).toBeGreaterThan(-1);
    expect(uniqueIdx).toBeGreaterThan(-1);
    expect(dedupIdx).toBeLessThan(uniqueIdx);
    expect(MIG39).toMatch(/row_number\(\) over/);
    expect(MIG39).toMatch(/partition by season_id/);
  });
});

// ============================================================
// P1 · Token-Revoke/Rotate
// ============================================================
describe('P1 · Pulse-Token revoke + rotate', () => {
  it('revoke setzt status=revoked mit Entitlement', () => {
    const r = read('app', 'api', 'seasons', '[id]', 'invitations', '[invitationId]', 'revoke', 'route.ts');
    expect(r).toMatch(/requireSeasonEntitlement/);
    expect(r).toMatch(/status:\s*'revoked'/);
  });
  it('rotate erzeugt neuen base64url-Token + reaktiviert', () => {
    const r = read('app', 'api', 'seasons', '[id]', 'invitations', '[invitationId]', 'rotate', 'route.ts');
    expect(r).toMatch(/requireSeasonEntitlement/);
    expect(r).toMatch(/randomBytes\(24\)/);
    expect(r).toMatch(/status:\s*'active'/);
    expect(r).toMatch(/23505/); // Kollisions-Retry
  });
});

// ============================================================
// P1 · Falsche Pause-/Link-Aussagen entfernt
// ============================================================
describe('P1 · keine falschen Pause-/Resume-/Auto-Link-Aussagen', () => {
  const files = [
    ['app', 'teamcheck', '[token]', 'runner.tsx'],
    ['app', 'einschaetzung', '[token]', 'runner.tsx'],
    ['app', 'pulse', '[token]', 'runner.tsx'],
    ['app', 'api', 'invitations', 'send', 'route.ts'],
  ];
  for (const f of files) {
    it(`${f.join('/')}: keine "pausieren/weitermachen"`, () => {
      const r = read(...f);
      expect(r).not.toMatch(/pausieren und später weitermachen/);
    });
  }
  it('pulse runner verspricht keinen automatischen Link', () => {
    const r = read('app', 'pulse', '[token]', 'runner.tsx');
    // i18n: der nutzersichtbare Claim liegt im Wörterbuch. Dort den ehrlichen Wortlaut
    // prüfen + sicherstellen, dass weder Wörterbuch noch Runner einen Auto-Link versprechen.
    expect(r).toMatch(/pulseRunner\.doneText/);
    expect(DE_DICT).toMatch(/denselben Link/);
    expect(DE_DICT).not.toMatch(/automatisch wieder einen Link/);
    expect(r).not.toMatch(/automatisch wieder einen Link/);
  });
});

// ============================================================
// P1 · Serverseitige Validierung + Token-Caps
// ============================================================
describe('P1 · Zod-Validierung Saison-Eingaben', () => {
  it('seasons/create validiert name/sport/team_size/interval', () => {
    const r = read('app', 'api', 'seasons', 'create', 'route.ts');
    expect(r).toMatch(/from 'zod'/);
    expect(r).toMatch(/min\(1\)\.max\(120\)/);
    expect(r).toMatch(/max\(500\)/);
    expect(r).toMatch(/min\(7\)\.max\(365\)/);
  });
  it('cycles/start validiert closes_in_days 3–60', () => {
    const r = read('app', 'api', 'seasons', '[id]', 'cycles', 'start', 'route.ts');
    expect(r).toMatch(/from 'zod'/);
    expect(r).toMatch(/int\(\)\.min\(3\)\.max\(60\)/);
  });
  it('season bulk: Cap 200 + fortlaufende Labels (labelOffset)', () => {
    const r = read('app', 'api', 'seasons', '[id]', 'invitations', 'bulk', 'route.ts');
    expect(r).toMatch(/MAX_ACTIVE_TOKENS_PER_SEASON\s*=\s*200/);
    expect(r).toMatch(/labelOffset/);
  });
});

// ============================================================
// P0 Blocker 4 · Deployment-Dokumentation aktualisiert
// ============================================================
describe('P0/4 · Deployment-Dokumentation auf v3.42 / 01→43', () => {
  const docs = ['GO-LIVE.md', 'LAUNCH_CHECKLIST.md', 'README.md'];
  for (const d of docs) {
    it(`${d}: Header nennt v3.42 und Migrationen 01 → 43`, () => {
      const r = read(d);
      expect(r).toMatch(/DEPLOYMENT-STAND v3\.42/);
      expect(r).toMatch(/Migrationen 01 → 43/);
    });
    it(`${d}: nennt korrekten Answer-Pfad statt rest/v1/answers-Write`, () => {
      const r = read(d);
      expect(r).toMatch(/POST \/api\/assessment\/\[id\]\/answer/);
    });
  }
  it('GO-LIVE + LAUNCH nennen den Migration-39-Preflight', () => {
    expect(read('GO-LIVE.md')).toMatch(/having count\(\*\) > 1/);
    expect(read('LAUNCH_CHECKLIST.md')).toMatch(/PREFLIGHT/);
  });
  it('LAUNCH_CHECKLIST: kein veralteter rest/v1/answers-Selbsttest mehr', () => {
    const r = read('LAUNCH_CHECKLIST.md');
    expect(r).not.toMatch(/merge-duplicates/);
    expect(r).not.toMatch(/wendet 12_rls_hardening\.sql an/);
  });
});
