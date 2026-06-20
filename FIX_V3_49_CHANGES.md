# FIX v3_49 — Release 2, Baustein 2: Tägliche Check-in-Schleife (Bestcase §12)

Schließt den Aktionsbereich-Loop: aus dem gesetzten 7-Tage-Fokus wird eine echte
Gewohnheit mit **täglichem Check-in, Fortschritt, Streak und Abschluss** — direkt auf
dem Dashboard. Der vollständige Bogen von „verstehen → umsetzen → dranbleiben".

Alle 7 Gates grün: tsc · claimcheck 65 · **vitest 334/334** (v3_48: 322 → +12) ·
eslint · build Exit 0 · audit 0 · PDF 4/4.

---

## Was neu ist

**Migration 43 — `action_checkins`:**
- Genau **ein Check-in pro Plan und Tag** (`unique(plan_id, checkin_date)`); Vorhandensein
  = an dem Tag erledigt. Optionale kurze Notiz (≤300).
- RLS: Eigentümer liest nur; geschrieben wird ausschließlich über `service_role`
  (Verifikationsblock erzwingt: keine Schreib-Policy).

**Route `/api/action/[planId]` (POST + DELETE + PATCH):**
- POST: Check-in für heute (Upsert auf `plan_id,checkin_date`, optional Notiz) — nur bei
  aktivem Fokus. DELETE: Check-in von heute zurücknehmen. PATCH: Fokus abschließen
  (`status = completed`, `completed_at`).
- Ownership über `action_plans.user_id`; alles via `service_role`; **kein** Scoring-Zugriff.

**`FocusTracker` (Client) — ersetzt die statische Dashboard-Karte:**
- Fortschrittsbalken über die Ziel-Tage + „X von 7 Tagen", **Streak** (🔥), optionale
  Tages-Notiz, „Heute erledigt ✓" (mit Rückgängig).
- „Fokus abschließen" — hervorgehoben, sobald die Ziel-Tage erreicht sind; danach
  verlässt der Fokus die aktive Zone (`router.refresh`).

**Dashboard:**
- Lädt die Check-ins der aktiven Foki (RLS-scoped) und berechnet **Fortschritt + Streak
  serverseitig** (aufeinanderfolgende Tage, endend heute/gestern), übergibt sie an den
  Tracker.

**Doku:** GO-LIVE / LAUNCH / README auf **Migrationen 01 → 43** (Prod `… → 42 → 43`).

## Bewusst NICHT in dieser Slice

- **Abschluss-Feier → direkter Vorschlag eines nächsten Fokus** und eine **Fokus-Historie**
  (abgeschlossene Foki) — optionaler Baustein 3.
- **Erinnerungen/Nudges** (z. B. tägliche Mail) — eigene Infrastruktur (Resend/Cron),
  separater Schritt.

---

## Gate-Ergebnisse v3_49

| Gate | Ergebnis |
| --- | --- |
| `tsc --noEmit` | ✅ 0 Fehler |
| claimcheck | ✅ 65 Dateien |
| vitest | ✅ **334/334** (neu: `checkin-loop-v3-49.test.ts`, +12) |
| eslint | ✅ keine Warnungen/Fehler |
| `next build` | ✅ Exit 0 (`/api/action/[planId]`, `/dashboard` kompiliert) |
| `npm audit --omit=dev` | ✅ 0 vulnerabilities |
| PDF | ✅ 4/4 |

## Hinweis

Neue Migration 43 vor Inbetriebnahme anwenden (`… → 42 → 43`). Ohne sie liefern die
Check-in-Route und der Tracker leer/500; der gesetzte Fokus (v3_48) bleibt nutzbar.

## Release-2-Stand

✅ Baustein 1: 7-Tage-Fokus setzen + Dashboard-Zone (v3_48) ·
✅ Baustein 2: tägliche Check-in-Schleife (v3_49) — Kern-Loop steht.
Optionaler Baustein 3: Abschluss → nächster Fokus + Historie + Nudges.
