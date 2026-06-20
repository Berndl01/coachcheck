\set ON_ERROR_STOP on
-- ===== SETUP: 2 Nutzer + Assessment (als Superuser = service_role-Pfad) =====
insert into auth.users (id,email) values ('11111111-1111-1111-1111-111111111111','owner@test.cc') on conflict do nothing;
insert into auth.users (id,email) values ('22222222-2222-2222-2222-222222222222','attacker@test.cc') on conflict do nothing;
-- Assessment des Owners auf erstem Produkt
insert into assessments (id,user_id,product_id,status)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111',(select id from products order by tier limit 1),'completed')
  on conflict do nothing;

do $$
declare aid uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        owner uuid := '11111111-1111-1111-1111-111111111111';
        ok boolean;
begin
  -- ========== FEEDBACK #1: Recognition-Feedback ==========
  insert into result_feedback (assessment_id,user_id,recognition,most_helpful)
    values (aid,owner,8,'Die Bedienungsanleitung');
  raise notice 'PASS  Feedback: gültige Rückmeldung (recognition=8) eingefügt';

  -- CHECK recognition>10 muss scheitern
  ok:=false; begin insert into result_feedback (assessment_id,user_id,recognition) values (gen_random_uuid(),owner,11);
  exception when check_violation then ok:=true; end;
  if not ok then raise exception 'FAIL: recognition=11 wurde akzeptiert!'; end if;
  raise notice 'PASS  Feedback: recognition=11 korrekt blockiert (CHECK 0-10)';

  -- CHECK recognition<0 muss scheitern
  ok:=false; begin insert into result_feedback (assessment_id,user_id,recognition) values (gen_random_uuid(),owner,-1);
  exception when check_violation then ok:=true; end;
  if not ok then raise exception 'FAIL: recognition=-1 akzeptiert!'; end if;
  raise notice 'PASS  Feedback: recognition=-1 korrekt blockiert';

  -- UNIQUE: zweites Feedback fürs selbe Assessment muss scheitern
  ok:=false; begin insert into result_feedback (assessment_id,user_id,recognition) values (aid,owner,5);
  exception when unique_violation then ok:=true; end;
  if not ok then raise exception 'FAIL: zweites Feedback fürs selbe Assessment akzeptiert!'; end if;
  raise notice 'PASS  Feedback: zweite Rückmeldung pro Assessment korrekt blockiert (UNIQUE)';

  -- most_helpful >80 Zeichen muss scheitern
  ok:=false; begin insert into result_feedback (assessment_id,user_id,recognition,most_helpful) values (gen_random_uuid(),owner,5,repeat('x',81));
  exception when check_violation then ok:=true; end;
  if not ok then raise exception 'FAIL: most_helpful >80 akzeptiert!'; end if;
  raise notice 'PASS  Feedback: most_helpful >80 Zeichen korrekt blockiert';

  -- ========== ABLAUF: 7-Tage-Fokus setzen ==========
  insert into action_plans (id,user_id,assessment_id,title,action,target_days,status)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',owner,aid,'Klarer Ton','Vor jeder Ansprache 3 Sekunden Pause',7,'active');
  raise notice 'PASS  Fokus: aktiver Plan angelegt';

  -- Partial-Unique: zweiter AKTIVER Plan (selber user+assessment) muss scheitern
  ok:=false; begin insert into action_plans (user_id,assessment_id,title,action,target_days,status)
    values (owner,aid,'Zweiter','Noch ein Fokus',7,'active');
  exception when unique_violation then ok:=true; end;
  if not ok then raise exception 'FAIL: zweiter aktiver Fokus akzeptiert!'; end if;
  raise notice 'PASS  Fokus: zweiter AKTIVER Fokus korrekt blockiert (partial unique)';

  -- target_days außerhalb 1-60 muss scheitern
  ok:=false; begin insert into action_plans (user_id,assessment_id,title,action,target_days,status) values (owner,gen_random_uuid(),'T','A',61,'active');
  exception when check_violation then ok:=true; end;
  if not ok then raise exception 'FAIL: target_days=61 akzeptiert!'; end if;
  raise notice 'PASS  Fokus: target_days=61 korrekt blockiert (CHECK 1-60)';

  -- ungültiger status muss scheitern
  ok:=false; begin insert into action_plans (user_id,assessment_id,title,action,target_days,status) values (owner,gen_random_uuid(),'T','A',7,'bogus');
  exception when check_violation then ok:=true; end;
  if not ok then raise exception 'FAIL: status=bogus akzeptiert!'; end if;
  raise notice 'PASS  Fokus: ungültiger Status korrekt blockiert';

  -- Archivieren -> neuer aktiver Plan erlaubt (Route-Strategie)
  update action_plans set status='archived' where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  insert into action_plans (id,user_id,assessment_id,title,action,target_days,status)
    values ('cccccccc-cccc-cccc-cccc-cccccccccccc',owner,aid,'Neuer Fokus','Anderer Hebel',14,'active');
  raise notice 'PASS  Fokus: nach Archivierung neuer aktiver Fokus erlaubt';

  -- ========== FEEDBACK #2: Check-in-Loop ==========
  insert into action_checkins (plan_id,user_id,checkin_date) values ('cccccccc-cccc-cccc-cccc-cccccccccccc',owner,current_date);
  raise notice 'PASS  Check-in: heutiger Check-in gesetzt';

  -- UNIQUE: zweiter Check-in selber Tag muss scheitern
  ok:=false; begin insert into action_checkins (plan_id,user_id,checkin_date) values ('cccccccc-cccc-cccc-cccc-cccccccccccc',owner,current_date);
  exception when unique_violation then ok:=true; end;
  if not ok then raise exception 'FAIL: zweiter Check-in am selben Tag akzeptiert!'; end if;
  raise notice 'PASS  Check-in: zweiter Check-in am selben Tag korrekt blockiert (UNIQUE plan+date)';

  -- anderer Tag erlaubt
  insert into action_checkins (plan_id,user_id,checkin_date) values ('cccccccc-cccc-cccc-cccc-cccccccccccc',owner,current_date-1);
  raise notice 'PASS  Check-in: anderer Tag erlaubt';

  -- ========== ABLAUF: Abschluss-Würdigung ==========
  update action_plans set status='completed',completed_at=now() where id='cccccccc-cccc-cccc-cccc-cccccccccccc';
  -- abgeschlossener Plan blockiert KEINEN neuen aktiven (partial unique nur auf active)
  insert into action_plans (user_id,assessment_id,title,action,target_days,status)
    values (owner,aid,'Nach Abschluss','Nächster Hebel',7,'active');
  raise notice 'PASS  Abschluss: completed-Plan blockiert neuen aktiven Fokus NICHT';

  raise notice '──────────────────────────────';
  raise notice 'TEIL A: ALLE FEEDBACK-/ABLAUF-INVARIANTEN BESTANDEN';
end $$;
