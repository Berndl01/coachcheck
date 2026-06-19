-- ============================================================
-- MIGRATION 37 — TEILBARE PROFILKARTE (Share-Token)
-- ============================================================
--
-- Ermöglicht den "sozialen Moment": der Trainer kann eine kompakte Profilkarte
-- (Archetyp, Kernsatz, Stärken, Bedienungsanleitung) über einen unrätselbaren
-- Token öffentlich teilen — OHNE Login, OHNE Zugriff auf den vollen Report,
-- Antworten, 360°-Daten oder personenbezogene Daten.
--
-- Sicherheit:
--   • share_token ist eine zufällige UUID (nicht erratbar).
--   • share_enabled muss aktiv gesetzt sein (Opt-in durch den Eigentümer).
--   • Die öffentliche Route liest NUR über die service_role und gibt
--     ausschließlich freigegebene, nicht-sensible Kartenfelder zurück.
--   • anon erhält KEINEN direkten Tabellenzugriff (keine RLS-Lockerung).
--
-- Idempotent.
-- ============================================================

alter table public.assessments
  add column if not exists share_token   uuid,
  add column if not exists share_enabled boolean not null default false,
  add column if not exists shared_at      timestamptz;

-- Token eindeutig (nur wenn gesetzt) → schneller Lookup der öffentlichen Karte.
create unique index if not exists assessments_share_token_unique
  on public.assessments (share_token)
  where share_token is not null;

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='assessments' and column_name='share_token'
  ) then
    raise exception 'assessments.share_token fehlt';
  end if;
  if not exists (
    select 1 from pg_indexes
    where schemaname='public' and indexname='assessments_share_token_unique'
  ) then
    raise exception 'assessments_share_token_unique fehlt';
  end if;
  raise notice 'Migration 37 OK (teilbare Profilkarte / Share-Token).';
end $$;
