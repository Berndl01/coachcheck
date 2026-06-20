# FIX v3_44 — Release 1, Baustein 1: Mischprofile (Bestcase §9/§10)

Erster Schritt aus Release 1 (Wow-Ergebnis). Behebt eine **Korrektheits-Anforderung**
der Vision: CoachCheck darf nicht „Du bist eindeutig der Architekt" sagen. Liegen Primär-
und Sekundär-Archetyp nahe beieinander, ist das Ergebnis ein **Mischprofil** — und so wird
es jetzt **überall identisch** formuliert (Konsistenzregel §10).

Kein neues Schema, keine neue Migration. Alle 7 Gates grün: tsc · claimcheck 62 ·
**vitest 277/277** (v3_43: 262 → +15) · eslint · build Exit 0 · audit 0 · PDF **4/4**
(neue Mischprofil-Variante).

---

## Was neu ist

**Eine deterministische Quelle der Wahrheit** (`lib/scoring.ts`):
- `classifyProfile(distances)` → `{ type: 'dominant' | 'mixed', primary, secondary, gap, dominance }`.
  Maß ist **skaleninvariant**: `dominance = (d2 − d1) / d2` (wie viel näher liegt der Erste
  als der Zweite, relativ zum Zweiten). Schwelle `MIX_DOMINANCE_THRESHOLD = 0.12`,
  konservativ und tunebar. Degenerierte Fälle (d=0) sauber abgefangen, kein NaN.
- `profileHeadline(c)` → eine gemeinsame Überschrift, damit Result, PDF und Coach Card
  identisch formulieren. Nie „eindeutig".

**Systematischer Sweep über alle Consumer** (das war der Punkt — nicht eine Stelle):
1. **finalize** (`assessment/[id]/finalize`): berechnet die Einordnung **einmal** und
   speichert sie in `signature.profile` (Typ, dominance, gap, primary/secondary-Code,
   headline). Nie Neuberechnung beim Lesen (§24).
2. **Result-Seite**: liest den gespeicherten Typ. Bei `mixed` → Kicker „Mischprofil",
   ausdrücklicher Satz „Mischprofil aus X und Y", Zweittendenz-Label „Gleich starke
   Zweittendenz". Sauberer Fallback für Alt-Assessments ohne gespeicherte Einordnung.
3. **Report-Route**: nutzt **dieselbe** `classifyProfile`-Funktion/Schwelle (sie braucht nur
   die zwei nächsten Distanzen = Primär/Sekundär) und reicht `profileType` an Prompt **und**
   PDF durch. Funktioniert auch für Alt-Assessments.
4. **Report-Prompt** (`lib/ai/report-prompt.ts`): Die Mischtyp-Entscheidung lief vorher über
   eine **abweichende** absolute Schwelle (`archetypeDistanceDelta < 0.05`) — genau die
   Divergenz, die §10 verbietet. Jetzt entscheidet der kanonische `profileType` (Fallback auf
   Delta nur für Alt-/Sample-Aufrufer). Anweisung verschärft: nie „Du bist eindeutig X".
5. **PDF** (`lib/pdf/report-document.tsx`): `profileType` in den Props; bei `mixed` werden
   beide Kopfzeilen („Mischprofil", „Gleich starke Zweittendenz") plus ein erklärender Satz
   gerendert.
6. **PDF-Fulltest**: neue 4. Variante `4-mischprofil` rendert den Mischprofil-Pfad im Gate.

## Bewusst NICHT in diesem Baustein (ehrlich, kein halber Pfusch)

- **Coach Card / Profilkarte:** Sie ist vollständig auf **einen** Archetyp aufgebaut
  (`buildOperatingManual(primary)`) und rahmt sich bereits als „Coaching-Hypothese, keine
  Diagnose" — macht also **keine** „du bist eindeutig X"-Aussage und widerspricht Result/PDF
  nicht. Eine echte **Misch-Bedienungsanleitung** (zwei Archetypen verschmelzen) ist ein
  eigener Card-Umbau und gehört in den Release-1-Card-Pass, nicht in diesen Korrektheits-Fix.

## Restliche Release-1-Bausteine (Reihenfolge-Vorschlag)

- Gestaffelte Wow-Enthüllung (5 Bildschirme, §8 Ablauf D)
- Treffer-Feedback „Wie gut erkennst du dich wieder? 0–10" (§27) — die wichtigste Metrik
- Coach-Card-Pass (Zweittendenz + Mischprofil, §16)

---

## Gate-Ergebnisse v3_44

| Gate | Ergebnis |
| --- | --- |
| `tsc --noEmit` | ✅ 0 Fehler |
| claimcheck | ✅ 62 Dateien |
| vitest | ✅ **277/277** (neu: `mischprofil-v3-44.test.ts`, +15) |
| eslint | ✅ keine Warnungen/Fehler |
| `next build` | ✅ Exit 0 |
| `npm audit --omit=dev` | ✅ 0 vulnerabilities |
| PDF | ✅ **4/4** inkl. Mischprofil-Variante |

## Hinweis zur Wirkung

Neue Assessments bekommen die gespeicherte Einordnung automatisch. Bereits abgeschlossene
Alt-Assessments haben kein `signature.profile` — Result-Seite fällt dort sauber auf die
bisherige Darstellung zurück; der **Report** (bei Neugenerierung) und das **PDF** bestimmen
den Typ ohnehin live über `classifyProfile` und sind damit auch für Altfälle korrekt.
