-- ============================================================
-- MIGRATION 14 — PRODUCT PRICE UPDATE
-- ============================================================
--
-- Neue Preisstaffel CoachCheck:
--
--   schnelltest      → €19    (1900 cents)
--   selbsttest       → €79    (7900 cents)
--   spiegel_360      → €199  (19900 cents)
--   teamcheck        → €399  (39900 cents)
--   saison_beratung  → €1.499 (149900 cents)
--
-- Diese Migration ist defensiv: sie prüft, dass jede slug
-- existiert, BEVOR sie die Preise ändert. Falls eine slug
-- fehlt (z. B. weil Migration 01 nicht vollständig angewendet
-- wurde), bricht sie kontrolliert ab statt stillschweigend
-- nichts zu tun.
--
-- WICHTIG: Stripe zieht den Preis im Checkout aus dem aktuellen
-- DB-Wert. Solange diese Migration nicht angewendet ist,
-- verkauft der Checkout zu den ALTEN Preisen (9/29/99/299/1490).
-- ============================================================

do $$
declare
  expected_slugs text[] := array[
    'schnelltest', 'selbsttest', 'spiegel_360',
    'teamcheck', 'saison_beratung'
  ];
  s text;
  missing_count int := 0;
begin
  foreach s in array expected_slugs
  loop
    if not exists (select 1 from public.products where slug = s) then
      raise notice '[Migration 14] FEHLENDE slug: %', s;
      missing_count := missing_count + 1;
    end if;
  end loop;

  if missing_count > 0 then
    raise exception '[Migration 14] ABORT: % erwartete slug(s) fehlen in products. Migration 01 nicht vollständig angewendet?', missing_count;
  end if;
end $$;

-- ------------------------------------------------------------
-- Preis-Updates
-- ------------------------------------------------------------
update public.products set price_cents = 1900   where slug = 'schnelltest';
update public.products set price_cents = 7900   where slug = 'selbsttest';
update public.products set price_cents = 19900  where slug = 'spiegel_360';
update public.products set price_cents = 39900  where slug = 'teamcheck';
update public.products set price_cents = 149900 where slug = 'saison_beratung';

-- ------------------------------------------------------------
-- Verifikation
-- ------------------------------------------------------------
do $$
declare
  expected jsonb := '{
    "schnelltest": 1900,
    "selbsttest": 7900,
    "spiegel_360": 19900,
    "teamcheck": 39900,
    "saison_beratung": 149900
  }'::jsonb;
  k text;
  expected_cents int;
  actual_cents int;
  mismatch_count int := 0;
begin
  for k in select jsonb_object_keys(expected)
  loop
    expected_cents := (expected ->> k)::int;
    select price_cents into actual_cents from public.products where slug = k;
    if actual_cents is null then
      raise notice '[Migration 14] VERIFY missing: %', k;
      mismatch_count := mismatch_count + 1;
    elsif actual_cents <> expected_cents then
      raise notice '[Migration 14] VERIFY mismatch on %: erwartet %, tatsächlich %', k, expected_cents, actual_cents;
      mismatch_count := mismatch_count + 1;
    else
      raise notice '[Migration 14] OK     %: % cents (€%)',
        k, actual_cents, (actual_cents / 100.0)::numeric(10,2);
    end if;
  end loop;

  if mismatch_count > 0 then
    raise exception '[Migration 14] FAIL: % Preis(e) nicht korrekt gesetzt', mismatch_count;
  end if;

  raise notice '[Migration 14] DONE — alle 5 Preise korrekt aktualisiert.';
end $$;

-- ============================================================
-- DONE — neue Preisstaffel aktiv:
--   19 / 79 / 199 / 399 / 1.499 EUR
--
-- Nächster Schritt: alle Frontend-Texte, FAQ, Meta-Descriptions
-- auf die neuen Preise umstellen (Migration 14 deckt nur die
-- DB-Seite ab — Stripe Checkout zieht zwar dynamisch aus der
-- DB, aber Marketing-Texte/Landingpage zeigen sonst weiter
-- die alten Beträge).
-- ============================================================
