-- 22_product_metadata_post_expansion.sql
-- ============================================================
-- Produkt-Metadaten an den TATSÄCHLICHEN Pool angleichen.
-- ============================================================
--
-- Hintergrund: Migration 11 hatte die Zahlen auf den damals realen Stand
-- gesenkt (19/64/64/51). Migration 15 hat den Trainer-Pool DANACH erweitert
-- (jetzt real: Tier 1 = 27, Tier 2 = 92, Tier 3 = 92, Tier 4 = 77 Trainer-Items),
-- aber die Produkt-Texte für Selbsttest/360° wurden nicht wieder hochgezogen.
-- Folge: Selbsttest BEWIRBT 64, LIEFERT aber 92 — der Shop verkauft sich unter
-- Wert und ist inkonsistent mit der Startseite (Hero/Stats nennen 92).
--
-- Diese Migration setzt die sichtbaren Zahlen auf den real ausgelieferten
-- Stand (get_items_for_assessment liefert exakt diese Items) und korrigiert
-- zugleich die Modulzahl 6 → 7. Idempotent: erneuter Lauf ändert nichts mehr.
-- Schnelltest (Tier 1) wird BEWUSST nicht angefasst — ob der Taster bei
-- 19 bleiben oder auf 27 gehen soll, ist eine Produktentscheidung.

-- Selbsttest (Tier 2): real 92 Items, 7 Module
update public.products
set
  item_count = 92,
  duration_min = 25,
  features = '[
    "92 Premium-Items · ~25 Minuten",
    "7 Analyse- & Coaching-Module",
    "Haupttyp + Sekundärtyp aus 12 Archetypen",
    "Druckprofil & Entscheidungslogik",
    "Blind Spots, Paradoxien & 14/30/90-Programm"
  ]'::jsonb
where slug = 'selbsttest';

-- 360° Spiegel (Tier 3): real 92 Items (Selbst) + 5 Fremdeinschätzungen
update public.products
set
  item_count = 92,
  duration_min = 45,
  features = '[
    "Selbsttest (92 Items) + 5 Fremdeinschätzungen",
    "Identity vs. Behavior Gap",
    "Diskrepanz- & Streuungsanalyse",
    "Funktionale Signatur",
    "Ausführlicher Premium-Report"
  ]'::jsonb
where slug = 'spiegel_360';

-- TeamCheck (Tier 4): Trainer-Pool real 77 Items.
-- features stammen aus Migration 16 (Human-led Call, „Trainer: 77 Items …") und
-- bleiben unverändert; hier wird nur das stale item_count (51) korrigiert.
update public.products
set item_count = 77
where slug = 'teamcheck' and item_count is distinct from 77;
