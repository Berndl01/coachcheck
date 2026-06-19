-- ============================================================
-- MIGRATION 36 — AKTIVIERUNGSSPERRE AUF DB-EBENE + FINALIZE-HÄRTUNG
-- ============================================================
--
-- BEFUND (v3_36-Audit): Die Vertragsbestätigungs-Sperre war nur auf der E-Mail-/
-- Zahlungs-Ebene scharf. Die Assessment-APIs (answer/finalize/context) und die
-- Item-RPC prüften die Freischaltung NICHT — ein eingeloggter Käufer konnte die
-- Sperre per direktem API-Aufruf umgehen. Außerdem prüfte
-- finalize_order_confirmation() weder die Zuordnung Purchase↔Assessment noch
-- Snapshot-/Verknüpfungs-Fehler.
--
-- DIESE MIGRATION (Verteidigung auf DB-Ebene, zusätzlich zu den API-Checks):
--   (A) finalize_order_confirmation() härten: Zuordnung prüfen + Freigabe-Flag.
--   (B) get_items_for_assessment() nur für freigeschaltete Assessments.
--   (C) Trigger: ein Assessment darf 'awaiting_contract_confirmation' NUR über
--       die freigegebene Finalisierung verlassen (einzige Autorität).
--   (D) Eindeutigkeit der Checkout-Consents per Unique-Index.
--   (E) Eskalations-Spalten für hängende Bestätigungen/Widerrufe.
--
-- Idempotent (create or replace / if not exists / drop+create).
-- ============================================================

-- ------------------------------------------------------------
-- (E) Eskalations-Marker (einmalige Betreiber-Meldung bei Hängern)
-- ------------------------------------------------------------
alter table public.purchases
  add column if not exists admin_escalated_at timestamptz;
alter table public.withdrawals
  add column if not exists admin_escalated_at timestamptz;

-- ------------------------------------------------------------
-- (C) Contract-Gate-Trigger: gesperrten Zustand nur kontrolliert verlassen
-- ------------------------------------------------------------
-- Verhindert, dass IRGENDEIN Prozess ein Assessment aus
-- 'awaiting_contract_confirmation' auf einen anderen Status setzt, außer die
-- Finalisierung hat das transaktionslokale Flag app.finalizing='1' gesetzt.
-- So bleibt die Freischaltung die einzige Autorität — selbst wenn künftig eine
-- Route den Status-Check vergisst.
create or replace function public.enforce_contract_gate()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'awaiting_contract_confirmation'
     and new.status is distinct from old.status
     and coalesce(current_setting('app.finalizing', true), '') <> '1' then
    raise exception
      'Assessment % ist noch nicht freigeschaltet (Vertragsbestaetigung ausstehend).', old.id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_contract_gate on public.assessments;
create trigger trg_enforce_contract_gate
  before update on public.assessments
  for each row
  execute function public.enforce_contract_gate();

-- ------------------------------------------------------------
-- (A) finalize_order_confirmation() — Zuordnung + Freigabe-Flag
-- ------------------------------------------------------------
-- Setzt Versandmarker UND schaltet das Assessment in EINER Transaktion frei.
-- NEU: prüft, dass das Assessment tatsächlich zu dieser Purchase gehört (sonst
-- Exception → kein „bestätigt", obwohl nichts freigeschaltet wurde), und setzt
-- das Freigabe-Flag für den Contract-Gate-Trigger.
create or replace function public.finalize_order_confirmation(
  p_purchase_id   uuid,
  p_assessment_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_belongs boolean;
begin
  -- (1) Zuordnung Purchase↔Assessment verifizieren.
  select exists(
    select 1
    from public.assessments a
    join public.purchases p on p.id = a.purchase_id
    where a.id = p_assessment_id
      and p.id = p_purchase_id
  ) into v_belongs;

  if not v_belongs then
    raise exception
      'finalize_order_confirmation: Assessment % gehoert nicht zu Purchase %',
      p_assessment_id, p_purchase_id;
  end if;

  -- (2) Freigabe-Flag (nur in dieser Transaktion) für den Contract-Gate-Trigger.
  perform set_config('app.finalizing', '1', true);

  -- (3) Versandmarker (idempotent; coalesce schützt den ersten Zeitstempel).
  update public.purchases
     set confirmation_sent_at    = coalesce(confirmation_sent_at, now()),
         confirmation_attempts   = coalesce(confirmation_attempts, 0) + 1,
         confirmation_last_error = null
   where id = p_purchase_id;

  -- (4) Leistungsbeginn: nur den gesperrten Zustand freischalten (idempotent,
  --     race-sicher). Bereits freigeschaltete Assessments bleiben unverändert —
  --     0 betroffene Zeilen sind hier KEIN Fehler.
  update public.assessments
     set status = 'pending'
   where id = p_assessment_id
     and status = 'awaiting_contract_confirmation';
end;
$$;

do $$
begin
  if to_regprocedure('public.finalize_order_confirmation(uuid, uuid)') is not null then
    revoke all on function public.finalize_order_confirmation(uuid, uuid) from public;
    revoke all on function public.finalize_order_confirmation(uuid, uuid) from anon;
    revoke all on function public.finalize_order_confirmation(uuid, uuid) from authenticated;
    grant execute on function public.finalize_order_confirmation(uuid, uuid) to service_role;
  end if;
end $$;

-- ------------------------------------------------------------
-- (B) get_items_for_assessment() — nur freigeschaltete Assessments
-- ------------------------------------------------------------
-- Gleicher Rückgabetyp wie Migration 30 → create or replace genügt. Zusätzliche
-- Bedingung: a.status in ('pending','in_progress'). Damit liefert die RPC für
-- ein gesperrtes ('awaiting_contract_confirmation') oder abgeschlossenes
-- Assessment KEINE Items mehr — der Fragebogen ist vor Freischaltung nicht
-- abrufbar.
create or replace function public.get_items_for_assessment(assessment_uuid uuid)
returns table (
  id integer,
  code text,
  module_code text,
  submodule text,
  format text,
  text_de text,
  options jsonb
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.code, i.module_code, i.submodule, i.format, i.text_de,
         public.strip_option_weights(i.options) as options
  from public.items i
  join public.assessments a on a.id = assessment_uuid
  join public.products p on p.id = a.product_id
  where i.active = true
    and i.player_item = false
    and p.tier = any(i.package_tiers)
    and a.user_id = auth.uid()
    and a.status in ('pending', 'in_progress')
  order by i.module_code, i.id;
$$;

grant execute on function public.get_items_for_assessment(uuid) to authenticated;

-- ------------------------------------------------------------
-- (D) Eindeutigkeit der Checkout-Consents
-- ------------------------------------------------------------
-- Genau ein Consent-Datensatz je (User, Checkout-Vorgang, Consent-Typ). Schließt
-- Duplikate aus und macht die strikte 4-von-4-Prüfung eindeutig.
create unique index if not exists consent_checkout_type_unique
  on public.consent_records (user_id, checkout_attempt_id, consent_type)
  where checkout_attempt_id is not null;

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if to_regprocedure('public.finalize_order_confirmation(uuid, uuid)') is null then
    raise exception 'finalize_order_confirmation fehlt';
  end if;
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_enforce_contract_gate'
  ) then
    raise exception 'trg_enforce_contract_gate fehlt';
  end if;
  if to_regprocedure('public.get_items_for_assessment(uuid)') is null then
    raise exception 'get_items_for_assessment fehlt';
  end if;
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'consent_checkout_type_unique'
  ) then
    raise exception 'consent_checkout_type_unique fehlt';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='purchases' and column_name='admin_escalated_at'
  ) then
    raise exception 'purchases.admin_escalated_at fehlt';
  end if;
  raise notice 'Migration 36 OK (Aktivierungssperre DB-seitig + finalize-Härtung + consent-unique).';
end $$;
