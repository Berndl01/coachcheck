-- ============================================================
-- MIGRATION 29 — RLS-HÄRTUNG: ANSWERS, ITEMS, INVITATIONS (P0/P1)
-- ============================================================
--
-- BEFUND (v3_31-Audit, gegen echte DB bestätigt):
--   Drei weitere offene RLS-Policies derselben Klasse wie die (in 27 bereits
--   geschlossene) Paywall:
--
--   1) answers_insert_own / answers_update_own — ein eingeloggter Käufer konnte
--      Antworten direkt über die Supabase-REST-API schreiben/ändern und damit
--      die geprüfte answer-Route umgehen (Wertebereich, options-Keys,
--      player_item-Ausschluss, Status-/Rate-Limit). Auch NACH Abschluss
--      änderbar → Scores und Roh­antworten konnten auseinanderlaufen.
--   2) items_read_auth — jeder eingeloggte Nutzer konnte die KOMPLETTE items-
--      Tabelle lesen: alle Fragen aller Pakete inкl. axis_weights,
--      reverse_scored, Optionsgewichte. Der proprietäre Pool + die Scoring-
--      Systematik waren mit einem REST-Call abziehbar.
--   3) invitations_insert_owner — Einladungen direkt erzeugbar, unter Umgehung
--      der Server-Validierung (Tier, Typ, Limits).
--
--   Zusätzlich: get_items_for_assessment (security definer) prüfte das
--   Assessment-Eigentum nicht ausdrücklich.
--
-- FIX:
--   A) Browser raus aus dem Schreibpfad von answers und invitations
--      (Schreiben nur noch serverseitig via service_role nach Ownership-Check).
--   B) Direktes Lesen der items-Tabelle für den Browser entfernen
--      (Items kommen nur noch über die security-definer-RPCs).
--   C) get_items_for_assessment prüft jetzt auth.uid() = a.user_id.
--   D) Answer-Immutabilität nach Abschluss per Trigger (Defense-in-depth).
-- ============================================================

-- ------------------------------------------------------------
-- A) answers: Browser-Schreibpolicies entfernen (SELECT-eigene bleibt)
-- ------------------------------------------------------------
drop policy if exists answers_insert_own on public.answers;
drop policy if exists answers_update_own on public.answers;

-- invitations: Browser-INSERT entfernen (SELECT-eigene bleibt)
drop policy if exists invitations_insert_owner on public.invitations;

-- ------------------------------------------------------------
-- B) items: direktes Browser-Lesen entfernen
--    (RLS bleibt aktiv; ohne SELECT-Policy kann authenticated/anon NICHT mehr
--     direkt lesen. Die security-definer-RPCs liefern Items weiterhin.)
-- ------------------------------------------------------------
drop policy if exists items_read_auth on public.items;

-- ------------------------------------------------------------
-- C) get_items_for_assessment: Eigentums-Prüfung + player_item-Filter (aus 26)
-- ------------------------------------------------------------
create or replace function public.get_items_for_assessment(assessment_uuid uuid)
returns setof public.items
language sql
security definer
set search_path = public
as $$
  select i.*
  from public.items i
  join public.assessments a on a.id = assessment_uuid
  join public.products p on p.id = a.product_id
  where i.active = true
    and i.player_item = false
    and p.tier = any(i.package_tiers)
    and a.user_id = auth.uid()        -- NEU: nur eigenes Assessment
  order by i.module_code, i.id;
$$;

grant execute on function public.get_items_for_assessment(uuid) to authenticated;

-- ------------------------------------------------------------
-- D) Answer-Immutabilität: keine Schreibvorgänge mehr, wenn das Assessment
--    abgeschlossen ist (completed / report_ready / archived). Gilt auch für
--    service_role — garantiert, dass Rohantworten nach der Finalisierung
--    eingefroren sind (verhindert nachträgliche Score-Manipulation).
-- ------------------------------------------------------------
create or replace function public.block_answer_changes_when_finalized()
returns trigger language plpgsql as $$
declare
  a_status text;
  target_assessment uuid;
begin
  target_assessment := coalesce(new.assessment_id, old.assessment_id);
  select status into a_status from public.assessments where id = target_assessment;
  if a_status in ('completed','report_ready','archived') then
    raise exception 'Antworten sind nach Abschluss des Assessments unveränderbar (Status %).', a_status;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_answers_immutable_after_finalize on public.answers;
create trigger trg_answers_immutable_after_finalize
  before insert or update or delete on public.answers
  for each row execute function public.block_answer_changes_when_finalized();

-- ============================================================
-- VERIFIKATION (bricht die Migration ab, wenn ein Lockdown fehlt)
-- ============================================================
do $$
declare
  n int;
  c1 int; c2 int; c3 int; c4 int;
begin
  select count(*) into n from pg_policies
   where schemaname='public' and tablename='answers' and cmd in ('INSERT','UPDATE','DELETE');
  if n <> 0 then raise exception 'answers: % Browser-Schreibpolicy(s) verblieben.', n; end if;

  select count(*) into n from pg_policies
   where schemaname='public' and tablename='invitations' and cmd='INSERT';
  if n <> 0 then raise exception 'invitations: % INSERT-Policy(s) verblieben.', n; end if;

  select count(*) into n from pg_policies
   where schemaname='public' and tablename='items';
  if n <> 0 then raise exception 'items: % SELECT-Policy verblieben — Pool ist direkt lesbar.', n; end if;

  -- Item-Invariante (direkt aus items, da get_items_for_assessment jetzt auth.uid() braucht).
  select count(*) into c1 from items where active and not player_item and 1=any(package_tiers);
  select count(*) into c2 from items where active and not player_item and 2=any(package_tiers);
  select count(*) into c3 from items where active and not player_item and 3=any(package_tiers);
  select count(*) into c4 from items where active and not player_item and 4=any(package_tiers);
  if (c1,c2,c3,c4) <> (27,103,103,77) then
    raise exception 'Item-Invariante verletzt: % / % / % / % (erwartet 27/103/103/77).', c1,c2,c3,c4;
  end if;

  raise notice 'RLS-Härtung OK: answers/invitations Schreiben gesperrt, items nicht direkt lesbar, Item-Invariante 27/103/103/77.';
end $$;
