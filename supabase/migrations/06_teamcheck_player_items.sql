-- ============================================================
-- MIGRATION 06 — TEAMCHECK: PLAYER ITEMS + AGGREGATION
-- ============================================================
--
-- Im TeamCheck antworten Spieler eine GANZ EIGENE Frageschicht:
-- nicht "Mein Coach ist..." sondern "In diesem Team erlebe ich..."
--
-- Wir erweitern die items-Tabelle um eine Spalte 'player_item' bool.
-- Bei get_items_for_invitation laden wir je nach invitation_type
-- entweder die normalen Items (fremdbild) oder die Spieler-Items (spieler).
-- ============================================================

-- 1. Neue Spalte für Spieler-Items
alter table public.items add column if not exists player_item boolean default false;

-- 2. Aggregations-Dimensionen für TeamCheck (separate Achsen)
-- Diese Dimensionen werden nur für player_items verwendet
-- - coach_impact:  Wie wirkt der Coach auf Spieler-Erleben? (-1 negativ ... +1 positiv)
-- - psy_safety:    Psychologische Sicherheit / Fehlerangst (-1 unsicher ... +1 sicher)
-- - team_klima:    Zusammenhalt / Untergruppen / Konflikte (-1 schlecht ... +1 stark)
-- - leistungsdr:   Performance Climate / Druck (-1 erdrückend ... +1 lernorientiert)
-- - klarheit:      Rollenklarheit & Kommunikation (-1 unklar ... +1 klar)
--
-- Wir nutzen weiter axis_weights jsonb — einfach mit Custom-Keys.

-- ============================================================
-- 3. SPIELER-ITEMS — aus Strategie-Doc TeamCheck-Edition
-- ============================================================
-- Format-Mix: 8 likert_5 + 2 spannungsfeld + 2 forced_choice
-- alle player_item = true, package_tiers = ARRAY[4]
-- ============================================================

insert into public.items (code, module_code, submodule, format, text_de, options, axis_weights, package_tiers, reverse_scored, player_item) values

-- COACH IMPACT
('TC_ci_01', 'TC', 'coach_impact', 'likert_5',
  'Mein Trainer gibt mir das Gefühl, dass ich gesehen werde.',
  null,
  '{"coach_impact": 0.7, "psy_safety": 0.4}'::jsonb,
  ARRAY[4], false, true),

('TC_ci_02', 'TC', 'coach_impact', 'likert_5',
  'Mein Trainer kommuniziert klar, was er von mir erwartet.',
  null,
  '{"coach_impact": 0.6, "klarheit": 0.7}'::jsonb,
  ARRAY[4], false, true),

('TC_ci_03', 'TC', 'coach_impact', 'likert_5',
  'Auch unter Druck bleibt mein Trainer respektvoll.',
  null,
  '{"coach_impact": 0.7, "psy_safety": 0.6}'::jsonb,
  ARRAY[4], false, true),

('TC_ci_04', 'TC', 'coach_impact', 'likert_5',
  'Wenn ich einen Fehler mache, fühle ich mich nicht klein gemacht.',
  null,
  '{"coach_impact": 0.5, "psy_safety": 0.8}'::jsonb,
  ARRAY[4], false, true),

-- PSYCHOLOGISCHE SICHERHEIT
('TC_ps_01', 'TC', 'psy_safety', 'likert_5',
  'Ich kann ehrlich sagen, was ich denke, ohne Konsequenzen zu fürchten.',
  null,
  '{"psy_safety": 0.9}'::jsonb,
  ARRAY[4], false, true),

('TC_ps_02', 'TC', 'psy_safety', 'likert_5',
  'In diesem Team werden Fehler als Lerngelegenheit gesehen.',
  null,
  '{"psy_safety": 0.7, "leistungsdr": 0.5}'::jsonb,
  ARRAY[4], false, true),

-- TEAMKLIMA
('TC_tk_01', 'TC', 'team_klima', 'likert_5',
  'Im Team halten wir wirklich zusammen — auch wenn es schwierig wird.',
  null,
  '{"team_klima": 0.9}'::jsonb,
  ARRAY[4], false, true),

('TC_tk_02', 'TC', 'team_klima', 'likert_5',
  'Es gibt im Team Untergruppen, die das Klima belasten.',
  null,
  '{"team_klima": 0.8}'::jsonb,
  ARRAY[4], true, true),  -- reverse_scored

-- LEISTUNGSDRUCK / KLIMA
('TC_ld_01', 'TC', 'leistungsdruck', 'likert_5',
  'Der Druck im Team ist motivierend, nicht erdrückend.',
  null,
  '{"leistungsdr": 0.8, "psy_safety": 0.4}'::jsonb,
  ARRAY[4], false, true),

('TC_ld_02', 'TC', 'leistungsdruck', 'spannungsfeld',
  'Wo erlebst du das Team-Klima aktuell?',
  '[{"left": "Erdrückend", "right": "Inspirierend", "axis": "leistungsdr"}]'::jsonb,
  '{"leistungsdr": 1.0}'::jsonb,
  ARRAY[4], false, true),

-- ROLLENKLARHEIT
('TC_rk_01', 'TC', 'klarheit', 'likert_5',
  'Ich weiß genau, welche Rolle ich im Team habe.',
  null,
  '{"klarheit": 0.9}'::jsonb,
  ARRAY[4], false, true),

('TC_rk_02', 'TC', 'klarheit', 'forced_choice',
  'Was beschreibt die Kommunikation des Trainers besser?',
  '[
    {"key": "A", "text": "Klar und nachvollziehbar — ich weiß immer, was Sache ist.",
     "weights": {"klarheit": 0.9, "coach_impact": 0.5}},
    {"key": "B", "text": "Manchmal verwirrend — ich muss raten, was er meint.",
     "weights": {"klarheit": -0.9, "coach_impact": -0.4}}
  ]'::jsonb,
  '{}'::jsonb,
  ARRAY[4], false, true);

-- ============================================================
-- 4. UPDATE: get_items_for_invitation - berücksichtigt invitation_type
-- ============================================================
create or replace function public.get_items_for_invitation(invitation_token text)
returns setof public.items
language sql
security definer
set search_path = public
as $$
  select i.*
  from public.items i
  join public.invitations inv on inv.token = invitation_token
  join public.assessments a on a.id = inv.parent_assessment_id
  join public.products p on p.id = a.product_id
  where i.active = true
    and p.tier = any(i.package_tiers)
    and inv.expires_at > now()
    and inv.status not in ('completed', 'expired')
    and (
      -- Fremdbild-Einladungen → normale (nicht-Spieler) Items
      (inv.invitation_type = 'fremdbild' and i.player_item = false)
      OR
      -- Spieler-Einladungen → ausschließlich player_items
      (inv.invitation_type = 'spieler' and i.player_item = true)
    )
  order by i.module_code, i.id;
$$;

grant execute on function public.get_items_for_invitation(text) to anon, authenticated;

-- ============================================================
-- 5. TEAMCHECK AGGREGATION FUNCTION
-- ============================================================
-- Aggregiert Spieler-Antworten zu Team-Scores.
-- Mindestschwelle: 5 Spieler für Anonymität bei TeamCheck.
-- ============================================================
create or replace function public.get_teamcheck_aggregate(assessment_uuid uuid)
returns table (
  item_id int,
  format text,
  avg_numeric numeric,
  avg_position numeric,
  top_choice text,
  response_count bigint
)
language sql
security definer
set search_path = public
as $$
  with completed_invs as (
    select i.id
    from public.invitations i
    where i.parent_assessment_id = assessment_uuid
      and i.invitation_type = 'spieler'
      and i.status = 'completed'
  ),
  inv_count as (
    select count(*) as cnt from completed_invs
  ),
  agg as (
    select
      ia.item_id,
      it.format,
      avg(ia.value_numeric) as avg_numeric,
      avg(ia.value_position) as avg_position,
      mode() within group (order by ia.value_choice) as top_choice,
      count(*) as response_count
    from public.invitation_answers ia
    join public.items it on it.id = ia.item_id
    where ia.invitation_id in (select id from completed_invs)
    group by ia.item_id, it.format
  )
  select
    a.item_id,
    a.format,
    a.avg_numeric,
    a.avg_position,
    a.top_choice,
    a.response_count
  from agg a
  cross join inv_count
  where inv_count.cnt >= 5;
$$;

grant execute on function public.get_teamcheck_aggregate(uuid) to authenticated;

-- ============================================================
-- DONE — Phase 6 Schema bereit.
-- 12 neue Spieler-Items, Teamcheck-Aggregation,
-- Invitation-Type-aware Item-Loading.
-- ============================================================
