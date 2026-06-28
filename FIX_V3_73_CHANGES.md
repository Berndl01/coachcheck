# FIX v3_73 — PostgREST-Embed-Bug (Einladungs-Gültigkeit + Rater-Reminder) behoben

Rekonstruktion des **verlorenen v3.73** auf Basis von v3.72. Die v3.73-ZIP existierte nicht mehr;
der Fix wurde aus dem realen Code **empirisch wiederhergestellt**, nicht aus dem Gedächtnis behauptet.
Kernlinie unverändert: **fail-closed**, **Advertised = Delivered**, **ehrliches Scoping**, **systematischer
Sweep statt Einzelfix**.

---

## Befund (empirisch gegen Code + Schema)

`assessments.user_id` referenziert **`auth.users(id)`**, **nicht** `public.profiles`. Damit existiert
**keine von PostgREST auflösbare Relation `assessments → profiles`**. Der verschachtelte Embed

```
assessment:parent_assessment_id(profile:user_id(full_name, sport[, club]))
```

ließ sich deshalb nicht auflösen → die Query lieferte `data = null`. Konsequenzen, beide produktiv
relevant:

- **Einladungs-Token-Seiten** (Fremdbild + TeamCheck): Für **gültige** Token wurde `invitation` null →
  es rendert „nicht gefunden". Die Validity bricht, obwohl die Einladung gültig ist.
- **Rater-Reminder-Cron**: Die Reminder-Query lieferte 0 Zeilen → es wurde **nie eine Erinnerung**
  verschickt.

Das deckt sich exakt mit den zwei aus dem Verlauf erinnerten Symptomen.

## Sweep (statt Einzelfix): drei Fundstellen

Codebasis-weite Suche nach dem doppelt verschachtelten Embed ergab **genau drei** Stellen — die dritte
(`teamcheck`) wäre bei einem Named-Item-Fix übersehen worden:

1. `app/einschaetzung/[token]/page.tsx` (Select + Konsum)
2. `app/teamcheck/[token]/page.tsx` (Select + Konsum) — **nur über den Sweep gefunden**
3. `lib/email/progress-emails.ts` → `sendRaterReminders` (Select + Konsum)

Einfache to-one-Embeds im Projekt (`product:products(...)`, `primary:primary_archetype_id(...)` u. a.)
sind **nicht** betroffen — sie laufen über reale Fremdschlüssel und lösen sauber auf.

## Fix

- **`lib/invitations/inviter-profile.ts`** (NEU): `getInviterProfile(admin, parentAssessmentId)` löst das
  Trainer-Profil über **zwei explizite, FK-reale Lookups** auf
  (`invitations.parent_assessment_id → assessments.id`, dann `profiles.id = user_id`). FK-Inferenz-
  unabhängig, **fail-closed**: jedes fehlende Glied → sauber `null` statt Exception. MUSS mit dem
  Admin-Client (service_role) laufen.
- Alle drei Fundstellen ziehen den verschachtelten Embed aus dem `.select(...)` und nutzen den Helfer.
  `parent_assessment_id` bleibt/wird als **Top-Level-Spalte** selektiert; die Validity nutzt ohnehin nur
  Top-Level-Felder und ist damit unabhängig von jeder Relation.

## Lock-in-Tests

- **`tests/embed-fix-v3-73.test.ts`** (NEU, 7 Tests):
  - **Statischer Regressions-Guard**: kein `.select(...)` in `app/` oder `lib/` enthält das verschachtelte
    `parent_assessment_id(profile:user_id(`-Muster mehr (der Doku-Kommentar im Helfer zeigt es bewusst —
    er ist kein `.select(` und wird korrekt nicht erfasst).
  - Alle drei Stellen referenzieren `getInviterProfile`.
  - Helfer-Verhalten (gemockter Admin-Client): ohne `parentAssessmentId` → `null` ohne DB-Zugriff;
    Zwei-Schritt-Auflösung über `assessment.user_id`; fehlendes Assessment → `null` (kein zweiter Lookup);
    fehlendes Profil → `null`; Null-/fehlende Felder werden zu `null` normalisiert.

## Ehrliche Grenze

Ob der frühere Embed zur Laufzeit **errort** oder ein **Array** zurückgab, hängt von PostgRESTs
FK-Erkennung gegen das reale Schema ab und ist hier **statisch nicht** abschließend beweisbar. Der Fix ist
davon unabhängig korrekt: Er **entfernt die Abhängigkeit von der Relationserkennung** vollständig und nutzt
nur real existierende Fremdschlüssel. Der vollständige Live-Nachweis (Token-Seite lädt + Rater-Reminder-Cron
verschickt) gegen eine laufende Supabase bleibt deine Verantwortung.

## Verbindliche Gates — alle grün (echte Läufe)

```text
tsc --noEmit                          ✓
node scripts/claimcheck.mjs           ✓
npx vitest run                        ✓  (443/443, inkl. 7 neue Embed-Tests)
eslint .                              ✓
next build                            ✓
npm audit --omit=dev --audit-level=high ✓  (0)
node scripts/pdf-fulltest.mjs         ✓  (4/4)
```

## Version

`CoachCheck v3.73` (rekonstruiert, auf v3.72). Migrationsstand unverändert **01 → 48** — der Fix ist reiner
Code, keine Schema-Änderung.
