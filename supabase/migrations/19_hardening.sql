-- =====================================================================
-- 19_hardening.sql  —  Claim-Rename + Betriebs-/Compliance-Tabellen (P0/P1)
-- =====================================================================
-- Bündelt mehrere unabhängige, additive Härtungen in einer Migration.
-- Alles idempotent & gefahrlos mehrfach ausführbar.
-- =====================================================================

-- ---------------------------------------------------------------------
-- (1) Claim: Archetyp-ANZEIGENAME bereinigen. Code/Slug bleiben stabil,
--     damit URLs (/archetyp/…) und Joins nicht brechen.
-- ---------------------------------------------------------------------
update public.archetypes
   set name_de = 'Der Analytische Strukturgeber'
 where code = 'analytical_diagnostician'
   and name_de = 'Der Analytische Diagnostiker';

-- ---------------------------------------------------------------------
-- (2) Stripe-Event-Idempotenz-Log. Ergänzt die bestehende
--     session_id-Klammer um ein vollständiges Event-Log (alle Event-Typen,
--     auch künftige), damit Redeliveries sauber erkannt werden.
-- ---------------------------------------------------------------------
create table if not exists public.stripe_events (
  event_id     text primary key,
  type         text not null,
  status       text not null default 'received' check (status in ('received', 'processed', 'error')),
  error        text,
  received_at  timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.stripe_events enable row level security;
-- Kein Policy → ausschließlich Service-Role (Webhook).

-- ---------------------------------------------------------------------
-- (3) Admin-Rollen NICHT nur über ADMIN_EMAILS. DB-gestützt, auditierbar.
-- ---------------------------------------------------------------------
create table if not exists public.admin_roles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'admin' check (role in ('admin', 'support', 'owner')),
  mfa_required boolean not null default true,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);
alter table public.admin_roles enable row level security;
drop policy if exists admin_roles_select_own on public.admin_roles;
create policy admin_roles_select_own
  on public.admin_roles for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- (4) DSGVO-/Compliance-Grundgerüst (P1): Consent, Export, Löschung, Audit.
-- ---------------------------------------------------------------------
create table if not exists public.consent_records (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  consent_type    text not null,          -- z. B. 'agb', 'datenschutz', 'ki_verarbeitung'
  version         text not null,
  accepted_at     timestamptz not null default now(),
  ip_hash         text,
  user_agent_hash text,
  source          text
);
create index if not exists consent_records_user_idx on public.consent_records (user_id);
alter table public.consent_records enable row level security;
drop policy if exists consent_select_own on public.consent_records;
create policy consent_select_own on public.consent_records for select using (auth.uid() = user_id);

create table if not exists public.data_exports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'requested' check (status in ('requested', 'processing', 'ready', 'failed')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  download_url text
);
alter table public.data_exports enable row level security;
drop policy if exists data_exports_select_own on public.data_exports;
create policy data_exports_select_own on public.data_exports for select using (auth.uid() = user_id);

create table if not exists public.deletion_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'requested' check (status in ('requested', 'processing', 'done', 'failed')),
  scope        text not null default 'account' check (scope in ('account', 'assessment', 'report')),
  target_id    uuid,                       -- assessment_id / report_id bei scope != account
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.deletion_requests enable row level security;
drop policy if exists deletion_requests_select_own on public.deletion_requests;
create policy deletion_requests_select_own on public.deletion_requests for select using (auth.uid() = user_id);
drop policy if exists deletion_requests_insert_own on public.deletion_requests;
create policy deletion_requests_insert_own on public.deletion_requests for insert with check (auth.uid() = user_id);

create table if not exists public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  actor_user_id   uuid references auth.users(id) on delete set null,
  organization_id uuid,                    -- Vorbereitung Mandantenfähigkeit (P2)
  action          text not null,
  entity_type     text,
  entity_id       text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_user_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
alter table public.audit_logs enable row level security;
-- Kein Policy → nur Service-Role schreibt/liest (Admin-Kontext).
