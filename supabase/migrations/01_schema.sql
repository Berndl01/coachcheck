-- ============================================================
-- HUMATRIX COACH ASSESSMENT SYSTEM
-- Phase 1 Schema — Core Tables + RLS
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES — Erweiterung von auth.users
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  sport text check (sport in ('fussball','handball','basketball','volleyball','eishockey','andere')),
  role text check (role in ('trainer','co_trainer','sportpsychologe','andere')),
  club text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger: automatisch Profil anlegen wenn User sich registriert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2. ARCHETYPES — Die 12 Trainer-Archetypen (Stammdaten)
-- ------------------------------------------------------------
create table public.archetypes (
  id serial primary key,
  code text unique not null,          -- z.B. 'strategic_architect'
  name_de text not null,              -- 'Der Strategische Architekt'
  short_trait text not null,          -- 'Struktur · Planung · Spielidee'
  kernmuster text not null,           -- Beschreibung des Kernmusters
  staerken text[] not null,           -- Array von Stärken
  risiken text[] not null,            -- Array von Risiken
  entwicklungshebel text[] not null,  -- Array von Entwicklungshebeln
  axis_profile jsonb not null,        -- { "struktur_intuition": 0.8, ... }
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 3. PRODUCTS — Die 5 Pakete (Stammdaten)
-- ------------------------------------------------------------
create table public.products (
  id serial primary key,
  slug text unique not null,          -- 'schnelltest', 'selbsttest', etc.
  name_de text not null,
  tier int not null,                  -- 1..5
  price_cents int not null,           -- 900 = 9 €
  stripe_price_id text,               -- später gefüllt
  description text,
  features jsonb not null default '[]'::jsonb,
  item_count int,                     -- Anzahl Items im Assessment
  duration_min int,                   -- Geschätzte Dauer in Minuten
  active boolean not null default true,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 4. ITEMS — Der Fragen-Pool
-- ------------------------------------------------------------
create table public.items (
  id serial primary key,
  code text unique not null,          -- z.B. 'A_identitaet_01'
  module_code text not null,          -- 'A' (Führungsidentität), 'B' (Kommunikation), ...
  submodule text,                     -- 'identitaet', 'kommunikation', ...
  format text not null check (format in (
    'likert_5', 'likert_7', 'forced_choice', 'szenario',
    'dilemma', 'spannungsfeld', 'gap_wichtig', 'gap_gelebt',
    'ranking', 'state'
  )),
  text_de text not null,              -- Der eigentliche Fragetext
  options jsonb,                      -- Bei forced_choice/szenario/dilemma: die Optionen
  axis_weights jsonb not null,        -- { "struktur_intuition": 1.0, "autoritaet_beteiligung": -0.5 }
  package_tiers int[] not null,       -- [1, 2, 3] = in welchen Paketen das Item erscheint
  reverse_scored boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

create index idx_items_module on public.items(module_code);
create index idx_items_format on public.items(format);
create index idx_items_package on public.items using gin(package_tiers);

-- ------------------------------------------------------------
-- 5. ASSESSMENTS — Eine Test-Session pro Kauf
-- ------------------------------------------------------------
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id int not null references public.products(id),
  status text not null default 'pending' check (status in (
    'pending', 'in_progress', 'completed', 'report_ready', 'archived'
  )),
  progress_pct int default 0,
  current_item_index int default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  -- Ergebnis-Felder (gefüllt bei Completion)
  primary_archetype_id int references public.archetypes(id),
  secondary_archetype_id int references public.archetypes(id),
  axis_scores jsonb,                  -- { "struktur_intuition": 0.72, ... }
  signature jsonb,                    -- Funktionale Signatur
  metadata jsonb default '{}'::jsonb
);

create index idx_assessments_user on public.assessments(user_id);
create index idx_assessments_status on public.assessments(status);

-- ------------------------------------------------------------
-- 6. ANSWERS — Antworten zu Items
-- ------------------------------------------------------------
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  item_id int not null references public.items(id),
  -- Je nach Format: eine dieser Spalten ist gefüllt
  value_numeric numeric,              -- Likert, Ranking, State
  value_choice text,                  -- Forced Choice, Szenario (die gewählte Option-Key)
  value_position numeric,             -- Spannungsfeld (0.0 bis 1.0)
  value_jsonb jsonb,                  -- Ranking-Ergebnisse, komplexere Antworten
  answered_at timestamptz default now(),
  unique(assessment_id, item_id)
);

create index idx_answers_assessment on public.answers(assessment_id);

-- ------------------------------------------------------------
-- 7. INVITATIONS — Anonyme Token für 360° Fremdeinschätzer + TeamCheck-Spieler
-- ------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  parent_assessment_id uuid not null references public.assessments(id) on delete cascade,
  token text unique not null,         -- Der Link-Token (z.B. 32 Zeichen random)
  invited_email text,                 -- nur für Versand, NICHT mit Antworten verknüpft
  invitation_type text not null check (invitation_type in ('fremdbild', 'spieler')),
  status text not null default 'pending' check (status in (
    'pending', 'sent', 'opened', 'completed', 'expired'
  )),
  expires_at timestamptz not null default (now() + interval '14 days'),
  sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index idx_invitations_token on public.invitations(token);
create index idx_invitations_parent on public.invitations(parent_assessment_id);

-- ------------------------------------------------------------
-- 8. INVITATION_ANSWERS — Antworten anonymer Einschätzer
-- (getrennt von 'answers', weil ohne User-Bezug)
-- ------------------------------------------------------------
create table public.invitation_answers (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  item_id int not null references public.items(id),
  value_numeric numeric,
  value_choice text,
  value_position numeric,
  value_jsonb jsonb,
  answered_at timestamptz default now(),
  unique(invitation_id, item_id)
);

-- ------------------------------------------------------------
-- 9. PURCHASES — Stripe-Käufe
-- ------------------------------------------------------------
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id int not null references public.products(id),
  assessment_id uuid references public.assessments(id),
  stripe_session_id text unique,
  stripe_payment_intent text,
  amount_cents int not null,
  currency text not null default 'eur',
  status text not null default 'pending' check (status in (
    'pending', 'paid', 'failed', 'refunded'
  )),
  paid_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index idx_purchases_user on public.purchases(user_id);
create index idx_purchases_stripe on public.purchases(stripe_session_id);

-- ------------------------------------------------------------
-- 10. REPORTS — PDF-Metadaten (die PDFs selbst in Supabase Storage)
-- ------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  storage_path text not null,         -- Pfad in Supabase Storage
  file_size_bytes int,
  pages int,
  generated_at timestamptz default now(),
  generation_model text,              -- 'claude-opus-4-7' o.ä.
  prompt_tokens int,
  completion_tokens int,
  metadata jsonb default '{}'::jsonb
);

create index idx_reports_assessment on public.reports(assessment_id);

-- ============================================================
-- ROW LEVEL SECURITY — niemand kann andere User-Daten sehen
-- ============================================================

-- Profiles
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Archetypes + Products + Items: öffentlich lesbar (Stammdaten)
alter table public.archetypes enable row level security;
create policy "archetypes_read" on public.archetypes for select using (true);

alter table public.products enable row level security;
create policy "products_read" on public.products for select using (active = true);

alter table public.items enable row level security;
create policy "items_read_auth" on public.items
  for select to authenticated using (active = true);

-- Assessments
alter table public.assessments enable row level security;
create policy "assessments_select_own" on public.assessments
  for select using (auth.uid() = user_id);
create policy "assessments_insert_own" on public.assessments
  for insert with check (auth.uid() = user_id);
create policy "assessments_update_own" on public.assessments
  for update using (auth.uid() = user_id);

-- Answers — nur über eigene Assessments
alter table public.answers enable row level security;
create policy "answers_select_own" on public.answers
  for select using (exists (
    select 1 from public.assessments a
    where a.id = answers.assessment_id and a.user_id = auth.uid()
  ));
create policy "answers_insert_own" on public.answers
  for insert with check (exists (
    select 1 from public.assessments a
    where a.id = answers.assessment_id and a.user_id = auth.uid()
  ));

-- Invitations — Trainer sieht seine Invitations, Token-Owner braucht keine RLS (service_role)
alter table public.invitations enable row level security;
create policy "invitations_select_owner" on public.invitations
  for select using (exists (
    select 1 from public.assessments a
    where a.id = invitations.parent_assessment_id and a.user_id = auth.uid()
  ));
create policy "invitations_insert_owner" on public.invitations
  for insert with check (exists (
    select 1 from public.assessments a
    where a.id = invitations.parent_assessment_id and a.user_id = auth.uid()
  ));

-- Invitation_Answers — via service_role eingefügt, Trainer sieht sie über Parent-Assessment
alter table public.invitation_answers enable row level security;
create policy "invitation_answers_select_owner" on public.invitation_answers
  for select using (exists (
    select 1 from public.invitations i
    join public.assessments a on a.id = i.parent_assessment_id
    where i.id = invitation_answers.invitation_id and a.user_id = auth.uid()
  ));

-- Purchases
alter table public.purchases enable row level security;
create policy "purchases_select_own" on public.purchases
  for select using (auth.uid() = user_id);

-- Reports
alter table public.reports enable row level security;
create policy "reports_select_own" on public.reports
  for select using (exists (
    select 1 from public.assessments a
    where a.id = reports.assessment_id and a.user_id = auth.uid()
  ));

-- ============================================================
-- SEED DATA — 5 Produkte
-- ============================================================
insert into public.products (slug, name_de, tier, price_cents, description, features, item_count, duration_min) values
('schnelltest', 'Schnelltest', 1, 900,
  'Erst einmal reinschnuppern',
  '["22 Items · 8 Minuten","Hybrid: Skalen + Forced Choice","Typ-Tendenz aus 12","3 Stärken · 3 Risiken","Sofort-Ergebnis online"]'::jsonb,
  22, 8),
('selbsttest', 'Selbsttest', 2, 2900,
  'Volles Selbstbild als Trainer',
  '["92 Premium-Items · 25 Min","6 diagnostische Module","Haupttyp + Sekundärtyp","Druckprofil & Entscheidungslogik","Blind Spots & Entwicklungshebel"]'::jsonb,
  92, 25),
('spiegel_360', '360° Spiegel', 3, 9900,
  'Selbstbild vs. Fremdbild vs. Ideal',
  '["Selbsttest + 5 Fremdeinschätzungen","Identity vs. Behavior Gap","Diskrepanz- & Streuungsanalyse","Funktionale Signatur","Premium-Report · 24 Seiten"]'::jsonb,
  92, 45),
('teamcheck', 'TeamCheck', 4, 29900,
  'Das komplette Team anonym',
  '["Trainer: 70 Items · 25 Min","Spieler: 40 Items · 12 Min · 100% anonym","Coach-Impact-Report","Teamklima & Untergruppen-Analyse","14-Tage-Maßnahmenplan"]'::jsonb,
  70, 25),
('saison_beratung', 'Saison & Beratung', 5, 149000,
  'Volle Begleitung über 6 Monate',
  '["Monatliche Team-Pulsmessung","Frühwarnsystem für Konflikte","Entwicklungsdynamik über Zeit","Quartals-Call mit Mindset-Coach","Persönliche Begleitung"]'::jsonb,
  null, null);

-- ============================================================
-- DONE — Phase 1 Schema ready
-- Next: Seed 12 Archetypen + Item-Pool
-- ============================================================
