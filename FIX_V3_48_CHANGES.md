# FIX v3_48 — Release 2, Baustein 1: Aktionsbereich – 7-Tage-Fokus (Bestcase §11/§12/§24)

Start von Release 2 — im Dokument „die wichtigste Weiterentwicklung der gesamten App":
der Schritt von **verstehen** zu **umsetzen**. Diese Slice macht aus dem nächsten Schritt
des Ergebnisses einen **trackbaren 7-Tage-Fokus**, der auf dem Dashboard sichtbar ist.

Alle 7 Gates grün: tsc · claimcheck 64 · **vitest 322/322** (v3_47: 308 → +14) ·
eslint · build Exit 0 · audit 0 · PDF 4/4.

---

## Was neu ist

**Migration 42 — `action_plans`:**
- `title`, `action` (der konkrete Schritt), `source`, `status`
  (`active`/`completed`/`archived`), `target_days` (Default 7), Zeitstempel.
- **Partial-Unique-Index** `ux_action_plans_one_active`: höchstens **ein aktiver Fokus**
  pro Nutzer+Assessment.
- RLS: Eigentümer liest nur; geschrieben wird ausschließlich über `service_role`
  (Verifikationsblock erzwingt: keine Schreib-Policy).

**Route `/api/assessment/[id]/action` (POST + DELETE):**
- POST setzt/ersetzt den aktiven Fokus (Update-in-place bei vorhandenem aktivem Plan →
  kein Partial-Unique-Konflikt); DELETE archiviert ihn.
- Auth + Eigentum + nur nach Abschluss; Zod (Titel ≤160, Aktion ≤600).
- Schreibt via `service_role` ausschließlich in `action_plans` — **kein** Scoring-Zugriff.

**Fokus-Karte `ActionFocusCard` (Client) im Ergebnis:**
- Zeigt entweder den vorgeschlagenen nächsten Schritt (`signature.lever`) mit „Als
  7-Tage-Fokus setzen", oder den bereits aktiven Fokus mit „Auf dem Dashboard verfolgen"
  + „Fokus entfernen". Sitzt im „Was kommt als Nächstes?"-Block.

**Dashboard — neue Zone „Aktiver Fokus":**
- Lädt die aktiven Foki des Nutzers (RLS-scoped) und zeigt sie als Karten zwischen
  Profil-Header und Auswertungen, inkl. „seit X Tagen aktiv" und Link zum Ergebnis.

**Doku:** GO-LIVE / LAUNCH / README auf **Migrationen 01 → 42** (Prod `… → 41 → 42`).

## Bewusst NICHT in dieser Slice (folgt als Baustein 2)

- **Tägliche Check-in-Schleife** (`action_checkins`, §12): „Heute dran gewesen?", Streak,
  Fortschritt über die 7 Tage, Abschluss → nächster Fokus. Eigene Migration 43, sobald
  verdrahtet — jede Migration trägt nur ausgelieferte Funktion.
- Mehrere parallele Foki / Fokus-Historie-Ansicht.

---

## Gate-Ergebnisse v3_48

| Gate | Ergebnis |
| --- | --- |
| `tsc --noEmit` | ✅ 0 Fehler |
| claimcheck | ✅ 64 Dateien |
| vitest | ✅ **322/322** (neu: `action-area-v3-48.test.ts`, +14) |
| eslint | ✅ keine Warnungen/Fehler |
| `next build` | ✅ Exit 0 (`/api/assessment/[id]/action`, `/dashboard` kompiliert) |
| `npm audit --omit=dev` | ✅ 0 vulnerabilities |
| PDF | ✅ 4/4 |

## Hinweis

Neue Migration 42 vor Inbetriebnahme anwenden (`… → 41 → 42`). Ohne sie liefern die
Aktions-Route und die Dashboard-Zone leer/500 (Tabelle fehlt); der Rest bleibt unberührt.

## Release-2-Fahrplan

✅ Baustein 1: 7-Tage-Fokus setzen + Dashboard-Zone (v3_48) ·
offen: Baustein 2 (tägliche Check-in-Schleife) · Baustein 3 (Abschluss/Streak → nächster Fokus).
