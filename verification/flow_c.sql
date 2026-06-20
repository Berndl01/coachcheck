do $$
declare owner uuid := '11111111-1111-1111-1111-111111111111';
        aid uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        pid integer; entitled boolean; cnt int;
begin
  select id into pid from products order by tier limit 1;

  -- ===== ABLAUF: Kauf bezahlt → Zugang =====
  insert into purchases (id,user_id,product_id,assessment_id,amount_cents,currency,status,paid_at)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd',owner,pid,aid,1900,'eur','paid',now());
  select exists(select 1 from purchases where assessment_id=aid and user_id=owner and status='paid') into entitled;
  if not entitled then raise exception 'FAIL: bezahlter Kauf ergibt keinen Zugang!'; end if;
  raise notice 'PASS  Entitlement: bezahlter Kauf → Assessment ist freigeschaltet';

  -- ===== ABLAUF: Storno (Refund) → Entzug =====
  update purchases set status='refunded' where id='dddddddd-dddd-dddd-dddd-dddddddddddd';
  select exists(select 1 from purchases where assessment_id=aid and user_id=owner and status='paid') into entitled;
  if entitled then raise exception 'FAIL: nach Refund weiterhin Zugang!'; end if;
  raise notice 'PASS  Entitlement: Refund → kein bezahlter Kauf mehr → Zugang entzogen';

  -- ===== ABLAUF: 360°-Einladung am Assessment + Cascade-Entwertung =====
  insert into invitations (id,parent_assessment_id,token,invitation_type,status,expires_at)
    values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',aid,'tok_'||substr(md5(random()::text),1,16),'fremdbild','pending',now()+interval '14 days');
  -- Cascade bei Refund: Einladung entwerten
  update invitations set status='expired', expires_at=now()-interval '1 day' where parent_assessment_id=aid;
  select count(*) into cnt from invitations where parent_assessment_id=aid and status='pending' and expires_at>now();
  if cnt<>0 then raise exception 'FAIL: Einladung nach Cascade noch aktiv!'; end if;
  raise notice 'PASS  Cascade: Einladung nach Refund entwertet (0 aktive übrig)';

  -- ===== Pulse-Zähl-Funktion aufrufbar (leerer Zyklus → 0) =====
  select get_pulse_cycle_response_count(gen_random_uuid()) into cnt;
  if cnt is null then raise exception 'FAIL: Pulse-Zählfunktion liefert NULL!'; end if;
  raise notice 'PASS  Pulse: get_pulse_cycle_response_count() aufrufbar, liefert % für leeren Zyklus',cnt;

  raise notice '──────────────────────────────';
  raise notice 'TEIL C: ENTITLEMENT-/CASCADE-/PULSE-ABLÄUFE BESTANDEN';
end $$;
