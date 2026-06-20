# FIX v3_50 — Release 2, Baustein 3: Abschluss-Würdigung + Fokus-Historie (Bestcase §11/§12)

Rundet den Aktionsbereich ab: Ein erreichter Fokus **verschwindet nicht mehr stumm**,
sondern wird gewürdigt und in eine Historie überführt — mit direktem Anstoß zum nächsten
Schritt. Kein neues Schema (nutzt `status='completed'` + `completed_at` + Check-ins).

Alle 7 Gates grün: tsc · claimcheck 65 · **vitest 341/341** (v3_49: 334 → +7) ·
eslint · build Exit 0 · audit 0 · PDF 4/4.

---

## Was neu ist

**Abschluss-Würdigung im `FocusTracker`:**
- „Fokus abschließen" führt nicht mehr direkt zum stillen Verschwinden, sondern zeigt eine
  Erfolgskarte: „{X} Tage drangeblieben." + eine kurze Einordnung („aus einem Vorsatz ist
  gelebte Praxis geworden — der eigentliche Wert von CoachCheck").
- Direkt darin: **„Neuen Fokus setzen →"** (zum Ergebnis) und „Fertig" (räumt die Karte ab;
  beim nächsten Laden ist der Fokus ohnehin aus der aktiven Zone).

**Fokus-Historie auf dem Dashboard:**
- Neue Zone „Abgeschlossene Foki" (bis 8, neueste zuerst) mit der Aktion, dem erreichten
  Tage-Zähler und dem Abschlussdatum. Macht Fortschritt über die Zeit sichtbar.
- Der Check-in-Load deckt jetzt **aktive und abgeschlossene** Pläne ab, damit die Historie
  korrekte Tage-Zahlen zeigt.

## Kein neues Schema

Diese Slice nutzt ausschließlich vorhandene Tabellen (`action_plans` mit
`status`/`completed_at`, `action_checkins`). Migrationsstand bleibt **01 → 43**.

## Bewusst NICHT in dieser Slice

- **Erinnerungen/Nudges** (tägliche Mail „heute schon dran gewesen?") — eigene
  Infrastruktur (Resend + Cron/GitHub-Actions), separater Schritt. Das ist der letzte
  offene Punkt aus der Aktionsbereich-Vision.

---

## Gate-Ergebnisse v3_50

| Gate | Ergebnis |
| --- | --- |
| `tsc --noEmit` | ✅ 0 Fehler |
| claimcheck | ✅ 65 Dateien |
| vitest | ✅ **341/341** (neu: `focus-completion-v3-50.test.ts`, +7) |
| eslint | ✅ keine Warnungen/Fehler |
| `next build` | ✅ Exit 0 (`/dashboard` kompiliert) |
| `npm audit --omit=dev` | ✅ 0 vulnerabilities |
| PDF | ✅ 4/4 |

---

## RELEASE 2 — KERN ABGESCHLOSSEN

| Baustein | Version | Status |
| --- | --- | --- |
| 7-Tage-Fokus setzen + Dashboard-Zone (§11) | v3_48 | ✅ |
| Tägliche Check-in-Schleife: Fortschritt/Streak/Abschluss (§12) | v3_49 | ✅ |
| Abschluss-Würdigung + Fokus-Historie (§11/§12) | v3_50 | ✅ |

Der vollständige Bogen **verstehen → umsetzen → dranbleiben → abschließen** steht.
Einziger optionaler Rest: Nudges (Erinnerungs-Mails).

**Nächstes (nach Wahl):** Nudge-Infrastruktur · Release 3 aus dem Bestcase-Fahrplan ·
oder ein anderer Schwerpunkt deiner Wahl.
