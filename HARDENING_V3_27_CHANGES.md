# CoachCheck — Änderungen v3_27

**Entscheidung umgesetzt:** Die in v3_26 als Vorschlag vorbereitete Item-
Erweiterung wurde nun **scharf in das Premiumprodukt** (Tier 2 Selbsttest +
Tier 3 360° Spiegel) eingebaut — inkl. ehrlicher Count-/Claim-Nachführung.
Schnelltest (Tier 1) und TeamCheck (Tier 4) bleiben unangetastet.

## Vorab: ist v3_26 vollständig eingearbeitet?

Ja — end-to-end verifiziert (kein Speku, Kette nachgezogen):

- `app/api/assessment/[id]/report/route.ts` berechnet `maturityScores`,
  speichert sie und übergibt sie an den Report-Prompt.
- `report-prompt.ts` ruft `matchDevelopmentProgram(...)` → die neuen Coach-
  Bausteine (I035–I040) fließen über die Reifewerte in das Feld
  `entwicklungsprogramm`.
- `lib/pdf/report-document.tsx` rendert `entwicklungsprogramm` für Tier ≥ 2
  **und** die Führungsreife-Achsen (inkl. druckreife/selbstregulation).
- **Fremdbild (360°):** derselbe Report rendert zusätzlich Selbst-vs-Fremdbild
  pro Achse, Diskrepanz-Interpretationen und Polarisierungs-Erkennung
  (anonymisiert, nur aggregiert). Das Entwicklungsprogramm läuft im 360°-Report
  parallel mit → **ein einheitliches Coach-Profil** aus Entwicklung + Fremdbild.

## Neu in v3_27 — `supabase/migrations/25_stress_pressure_communication_items.sql`

11 neue Items (claim-sicher), getaggt **[2,3]**:

- **Modul E · Submodul `belastung`** (eigene Belastung/Erholung des Trainers) — 6
  Items: 2× `state`, 2× `likert`, 1 Wichtig/Gelebt-Paar.
- **Modul E · `druck`** (Außendruck Verein/Eltern/Umfeld) — 1 Szenario + 1 Likert.
- **Modul B · `kommunikation`** (schwierige Kommunikation) — 2 Szenarien
  (Bank-Botschaft, Konflikt zweier Leistungsträger) + 1 Likert (Niederlagen-Ansprache).

Wirkung im Scoring (verifiziert):
- Die `belastung`-Items speisen den Modul-E-Mittelwert → schärfen
  `selbstregulation`/`druckreife` und triggern die neuen Coach-Bausteine zielgenauer.
- Das neue Wichtig/Gelebt-Paar erzeugt ein zusätzliches Modul-E-Entwicklungssignal
  (Gap-Berechnung keyt nach `module_code`, Guard gegen unvollständige Paare — getestet).

## Invariante „beworben = geliefert" (gewahrt)

- `get_items_for_assessment` liefert Tier 2/3 nun **103** Items (92 + 11).
- Migration zieht Produkt-Metadaten nach: `item_count` 92 → **103**, Dauer
  Selbsttest 25 → **28**, 360° 45 → **48**, plus aktualisierte Feature-Listen.
- Drei hartkodierte Startseiten-Zahlen aktualisiert:
  `hero.tsx` (92 → 103), `how-it-works.tsx` (92 → 103), `stats-strip.tsx` (90+ → 100+).
- Das Frage-Intro ist dynamisch (`items.length` + ~8 s/Item) → passt sich automatisch an.
- Schnelltest (27) und TeamCheck (77) unverändert.

## Revert (falls gewünscht)

```sql
update public.items set active = false
 where code like 'E_be_%' or code in ('E_dr_13','E_dr_14','B_ko_15','B_ko_16','B_ko_17');
-- item_count/duration_min zurück: selbsttest 92/25, spiegel_360 92/45
-- und die drei Startseiten-Zahlen zurück auf 92 / 90+.
```

## Gates (alle grün)
```
tsc --noEmit ........... ✓
claimcheck ............. ✓ 47 Dateien (inkl. Migration 25)
vitest ................. ✓ 51 Tests
eslint ................. ✓
next build ............. ✓ EXIT 0
npm audit (omit dev) ... ✓ 0 vulnerabilities
```
