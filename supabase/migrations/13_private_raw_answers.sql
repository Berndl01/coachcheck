-- ============================================================
-- MIGRATION 13 — RAW RESPONSE PRIVACY LOCKDOWN (defensive v2)
-- ============================================================
--
-- Ziel: Trainer dürfen keine Einzelantworten von Spielern oder
-- 360°-Einschätzern lesen. Auch nicht über den Browser-Supabase-
-- Client, auch nicht durch Manipulation der App. Aggregationen
-- laufen ausschließlich über serverseitige API-Routes mit der
-- Service Role.
--
-- Diese Version ist DEFENSIV: Sie wirft keinen Fehler, falls
-- einzelne Funktionen in der Ziel-Datenbank fehlen (z. B. weil
-- frühere Migrationen nicht alle angewendet wurden, oder weil
-- die Funktion umbenannt wurde). Stattdessen werden nicht-
-- existierende Funktionen einfach übersprungen und am Ende
-- als NOTICE ausgegeben.
--
-- Hintergrund:
--
-- - `invitation_answers_select_owner` (01_schema.sql) erlaubte
--   eingeloggten Trainern, ihre eigenen Roh-Fremdbildantworten
--   per supabase-js zu lesen. Damit wäre die im Datenschutztext
--   versprochene Anonymität technisch nicht durchsetzbar gewesen.
--
-- - `pulse_responses_owner_select` (07_saison_monitor.sql) hatte
--   dasselbe Problem für Pulse-Antworten der Spieler.
--
-- - Mehrere SECURITY DEFINER RPCs umgehen RLS und waren für die
--   Rolle `authenticated` ausführbar. Ohne Ownership-Check in
--   der Funktion selbst sind sie ein Bypass — sobald jemand eine
--   fremde Assessment-ID kennt, kann er aggregierte Auswertungen
--   abrufen.
--
-- Konsequenz dieser Migration:
--
-- - Es gibt KEINE direkten SELECT-Rechte mehr für Trainer auf
--   `invitation_answers` und `pulse_responses`.
-- - Alle Aggregations-RPCs sind aus dem Browser nicht mehr
--   aufrufbar. Reports rufen sie nur noch serverseitig via
--   createAdminClient() (Service Role).
-- - Verifikation: nach Anwendung dieser Migration muss in der
--   Supabase Policy-Übersicht für `invitation_answers` und
--   `pulse_responses` KEINE Policy mit cmd='SELECT' und Rolle
--   'authenticated' mehr stehen.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Direktzugriff auf Rohantworten für Trainer entfernen
--    (DROP POLICY IF EXISTS ist nativ defensiv — kein Fehler,
--     falls die Policy schon weg ist.)
-- ------------------------------------------------------------
drop policy if exists "invitation_answers_select_owner" on public.invitation_answers;
drop policy if exists "pulse_responses_owner_select"   on public.pulse_responses;

-- ------------------------------------------------------------
-- 2) Aggregations- und Item-Resolver-RPCs aus dem Client entziehen
--
-- Wir verwenden to_regprocedure(), das NULL zurückgibt, wenn
-- die Funktion nicht existiert. Damit kann jede einzelne
-- Funktion unabhängig behandelt werden und das Skript bricht
-- nicht beim ersten fehlenden Namen ab.
-- ------------------------------------------------------------
do $$
declare
  -- (function signature, soll Service Role behalten?)
  target_signatures text[] := array[
    'public.get_fremdbild_aggregate(uuid)',
    'public.get_teamcheck_aggregate(uuid)',
    'public.compute_pulse_snapshot(uuid)',
    'public.detect_pulse_trends(uuid, uuid)',
    'public.get_items_for_invitation(text)'
  ];
  sig text;
  fn regprocedure;
  applied_count int := 0;
  missing_count int := 0;
begin
  foreach sig in array target_signatures
  loop
    fn := to_regprocedure(sig);
    if fn is null then
      raise notice '[Migration 13] SKIP — Funktion existiert nicht: %', sig;
      missing_count := missing_count + 1;
    else
      execute format('revoke execute on function %s from anon, authenticated, public', fn);
      execute format('grant execute on function %s to service_role', fn);
      raise notice '[Migration 13] OK   — revoked & granted: %', fn;
      applied_count := applied_count + 1;
    end if;
  end loop;

  raise notice '[Migration 13] Zusammenfassung: % Funktionen abgesichert, % fehlten (übersprungen).',
    applied_count, missing_count;
end $$;

-- ------------------------------------------------------------
-- 3) Verifikation: keine SELECT-Policy auf invitation_answers /
--    pulse_responses darf mehr für `authenticated` existieren.
-- ------------------------------------------------------------
do $$
declare
  bad_count int;
begin
  select count(*)
    into bad_count
    from pg_policies
   where schemaname = 'public'
     and tablename in ('invitation_answers', 'pulse_responses')
     and cmd = 'SELECT'
     and 'authenticated' = any (roles);

  if bad_count > 0 then
    raise exception '[Migration 13] INCOMPLETE: % SELECT-Policy für authenticated besteht noch auf invitation_answers/pulse_responses', bad_count;
  end if;

  raise notice '[Migration 13] Policy-Verifikation OK — keine SELECT-Policy für authenticated mehr auf invitation_answers/pulse_responses.';
end $$;

-- ============================================================
-- DONE — Trainer haben technisch keinen Zugriff mehr auf
-- einzelne Roh-Antworten. Reports/Aggregationen funktionieren
-- weiter über die API-Routen (Service Role).
--
-- Falls oben Funktionen als SKIP gemeldet wurden:
-- Das ist kein Fehler. Es heißt nur, dass die jeweilige Funktion
-- in dieser Datenbank gar nicht (mehr) existiert — Trainer
-- können sie also auch nicht aufrufen. Sollte die Funktion
-- später neu erstellt werden, MUSS in der erstellenden Migration
-- daran gedacht werden, sie nur für `service_role` freizugeben.
-- ============================================================
