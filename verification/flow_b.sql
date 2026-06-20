-- ===== TEIL B: RLS-Isolation (simulierte auth.uid via GUC, Rolle authenticated) =====
do $$
declare owner uuid := '11111111-1111-1111-1111-111111111111';
        n_plans int; n_checkins int; n_fb int;
begin
  -- als OWNER
  perform set_config('role','authenticated',true);
  perform set_config('test.uid',owner::text,true);
  select count(*) into n_plans   from action_plans;
  select count(*) into n_checkins from action_checkins;
  select count(*) into n_fb       from result_feedback;
  if n_plans=0 or n_checkins=0 or n_fb=0 then
    raise exception 'FAIL: Owner sieht eigene Zeilen nicht (plans=% checkins=% fb=%)',n_plans,n_checkins,n_fb; end if;
  raise notice 'PASS  RLS: Owner sieht EIGENE Daten (plans=% checkins=% feedback=%)',n_plans,n_checkins,n_fb;
  perform set_config('role','postgres',true);
end $$;

do $$
declare attacker uuid := '22222222-2222-2222-2222-222222222222';
        n_plans int; n_checkins int; n_fb int;
begin
  -- als ANGREIFER (anderer eingeloggter Nutzer)
  perform set_config('role','authenticated',true);
  perform set_config('test.uid',attacker::text,true);
  select count(*) into n_plans   from action_plans;
  select count(*) into n_checkins from action_checkins;
  select count(*) into n_fb       from result_feedback;
  if n_plans<>0 or n_checkins<>0 or n_fb<>0 then
    raise exception 'FAIL: Angreifer sieht fremde Zeilen! (plans=% checkins=% fb=%)',n_plans,n_checkins,n_fb; end if;
  raise notice 'PASS  RLS: Angreifer sieht 0 fremde Daten in ALLEN drei Tabellen (plans=0 checkins=0 feedback=0)';
  perform set_config('role','postgres',true);
end $$;
