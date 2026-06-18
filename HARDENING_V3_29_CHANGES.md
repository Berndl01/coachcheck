# CoachCheck — Änderungen v3_29

**Fokus:** Tiefenprüfung der gesamten App gegen den **echten Code und eine
echte Postgres-Instanz** (nicht gegen die Docs). Alle 25 Migrationen frisch in
ein leeres Postgres eingespielt, dann die Invariante „beworben = geliefert" und
die Scoring-/Validierungspfade direkt in der DB nachgemessen.

**Ein ernster, premium-relevanter Bug gefunden und behoben** — empirisch
reproduziert, nicht vermutet.

---

## Befund (gegen echte DB reproduziert)

`get_items_for_assessment` filterte bisher nur `active` + Tier, **nicht**
`player_item`. Für **TeamCheck (Tier 4)** lieferte die Funktion damit **89 Items
statt der beworbenen 77**:

- 77 Coach-Items (Module A–G, Teilmenge der 103er-Skala) — korrekt.
- \+ 12 Spieler-Items (`module_code='TC'`, `player_item=true`) wie
  *„Mein Trainer gibt mir das Gefühl, dass ich gesehen werde."*

Der Coach hätte also 12 Items **aus Spieler-Sicht über sich selbst** beantworten
müssen — inhaltlich falsch. Und weil `/finalize` gegen dieselbe Funktion
validiert, hätte er ohne diese 12 sinnlosen Items **nicht abschließen können**.

Erreichbarkeit verifiziert: Das Dashboard routet jedes pending Assessment
tier-unabhängig auf `/assessment/[id]` (Coach-Runner), der genau diese Funktion
aufruft. Der Bug war live erreichbar.

Tiers 1/2/3 waren **nicht** betroffen (0 Spieler-Items getaggt → 27 / 103 / 103).

Empirie:
```
CURRENT get_items_for_assessment (tier4) = 89   (12 geleakte player items)
FIXED   (player_item = false)            = 77   = beworbener item_count ✓
```

---

## Fix (zwei Ebenen — Lesepfad UND Schreibpfad geschlossen)

### 1. `supabase/migrations/26_coach_assessment_excludes_player_items.sql` (neu)
- `get_items_for_assessment` filtert jetzt `and i.player_item = false`.
  - Tier 1/2/3 unverändert (27 / 103 / 103).
  - Tier 4 = **77** (= beworben). ✓
- **Dauerhafte Invariante als DO-Block-Assertion:** Für jedes Produkt mit
  gesetztem `item_count` MUSS die Zahl der ausgelieferten Coach-Items
  (aktiv, nicht-player, Tier im `package_tiers`) exakt `item_count` entsprechen.
  Bei Abweichung bricht die Migration mit klarer Meldung ab. Genau der Footgun,
  der bei der Pool-Erweiterung (Migration 15 → 22) zugeschlagen hat, kann so
  **nie wieder still durchrutschen.** (Lauf gegen echte DB: `NOTICE: Invariante OK`.)

### 2. `app/api/assessment/[id]/answer/route.ts` (Defense-in-depth)
- Lädt `player_item` mit und lehnt `player_item === true` mit HTTP 400 ab.
- Schließt den Schreibpfad: selbst ein crafted Request kann kein Spieler-Item
  in ein Coach-Assessment schreiben. (Lesequelle = Migration 26, Schreibquelle = hier.)

### 3. `tests/coach-items-exclude-players.test.ts` (neu, 4 Tests)
- Nagelt den Fix auf Quell-Ebene fest:
  - Die **jüngste** `get_items_for_assessment`-Definition filtert `player_item = false`
    und stammt aus Migration ≥ 26.
  - Die answer-Route selektiert `player_item` **und** lehnt `player_item === true` ab.
- Verhindert, dass ein künftiger Refactor den Filter still wieder entfernt.

---

## Mitgeprüft (in Ordnung, keine Änderung nötig)

- **AI-Fallback-Ehrlichkeit:** Bei KI-Ausfall liefert der Report HTTP 503
  (retrybar) statt eines sichtbar halbfertigen Premium-Reports — plus
  Claim-Guard-Softening als Netz. Korrekt.
- **Scoring-Robustheit:** `computeAxisScores` liest ausschließlich die 6
  kanonischen Achsen. Die TC-Player-Keys (coach_impact, psy_safety, team_klima,
  leistungsdr, klarheit) überschneiden sich mit keiner davon → selbst im (nach
  Fix unmöglichen) Leak-Fall null Verzerrung der Archetyp-Bestimmung.
- **TeamCheck-Player-Aggregation** läuft über `invitation_answers`
  (`get_items_for_invitation`, `invitation_type='spieler'`) — separater Pfad,
  vom Fix unberührt.
- **Hardcoded Counts** auf Landing/Components konsistent: 103 (hero,
  how-it-works), 100+ (stats-strip). Kein veraltetes „92" mehr (nur Opacity-Werte).
- **Migrations-Kette:** alle 25 (jetzt 26) Migrationen laufen sauber und in
  Reihenfolge gegen ein leeres Postgres durch.

---

## Gates (alle grün, gegen echten Code + echte DB)
```
tsc --noEmit ........... ✓
claimcheck ............. ✓ 48 Dateien
vitest ................. ✓ 64 Tests (vorher 60)
eslint ................. ✓
next build ............. ✓ EXIT 0, 9/9 Seiten
npm audit (omit dev) ... ✓ 0 vulnerabilities
PDF-Volltest ........... ✓ 3/3 Varianten rendern fehlerfrei
Migration 26 (real PG).. ✓ Invariante OK, Tier 4 = 77 = beworben
```

**Hinweis zu `npm audit` (alle Deps):** 2 verbleibende Findings sind dev-only
(esbuild = nur `dev`-Server auf Windows; js-yaml = ESLint-Config-Parsing). Sie
erreichen das Production-Bundle nicht und lassen sich nur per breaking
`--force`-Bump des grünen Toolchains auflösen — daher bewusst stabil gelassen.
Production-Scope: 0.

**Hinweis Deployment:** Migration 26 muss auf Supabase eingespielt werden (Teil
der `supabase/migrations/`). Falls eine merged `SUPABASE_ALLE_MIGRATIONEN.sql`
separat gepflegt wird, dort Migration 26 nachziehen.
