-- ============================================================
-- MIGRATION 35 — TRANSAKTIONALE FREISCHALTUNG + WIDERRUF-RETRY
-- ============================================================
--
-- Schließt die im v3_35-Review verbliebenen Verkaufsblocker auf DB-Ebene:
--
--  (A) finalize_order_confirmation(): EINE transaktionale Funktion, die nach
--      erfolgreichem Versand der Vertragsbestätigung GEMEINSAM
--        - purchases.confirmation_sent_at setzt (idempotent, coalesce) und
--        - das gesperrte Assessment 'awaiting_contract_confirmation' → 'pending'
--          freischaltet.
--      Beide Änderungen liegen im selben Funktionskörper = eine Transaktion:
--      entweder beide oder keine. Damit kann weder ein zahlender Kunde dauerhaft
--      gesperrt bleiben (Versandstatus gesetzt, aber Assessment gesperrt) noch
--      ein freigeschaltetes Assessment ohne Versandmarker existieren.
--
--  (B) purchases: Inhaltshash + Zeitstempel des beim Kauf erzeugten, dauerhaften
--      Vertrags-PDF (contract_pdf_sha256, contract_pdf_generated_at) — Beleg,
--      dass der genaue Vertragsinhalt unveränderbar gespeichert wurde.
--
--  (C) withdrawals: Retry-Felder für die Eingangsbestätigung
--      (confirmation_attempts, confirmation_last_error, confirmation_next_retry_at)
--      plus declaration_full (vollständiger Wortlaut der protokollierten
--      Widerrufserklärung). Eine fehlgeschlagene Eingangsbestätigung wird damit
--      nachweisbar nachgeholt statt still verloren.
--
-- Alles idempotent (IF NOT EXISTS / CREATE OR REPLACE / to_regprocedure-Revoke).
-- Hinweis: Ob die Bestätigung die rechtliche Schwelle erfüllt, ist anwaltlich zu
-- bewerten — die Migration stellt nur den Mechanismus bereit.
-- ============================================================

-- ------------------------------------------------------------
-- (B) purchases: Vertrags-PDF-Nachweis
-- ------------------------------------------------------------
alter table public.purchases
  add column if not exists contract_pdf_sha256       text,
  add column if not exists contract_pdf_generated_at timestamptz;

-- ------------------------------------------------------------
-- (C) withdrawals: Retry der Eingangsbestätigung + voller Erklärungswortlaut
-- ------------------------------------------------------------
alter table public.withdrawals
  add column if not exists confirmation_attempts     integer not null default 0,
  add column if not exists confirmation_last_error   text,
  add column if not exists confirmation_next_retry_at timestamptz,
  add column if not exists declaration_full          text;

-- Retry-Cron filtert auf offene, fällige Eingangsbestätigungen.
create index if not exists withdrawals_confirm_retry_idx
  on public.withdrawals (confirmation_next_retry_at)
  where confirmation_sent_at is null;

-- ------------------------------------------------------------
-- (A) Transaktionale Finalisierung: Versandmarker + Freischaltung
-- ------------------------------------------------------------
-- SECURITY DEFINER, damit ausschließlich die Service-Role-API sie nutzt; Rechte
-- werden unten für anon/authenticated entzogen. Beide Updates im selben Körper
-- ⇒ eine Transaktion (atomar). coalesce schützt den ersten gesetzten Zeitstempel
-- gegen Überschreiben bei einem späteren (idempotenten) Aufruf.
create or replace function public.finalize_order_confirmation(
  p_purchase_id   uuid,
  p_assessment_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.purchases
     set confirmation_sent_at   = coalesce(confirmation_sent_at, now()),
         confirmation_attempts  = coalesce(confirmation_attempts, 0) + 1,
         confirmation_last_error = null
   where id = p_purchase_id;

  -- Leistungsbeginn erst JETZT: nur den gesperrten Zustand anfassen
  -- (idempotent, race-sicher). Bereits freigeschaltete Assessments bleiben.
  update public.assessments
     set status = 'pending'
   where id = p_assessment_id
     and status = 'awaiting_contract_confirmation';
end;
$$;

-- Rechte defensiv setzen (idempotent über to_regprocedure).
do $$
begin
  if to_regprocedure('public.finalize_order_confirmation(uuid, uuid)') is not null then
    revoke all on function public.finalize_order_confirmation(uuid, uuid) from public;
    revoke all on function public.finalize_order_confirmation(uuid, uuid) from anon;
    revoke all on function public.finalize_order_confirmation(uuid, uuid) from authenticated;
    grant execute on function public.finalize_order_confirmation(uuid, uuid) to service_role;
  end if;
end $$;

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if to_regprocedure('public.finalize_order_confirmation(uuid, uuid)') is null then
    raise exception 'finalize_order_confirmation fehlt';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='purchases' and column_name='contract_pdf_sha256'
  ) then
    raise exception 'purchases.contract_pdf_sha256 fehlt';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='withdrawals' and column_name='confirmation_next_retry_at'
  ) then
    raise exception 'withdrawals.confirmation_next_retry_at fehlt';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='withdrawals' and column_name='declaration_full'
  ) then
    raise exception 'withdrawals.declaration_full fehlt';
  end if;

  raise notice 'Migration 35 OK (finalize_order_confirmation + Vertrags-PDF-Hash + Widerruf-Retry).';
end $$;
