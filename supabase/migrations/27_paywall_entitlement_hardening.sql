-- ============================================================
-- MIGRATION 27 — PAYWALL & ENTITLEMENT HARDENING (P0)
-- ============================================================
--
-- BEFUND (v3_30-Audit, gegen echte DB als 'authenticated' bewiesen):
--   Ein eingeloggter Nutzer OHNE jeden Kauf konnte über die öffentliche
--   Supabase-REST-API:
--     (1) ein Premium-Assessment (z.B. Tier 3, 199 €) direkt anlegen,
--     (2) status='completed' + axis_scores + primary_archetype_id direkt
--         setzen (also /finalize komplett umgehen),
--   und anschließend die Report-Route auslösen (KI-/PDF-Kosten + Premium-PDF).
--
--   Ursache:
--     - RLS-Policy assessments_insert_own: with_check nur (auth.uid()=user_id)
--       → keine Kaufprüfung.
--     - RLS-Policy assessments_update_own: using (auth.uid()=user_id), KEIN
--       with_check → kritische Felder (status, scores, archetyp) frei schreibbar.
--     - assessments hatte keine Bindung an eine bezahlte purchase.
--     - Keine bezahlpflichtige Route prüfte die purchases-Tabelle.
--
-- FIX (drei Schichten):
--   A) assessments.purchase_id  → 1:1-Bindung an eine bezahlte purchase.
--   B) RLS-Lockdown: Browser darf assessments WEDER anlegen NOCH ändern.
--      Alle Schreibzugriffe laufen ausschließlich serverseitig über die
--      service_role (Webhook/Finalize/Answer/Report/Context) nach explizitem
--      Ownership-Check. ("Eine Autorität pro Aktion.")
--   C) Entitlement-Check in der Report-Route (Code): nur mit verknüpfter
--      purchase im Status 'paid'. (purchases sind NICHT vom Browser fälschbar —
--      nur SELECT-Policy, Schreiben ausschließlich service_role.)
--
-- Sicherheit der Kette: purchases kann der Browser nicht fälschen (nur
-- purchases_select_own). Da Migration 27 dem Browser auch das Anlegen/Ändern
-- von assessments entzieht, existiert jedes assessment nur noch, weil es
-- serverseitig nach echter Zahlung (Webhook) angelegt wurde.
-- ============================================================

-- ------------------------------------------------------------
-- A) 1:1-Bindung Assessment ↔ bezahlte Purchase
-- ------------------------------------------------------------
alter table public.assessments
  add column if not exists purchase_id uuid references public.purchases(id) on delete set null;

-- Backfill aus der bestehenden Gegenrichtung (purchases.assessment_id).
update public.assessments a
   set purchase_id = p.id
  from public.purchases p
 where p.assessment_id = a.id
   and a.purchase_id is null;

-- Höchstens EIN Assessment je Purchase (verhindert die Webhook-Race-Dublette).
create unique index if not exists uniq_assessments_purchase_id
  on public.assessments (purchase_id)
  where purchase_id is not null;

create index if not exists idx_assessments_purchase on public.assessments (purchase_id);

-- ------------------------------------------------------------
-- B) RLS-Lockdown: Browser raus aus dem Schreibpfad
-- ------------------------------------------------------------
-- assessments bleibt RLS-geschützt; SELECT (eigene) bleibt erhalten, damit
-- Dashboard/Runner/Ergebnis lesen können. INSERT/UPDATE für normale Nutzer
-- werden ENTFERNT — Schreiben nur noch über service_role (bypasst RLS).
drop policy if exists assessments_insert_own on public.assessments;
drop policy if exists assessments_update_own on public.assessments;
-- (assessments_select_own bleibt absichtlich bestehen.)

-- ============================================================
-- VERIFIKATION (bricht die Migration ab, wenn der Lockdown nicht greift)
-- ============================================================
do $$
declare
  n_write_policies int;
  n_select_policies int;
begin
  -- Es darf KEINE INSERT/UPDATE/DELETE-Policy mehr auf assessments geben.
  select count(*) into n_write_policies
    from pg_policies
   where schemaname='public' and tablename='assessments'
     and cmd in ('INSERT','UPDATE','DELETE');
  if n_write_policies <> 0 then
    raise exception
      'PAYWALL-LOCKDOWN UNVOLLSTÄNDIG: % Schreib-Policy(s) auf assessments verblieben. Browser darf assessments nicht anlegen/ändern.',
      n_write_policies;
  end if;

  -- SELECT-eigene muss bestehen bleiben (sonst sieht niemand seine Assessments).
  select count(*) into n_select_policies
    from pg_policies
   where schemaname='public' and tablename='assessments' and cmd='SELECT';
  if n_select_policies < 1 then
    raise exception 'RLS-FEHLER: SELECT-Policy auf assessments fehlt — Nutzer könnten eigene Assessments nicht mehr lesen.';
  end if;

  -- RLS muss aktiv sein.
  if not exists (
    select 1 from pg_class where oid='public.assessments'::regclass and relrowsecurity
  ) then
    raise exception 'RLS-FEHLER: row level security auf assessments ist deaktiviert.';
  end if;

  raise notice 'Paywall-Lockdown OK: keine Browser-Schreibpolicy auf assessments, SELECT-eigene erhalten, RLS aktiv.';
end $$;
