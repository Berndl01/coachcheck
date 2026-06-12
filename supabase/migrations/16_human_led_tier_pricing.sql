-- ============================================================
-- MIGRATION 16 — HUMAN-LED TIER PRICING (Tier 4 & 5)
-- ============================================================
--
-- Strategische Logik:
--   Tier 1-3 = reine Software (skaliert unendlich, Preis nach Wert + KI-Kosten).
--   Tier 4-5 = Software + MENSCHLICHE Begleitung durch das Mind-Club-Team.
--   Menschliche Zeit skaliert nicht — deshalb steigt der Preis ab Tier 4
--   deutlich. Genau dieser Sprung IST der Beweis, dass das Know-how von
--   Bernhard / dem Team Geld kostet.
--
-- Preisstaffel NEU:
--   schnelltest      €19      (unverändert · Einstieg)
--   selbsttest       €79      (unverändert · Selbstbedienung)
--   spiegel_360      €199     (unverändert · Premium-Selbstbedienung)
--   teamcheck        €399  →  €890    (+ persönlicher Auswertungs-Call)
--   saison_beratung  €1.499 → €3.900  (6 Monate persönliche Begleitung)
--
-- Defensive Migration (prüft slugs, verifiziert nach Update).
-- Beträge sind bewusst gewählt, aber in EINER Zeile anpassbar.
-- ============================================================

do $$
declare
  needed text[] := array['teamcheck', 'saison_beratung'];
  s text;
begin
  foreach s in array needed loop
    if not exists (select 1 from public.products where slug = s) then
      raise exception '[Migration 16] ABORT: slug % fehlt in products.', s;
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------
-- Preise (Tier 4 & 5 deutlich angehoben)
-- ------------------------------------------------------------
update public.products set price_cents = 89000  where slug = 'teamcheck';        -- €890
update public.products set price_cents = 390000 where slug = 'saison_beratung';   -- €3.900

-- ------------------------------------------------------------
-- Features: menschliche Begleitung klar sichtbar machen
-- ("So begleiten wir dich")
-- ------------------------------------------------------------
update public.products
set features = '[
      "Trainer: 77 Items · Spieler: 12 Items anonym",
      "Aggregierter Coach-Impact-Report (ab 5 Antworten)",
      "★ Persönlicher 60-Min-Auswertungs-Call mit dem Mind-Club-Team",
      "★ Schriftlicher 14-Tage-Maßnahmenplan, gemeinsam priorisiert",
      "Teamklima, psychologische Sicherheit & Untergruppen-Analyse"
    ]'::jsonb
where slug = 'teamcheck';

update public.products
set features = '[
      "Alles aus 360° Spiegel + TeamCheck",
      "★ 6 Monate persönliche Begleitung durch Bernhard / Mind-Club-Team",
      "★ Regelmäßige Strategie-Calls entlang der Saisonphasen",
      "★ Individueller Saison-Fahrplan & direkter Draht bei Führungsfragen",
      "Laufende Standortbestimmung statt Einmal-Foto"
    ]'::jsonb
where slug = 'saison_beratung';

-- ------------------------------------------------------------
-- Verifikation
-- ------------------------------------------------------------
do $$
declare
  tc int; sb int;
begin
  select price_cents into tc from public.products where slug = 'teamcheck';
  select price_cents into sb from public.products where slug = 'saison_beratung';
  if tc <> 89000 or sb <> 390000 then
    raise exception '[Migration 16] FAIL: teamcheck=% saison=% (erwartet 89000 / 390000)', tc, sb;
  end if;
  raise notice '[Migration 16] OK — TeamCheck €890, Saison €3.900, Begleitung sichtbar.';
end $$;

-- ============================================================
-- DONE. Frontend-Preistexte (FAQ, Kontaktformular) in dieser
-- Code-Auslieferung bereits mit aktualisiert.
-- ============================================================
