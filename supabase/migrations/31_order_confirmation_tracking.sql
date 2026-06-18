-- ============================================================
-- MIGRATION 31 — BESTELLBESTÄTIGUNG: VERSANDSTATUS + BESTELLNUMMER
-- ============================================================
--
-- Die Bestell-/Vertragsbestätigung (dauerhafter Datenträger, FAGG) wird nach
-- der Zahlung versendet. Damit der Versand protokolliert und bei Fehlern
-- nachholbar ist, bekommt purchases Status-Spalten. Zusätzlich eine stabile,
-- sequentielle Bestellnummer als Vertragsreferenz.
--
-- Hinweis: Ob die Bestätigung die rechtliche Schwelle erfüllt, ist anwaltlich
-- zu bewerten — die Migration stellt nur den Mechanismus bereit.
-- ============================================================

-- Versandstatus der Bestätigung
alter table public.purchases
  add column if not exists confirmation_sent_at    timestamptz,
  add column if not exists confirmation_attempts   integer not null default 0,
  add column if not exists confirmation_last_error text;

-- Sequentielle Bestellnummer (Vertragsreferenz). Start bei 1001, damit Nummern
-- nicht wie „erste Bestellung" wirken.
create sequence if not exists public.purchases_order_seq start 1001;

alter table public.purchases
  add column if not exists order_number bigint;

alter table public.purchases
  alter column order_number set default nextval('public.purchases_order_seq');

-- Bestehende Zeilen ohne Nummer nachziehen (idempotent).
update public.purchases
  set order_number = nextval('public.purchases_order_seq')
  where order_number is null;

-- Eindeutigkeit der Bestellnummer absichern.
create unique index if not exists purchases_order_number_key
  on public.purchases (order_number);

-- Schneller Zugriff für den Retry-Lauf: bezahlte Käufe ohne gesendete Bestätigung.
create index if not exists purchases_confirmation_pending_idx
  on public.purchases (paid_at)
  where confirmation_sent_at is null and status = 'paid';

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'purchases'
      and column_name = 'confirmation_sent_at'
  ) then
    raise exception 'purchases.confirmation_sent_at fehlt';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'purchases'
      and column_name = 'order_number'
  ) then
    raise exception 'purchases.order_number fehlt';
  end if;

  raise notice 'Bestellbestätigungs-Tracking OK (confirmation_sent_at/attempts/error + order_number).';
end $$;
