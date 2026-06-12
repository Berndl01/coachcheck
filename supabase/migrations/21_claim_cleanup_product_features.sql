-- 21_claim_cleanup_product_features.sql
-- Claim-Bereinigung: "diagnostische Module" aus sichtbaren Produkt-Features entfernen.
-- Idempotent — LIKE-Guards sorgen dafür, dass ein erneuter Lauf nichts mehr ändert.
-- (Frische DBs sind bereits sauber, da die Seed-Migrationen 01/11/15 korrigiert wurden;
--  diese Migration repariert bereits deployte Datenbanken.)

-- Bekannte Phrasen gezielt ersetzen
update public.products
set features = replace(features::text, '6 diagnostische Module', '6 Analyse- & Coaching-Module')::jsonb
where features::text like '%6 diagnostische Module%';

update public.products
set features = replace(
  features::text,
  '7 diagnostische Module + Wichtig-vs-Gelebt-Lücken',
  '7 Analyse- & Coaching-Module + Wichtig-vs-Gelebt-Lücken'
)::jsonb
where features::text like '%7 diagnostische Module%';

-- Sicherheits-Sweep: jegliches verbliebene "diagnostisch"-Wort in Features neutralisieren
update public.products
set features = replace(features::text, 'diagnostische', 'analytische')::jsonb
where features::text like '%diagnostische%';

update public.products
set features = replace(features::text, 'diagnostisch', 'analytisch')::jsonb
where features::text like '%diagnostisch%';
