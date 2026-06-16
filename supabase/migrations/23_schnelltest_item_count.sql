-- 23_schnelltest_item_count.sql
-- ============================================================
-- Schnelltest (Tier 1): sichtbare Zahlen auf den REAL ausgelieferten
-- Stand anheben — 27 Items.
-- ============================================================
--
-- Hintergrund: get_items_for_assessment liefert für Tier 1 tatsächlich
-- 27 Items (Pool nach Migration 15). Die Produkt-Metadaten standen noch
-- auf dem ursprünglichen Marketing-Wert "22 Items · 8 Minuten" (Migration 01).
-- Diese Migration setzt item_count, duration_min und die Feature-Liste auf
-- den realen Stand, damit Shop-Anzeige und ausgelieferte Fragebogen-Länge
-- übereinstimmen (Claim-Sicherheit: beworbene = gelieferte Zahl).
--
-- 27 Items à ~18 Sekunden ≈ 8 Minuten — die Dauer bleibt realistisch bei ~8 Min.
-- Idempotent: erneuter Lauf ändert nichts mehr (Guard via is distinct from).

update public.products
set
  item_count = 27,
  duration_min = 8,
  features = '[
    "27 Items · ~8 Minuten",
    "Hybrid: Skalen + Forced Choice",
    "Typ-Tendenz aus 12 Archetypen",
    "3 Stärken · 3 Risiken",
    "Sofort-Ergebnis online"
  ]'::jsonb
where slug = 'schnelltest'
  and (item_count is distinct from 27 or duration_min is distinct from 8);
