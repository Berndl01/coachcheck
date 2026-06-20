# FIX v3_67 — Spannungsfeld-Pole im Fragebogen fehlten (alle Items)

## Symptom (Screenshot vom Tester)
Im Fragebogen zeigen die Spannungsfeld-Items einen Regler mit der Anweisung „Bewege den Regler
zwischen den Polen" — aber **ohne Pol-Beschriftungen links/rechts**. Betraf JEDES Spannungsfeld-Item
in allen Frage-Flows.

## Ursache (systematisch, DB-Ebene)
Beim RPC-Hardening v3.32 (Migration 30, `strip_option_weights`) wurden die Options-Objekte
serverseitig auf `{key,text}` reduziert, um Scoring-Gewichte nicht an den Client zu leaken. Die
Pol-Beschriftungen `left`/`right` der Spannungsfeld-Items liegen im selben `options`-JSON und wurden
dabei mit-entfernt — obwohl sie reine ANZEIGE-Daten sind. Ergebnis: der Client bekam `options[0]`
ohne `left`/`right`, der Slider zeigte leere Pole. Ein zweiter Stripper im Client
(`sanitizeItemsForClient`) tat dasselbe.

## Fix
1. **`supabase/migrations/44_restore_spannungsfeld_poles.sql`** (NEU): `strip_option_weights`
   liefert jetzt `key/text` (Auswahl-Optionen) **und** `left/right` (Spannungsfeld-Pole), via
   `jsonb_strip_nulls`. Die Achse `axis` und die Optionsgewichte bleiben weiterhin entfernt
   (IP-Schutz). Da `get_items_for_assessment` / `get_items_for_invitation` diese Funktion aufrufen,
   wirkt der Fix in BEIDEN RPCs → alle Frage-Flows (Selbstbild, Fremdbild-Token, TeamCheck-Spieler).
   Self-prüfender DO-Block im Skript; idempotent.
2. **`lib/utils/sanitize-items.ts`** + **`Item`-Typ**: reichen `left`/`right` durch, strippen `axis`.
3. Renderer (`SpannungsfeldInput`) war bereits korrekt — er las `options[0].left/right`, bekam sie
   nur nie. Keine Änderung nötig.

## ⚠️ Aktion erforderlich (sonst bleiben die Pole live leer)
**Migration 44 in Produktion anwenden.** Der Code-Fix allein genügt nicht — die Pole werden erst
sichtbar, sobald die DB-Funktion ersetzt ist (`supabase db push` bzw. SQL-Editor, Reihenfolge bis 44).

## Empirischer Beweis (echtes PostgreSQL 16, Client-Pfad)
- A_id_07 (Screenshot-Item): ROH `{axis, left:"Struktur", right:"Flexibilität"}` → nach Strip
  `{left:"Struktur", right:"Flexibilität"}` (axis weg).
- SYSTEMATISCH: alle 10 Spannungsfeld-Items → 10/10 mit beiden Polen, 0 leaken axis, 0 leaken weights.
- END-TO-END über den echten RPC `get_items_for_assessment` (Tier-2-Assessment, Owner-Kontext):
  9 Spannungsfeld-Items geliefert, 9/9 mit beiden Polen, 0 axis-/weights-Leak.
  A_id_07 via RPC: links="Struktur", rechts="Flexibilität", axis_leak=false.

## Zurückgenommen
Die in v3_66 ergänzten Modul-Pole auf der **Landing-Architektur-Sektion** waren eine
Fehlinterpretation (es ging immer um den Fragebogen). Vollständig revertiert: Pol-Zeile + `pl/pr` aus
`architecture.tsx` entfernt, 14 `poleXl/poleXr`-Keys aus beiden Wörterbüchern entfernt (zurück auf
v3_65-Stand, 63 Sektionen).

## Tests
- `tests/sanitize-poles-v3-67.test.ts` (NEU): Sanitizer reicht left/right durch, strippt axis/Gewichte.
- `tests/rpc-no-scoring-leak.test.ts`: nagelt Migration 44 fest (left/right erhalten, axis/Gewichte weg).
- `tests/launch-doc-v3-51.test.ts` + `LAUNCH.md`: Migrationsstand auf 01 → 44 gesynct.

## Gates
tsc OK · claimcheck 66 · vitest 360/360 (35) · eslint OK · next build Exit 0 · npm audit 0 · PDF 4/4.
