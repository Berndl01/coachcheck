-- 24_profiles_insert_policy.sql
-- ============================================================
-- FIX: "new row violates row-level security policy for table profiles"
-- ============================================================
--
-- Ursache: profiles hatte nur SELECT- und UPDATE-Policies (Migration 01).
-- Der Profil-Setup-Code nutzt upsert(onConflict:'id'). Wenn die Profilzeile
-- noch nicht existiert (z. B. User vor handle_new_user-Trigger registriert,
-- oder Trigger lief nicht), loest upsert ein INSERT aus — und RLS blockt das,
-- weil keine INSERT-Policy existiert.
--
-- Loesung: INSERT-Policy ergaenzen. with check (auth.uid() = id) stellt sicher,
-- dass ein User ausschliesslich SEIN EIGENES Profil anlegen kann — niemand
-- kann fremde Profilzeilen erzeugen.
--
-- Idempotent: drop policy if exists + create.

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Sicherheitsnetz: Falls einzelne bestehende User noch KEINE Profilzeile haben
-- (Trigger lief nicht), legen wir sie hier nach. So scheitert der erste
-- Profil-Setup nicht am fehlenden Datensatz. SECURITY DEFINER der Funktion
-- umgeht RLS bewusst nur fuer dieses einmalige Nachziehen.
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ============================================================
-- HÄRTUNG: for-all-Policies der Saison-Tabellen brauchen explizites
-- "with check" — sonst kann INSERT in Randfällen scheitern (Postgres
-- faellt bei INSERT sonst auf "using" zurueck, was bei neuen Zeilen
-- nicht zuverlaessig greift). Betrifft seasons / pulse_cycles /
-- pulse_invitations (alle User-Client-Writes im Saison-/TeamCheck-Feature).
-- ============================================================

drop policy if exists "seasons_owner_all" on public.seasons;
create policy "seasons_owner_all" on public.seasons
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "pulse_cycles_owner" on public.pulse_cycles;
create policy "pulse_cycles_owner" on public.pulse_cycles
  for all
  using (exists (select 1 from public.seasons s where s.id = pulse_cycles.season_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.seasons s where s.id = pulse_cycles.season_id and s.user_id = auth.uid()));

