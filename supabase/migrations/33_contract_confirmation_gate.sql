-- ============================================================
-- MIGRATION 33 — VERTRAGSBESTÄTIGUNGS-GATE + KAUF-VERKNÜPFUNG
-- ============================================================
--
-- Schließt vier rechtlich/technisch relevante Lücken vor dem offenen B2C-Verkauf:
--
--  (A) Unveränderbarer Vertrags-Snapshot auf der Purchase. Die zum Kaufzeitpunkt
--      geltenden Texte (AGB-Fassung, Zustimmungswortlaut, Widerrufsbelehrung)
--      werden eingefroren — ein Versionsname plus Link auf eine veränderbare
--      Seite genügt als Beweis nicht.
--
--  (B) Eindeutige Verknüpfung von Consent ↔ konkretem Kauf über
--      checkout_attempt_id. Verhindert, dass bei mehreren Käufen ein Consent
--      eines anderen Checkout-Vorgangs in der Bestätigung erscheint.
--
--  (C) Assessment-Status 'awaiting_contract_confirmation'. Das Assessment wird
--      erst freigeschaltet (→ 'pending'), nachdem die vollständige
--      Vertragsbestätigung zugestellt wurde.
--
--  (D) Echte Aktivitätszeit (last_activity_at) für Resume-Erinnerungen +
--      idempotente Meilenstein-Felder für Trainer-Benachrichtigungen.
--
-- Alles idempotent (IF NOT EXISTS / drop-add-constraint).
-- Hinweis: Ob die Bestätigung die rechtliche Schwelle erfüllt, ist anwaltlich
-- zu bewerten — die Migration stellt nur den Mechanismus bereit.
-- ============================================================

-- ------------------------------------------------------------
-- (A) + (B) purchases: Snapshot + Checkout-Verknüpfung
-- ------------------------------------------------------------
alter table public.purchases
  add column if not exists checkout_attempt_id   uuid,
  add column if not exists contract_snapshot     jsonb,
  add column if not exists agb_version           text,
  add column if not exists consent_version       text,
  add column if not exists consent_text_snapshot text;

create index if not exists purchases_checkout_attempt_idx
  on public.purchases (checkout_attempt_id);

-- ------------------------------------------------------------
-- (B) consent_records: an konkreten Checkout binden + Wortlaut sichern
-- ------------------------------------------------------------
alter table public.consent_records
  add column if not exists checkout_attempt_id uuid,
  add column if not exists consent_text        text;

create index if not exists consent_records_checkout_attempt_idx
  on public.consent_records (user_id, checkout_attempt_id);

-- ------------------------------------------------------------
-- (C) assessments: neuer Status 'awaiting_contract_confirmation'
-- ------------------------------------------------------------
-- Der Status-Check ist inline benannt (assessments_status_check). Idempotent
-- ersetzen: erst droppen (falls vorhanden), dann mit erweitertem Set neu setzen.
alter table public.assessments
  drop constraint if exists assessments_status_check;

alter table public.assessments
  add constraint assessments_status_check
  check (status in (
    'awaiting_contract_confirmation',
    'pending', 'in_progress', 'completed', 'report_ready', 'archived'
  ));

-- ------------------------------------------------------------
-- (D) assessments: Aktivitätszeit + idempotente Meilensteine
-- ------------------------------------------------------------
alter table public.assessments
  add column if not exists last_activity_at        timestamptz,
  add column if not exists first_response_notified_at timestamptz,
  add column if not exists threshold_notified_at      timestamptz;

-- Bestehende Zeilen mit echter Zeitachse backfilllen (statt now()), damit der
-- Resume-Reminder nicht fälschlich „gerade aktiv" annimmt.
update public.assessments
  set last_activity_at = coalesce(started_at, created_at)
  where last_activity_at is null;

-- Resume-Cron filtert künftig auf echte Inaktivität statt created_at.
create index if not exists assessments_resume_activity_idx
  on public.assessments (last_activity_at)
  where status in ('pending', 'in_progress') and resume_reminder_count = 0;

-- ============================================================
-- VERIFIKATION
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='purchases' and column_name='contract_snapshot'
  ) then
    raise exception 'purchases.contract_snapshot fehlt';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='purchases' and column_name='checkout_attempt_id'
  ) then
    raise exception 'purchases.checkout_attempt_id fehlt';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='consent_records' and column_name='checkout_attempt_id'
  ) then
    raise exception 'consent_records.checkout_attempt_id fehlt';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='assessments' and column_name='last_activity_at'
  ) then
    raise exception 'assessments.last_activity_at fehlt';
  end if;

  -- Neuer Status muss erlaubt sein.
  begin
    perform 1;
    if not exists (
      select 1 from pg_constraint
      where conname = 'assessments_status_check'
        and pg_get_constraintdef(oid) like '%awaiting_contract_confirmation%'
    ) then
      raise exception 'Status awaiting_contract_confirmation nicht im Check-Constraint';
    end if;
  end;

  raise notice 'Vertragsbestätigungs-Gate OK (Snapshot + checkout_attempt_id + awaiting-Status + last_activity_at + Meilensteine).';
end $$;
