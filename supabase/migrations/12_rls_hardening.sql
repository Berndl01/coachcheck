-- ============================================================
-- MIGRATION 12 — RLS HARDENING (PRE-SALE SECURITY FIX)
-- ============================================================
--
-- Problem vor diesem Fix:
--
-- 1) `invitations_anon_read_by_token`        using (true)
-- 2) `invitations_anon_update`               using (true)
-- 3) `invitation_answers_anon_insert`        with check (...)
-- 4) `pulse_responses_anon_insert`           with check (...)
-- 5) `pulse_invitations_anon_read`           using (true)
--
-- Effekt: Anonyme Nutzer konnten direkt über den public Supabase
-- Client auf sensible Tabellen schreiben/lesen. Token-Schutz war
-- nur per Frontend-Convention da, nicht serverseitig erzwungen.
-- Rate-Limit, Expiry-Check, Status-Check liefen alle im Browser.
--
-- Fix: alle anon-Policies entfernen. Token-basierte Operationen
-- laufen ab sofort ausschließlich über serverseitige API-Routes
-- mit Service Role (siehe /api/invitations/[token]/* und
-- /api/pulse/[token]/submit).
--
-- Zusätzlich:
-- 6) `answers_update_own` ergänzt — der Runner nutzt upsert, ohne
--    Update-Policy schlägt das fehl, sobald jemand zurückgeht.
-- 7) Cleanup von potenziell vorhandenen alten Insert-Policies, die
--    durch Service Role obsolet sind.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Anonyme Policies auf invitations/invitation_answers entfernen
-- ------------------------------------------------------------
drop policy if exists "invitations_anon_read_by_token" on public.invitations;
drop policy if exists "invitations_anon_update"        on public.invitations;
drop policy if exists "invitation_answers_anon_insert" on public.invitation_answers;

-- ------------------------------------------------------------
-- 2. Anonyme Policies auf pulse_* entfernen
-- ------------------------------------------------------------
drop policy if exists "pulse_responses_anon_insert" on public.pulse_responses;
drop policy if exists "pulse_invitations_anon_read" on public.pulse_invitations;

-- ------------------------------------------------------------
-- 3. Update-Policy für answers (Upsert-Path absichern)
-- ------------------------------------------------------------
-- Der Assessment-Runner nutzt
--   .from('answers').upsert(..., { onConflict: 'assessment_id,item_id' })
-- Wenn ein Nutzer zurückgeht und eine Antwort ändert, läuft das in
-- einen UPDATE — ohne diese Policy blockt RLS still.
drop policy if exists "answers_update_own" on public.answers;
create policy "answers_update_own" on public.answers
  for update
  using (exists (
    select 1 from public.assessments a
    where a.id = answers.assessment_id and a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.assessments a
    where a.id = answers.assessment_id and a.user_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- 4. Sanity: Service Role bypasst RLS ohnehin — wir müssen also
--    KEINE neuen Policies für anonyme Token-User schaffen. Die
--    API-Routes in /api/invitations/[token]/* und
--    /api/pulse/[token]/* nutzen createAdminClient() und führen
--    folgende Checks serverseitig durch:
--      - Token existiert
--      - status nicht in ('completed','expired','revoked')
--      - expires_at / closes_at noch in der Zukunft
--      - Rate Limit (in-memory pro Token)
--      - Item gehört zum richtigen Assessment / Cycle
-- ------------------------------------------------------------

-- ============================================================
-- DONE — Browser hat keine Tabellenrechte mehr auf token-basierte
-- Daten. Alle anonymen Operationen laufen über API-Routes.
-- ============================================================
