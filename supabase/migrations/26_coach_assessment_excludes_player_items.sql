-- ============================================================
-- MIGRATION 26 — COACH-SELBSTASSESSMENT SCHLIESST SPIELER-ITEMS AUS
-- ============================================================
--
-- BEFUND (v3_29-Audit, gegen echte DB reproduziert):
--   get_items_for_assessment filterte bisher nur `active` + Tier, aber NICHT
--   `player_item`. Für TeamCheck (Tier 4) lieferte die Funktion damit 89 Items
--   (77 Coach-Items + 12 Spieler-Items wie "Mein Trainer gibt mir das Gefühl,
--   dass ich gesehen werde."). Der Coach hätte 12 Items aus SPIELER-Sicht über
--   sich selbst beantworten müssen, und /finalize hätte alle 89 verlangt.
--   → Bruch der Invariante "beworben (77) = geliefert" UND inhaltlich falsch.
--
--   Die 12 Spieler-Items (module_code 'TC', player_item=true) sind ausschließlich
--   für den Einladungs-Flow gedacht und werden korrekt über
--   get_items_for_invitation (invitation_type='spieler') ausgespielt. Sie haben
--   im Coach-Selbstassessment nichts zu suchen.
--
-- FIX: Coach-Selbstassessment lädt nur Nicht-Spieler-Items.
--   - Tier 1/2/3: 0 Spieler-Items getaggt → unverändert (27 / 103 / 103).
--   - Tier 4:     77 Coach-Items = beworbener item_count. ✓
--
-- Defense-in-depth: zusätzlich lehnt /api/assessment/[id]/answer ab v3_29
--   player_item-Antworten ab (crafted requests). Hier wird die Lesequelle
--   geschlossen, dort die Schreibquelle.
-- ============================================================

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
    and i.player_item = false          -- NEU: Spieler-Items nur via Invitation
    and p.tier = any(i.package_tiers)
  order by i.module_code, i.id;
$$;

grant execute on function public.get_items_for_assessment(uuid) to authenticated;

-- ============================================================
-- DAUERHAFTE INVARIANTE: beworben = geliefert
-- ============================================================
-- Für jedes Produkt mit gesetztem item_count MUSS die Zahl der tatsächlich
-- ausgelieferten Coach-Items (aktiv, nicht player, Tier im package_tiers)
-- exakt dem beworbenen item_count entsprechen. Schlägt diese Prüfung an,
-- bricht die Migration mit klarer Meldung ab — genau der Footgun, der bei
-- der Pool-Erweiterung (Migration 15 → 22) zugeschlagen hat, kann so nie
-- wieder still durchrutschen.
do $$
declare
  rec record;
  served int;
begin
  for rec in
    select id, tier, slug, item_count
    from public.products
    where item_count is not null
  loop
    select count(*)
      into served
      from public.items i
     where i.active = true
       and i.player_item = false
       and rec.tier = any(i.package_tiers);

    if served <> rec.item_count then
      raise exception
        'ITEM-COUNT-DRIFT: Produkt "%" (Tier %, slug %) bewirbt % Items, ausgeliefert werden aber % (aktiv, nicht-player). item_count ODER Item-Tags korrigieren, bevor deployed wird.',
        rec.slug, rec.tier, rec.slug, rec.item_count, served;
    end if;
  end loop;

  raise notice 'Invariante OK: beworbener item_count = ausgelieferte Coach-Items fuer alle Tiers.';
end $$;
