-- ============================================================
-- MIGRATION 34 — ONLINE-WIDERRUFSFUNKTION: EINGANGSPROTOKOLL
-- ============================================================
--
-- Seit 19.06.2026 müssen für elektronisch abgeschlossene B2C-Fernabsatzverträge
-- leicht zugängliche Online-Widerrufsfunktionen vorhanden sein, mit
-- Eingangsbestätigung auf einem dauerhaften Datenträger.
--
-- Diese Tabelle protokolliert eingehende Widerrufserklärungen mit
-- Eingangszeitpunkt (Fristwahrung). Schreiben/Lesen ausschließlich über
-- Service-Role (API-Route + Admin) — kein Client-Zugriff.
--
-- Hinweis: OB ein konkreter Widerruf wirksam ist (z. B. trotz Verzicht bei
-- digitalen Inhalten), ist eine separate rechtliche/inhaltliche Prüfung. Diese
-- Tabelle erfasst den EINGANG und bestätigt ihn — sie entscheidet nicht.
-- ============================================================

create table if not exists public.withdrawals (
  id            uuid primary key default gen_random_uuid(),
  -- Eingangszeitpunkt = fristwahrend relevanter Zeitstempel.
  received_at   timestamptz not null default now(),
  -- Optionale Zuordnung, wenn Kauf eindeutig auffindbar war.
  purchase_id   uuid references public.purchases(id) on delete set null,
  user_id       uuid references auth.users(id) on delete set null,
  -- Vom Kunden angegebene Identifikation.
  full_name     text not null,
  email         text not null,
  order_ref     text,                       -- Bestellnummer / Vertragsreferenz (frei eingegeben)
  product_hint  text,                       -- optionale Produktangabe
  declaration   text,                       -- optionaler Freitext der Erklärung
  -- Nachweis-Metadaten (gehasht, DSGVO-datensparsam).
  ip_hash       text,
  user_agent_hash text,
  -- Bearbeitungsstatus (manuell/rechtlich, nicht automatisch entschieden).
  status        text not null default 'received'
                  check (status in ('received', 'acknowledged', 'granted', 'rejected')),
  -- Versand der Eingangsbestätigung (dauerhafter Datenträger).
  confirmation_sent_at timestamptz,
  admin_notified_at    timestamptz,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists withdrawals_received_idx on public.withdrawals (received_at desc);
create index if not exists withdrawals_purchase_idx on public.withdrawals (purchase_id);
create index if not exists withdrawals_email_idx    on public.withdrawals (lower(email));

alter table public.withdrawals enable row level security;
-- Kein Policy → ausschließlich Service-Role (Widerruf-API + Admin).

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='withdrawals'
  ) then
    raise exception 'Tabelle withdrawals fehlt';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='withdrawals' and column_name='received_at'
  ) then
    raise exception 'withdrawals.received_at fehlt';
  end if;
  raise notice 'Online-Widerrufsfunktion: Eingangsprotokoll (withdrawals) OK.';
end $$;
