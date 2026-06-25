## Kontext

Bei einer Schwester-App (YOU/PlayerCheck) wurde ein Fehler gefunden: Eine Feedbackseite
versuchte über ein verschachteltes PostgREST-Embed `assessments → profiles` zu laden, obwohl
zwischen diesen Tabellen **kein direkter Foreign Key** existiert (beide zeigen nur auf
`auth.users`). Das Embed ist nicht auflösbar, die Abfrage liefert `null`, der Fehler wurde
verschluckt und die Seite zeigte eine 404/„ungültig"-Meldung für gültige Einladungen.

Aufgabe: prüfen, ob **CoachCheck denselben Fehler** macht — und falls ja, beheben.

**Ergebnis: Ja, identisches Muster an drei Stellen. Behoben und empirisch gegen echtes
PostgreSQL 16 nachgewiesen.**

---

## Empirischer Befund (echtes PostgreSQL 16, reale Migrationen 01–48)

Die FK-Realität wurde direkt aus dem Constraint-Katalog der migrierten DB gelesen:

- `public.profiles.id` → `auth.users(id)` (Migration 01)
- `public.assessments.user_id` → **`auth.users(id)`** (Migration 01) — **nicht** zu `profiles`
- Anzahl FK `assessments → profiles`: **0**
- `auth.users` besitzt **keine** der Spalten `full_name` / `sport` / `club`
- `invitations.parent_assessment_id` → `assessments` (der äußere Teil des Embeds löst auf,
  der innere `profile:user_id(...)` nicht)

PostgREST kann keine Beziehung einbetten, für die kein FK-Constraint existiert. Der Hint
`user_id` löst auf den FK → `auth.users` auf; die verlangten Profilspalten existieren dort
nicht → die **gesamte** `.select()`-Abfrage scheitert (`data = null`). Das ist
konfigurationsunabhängig und deterministisch.

**Reproduktion + Fix-Beweis mit echten Datensätzen:** Ein zusammenhängender Satz (User in
`auth.users`, Profil „Maria Trainerin/handball/TV Musterstadt", Assessment, Einladung) wurde
angelegt. Der **reparierte** Pfad — drei getrennte Einzelabfragen
`invitations → assessments.user_id → profiles` — liefert den korrekten Trainernamen zurück.
Die Einzelabfragen sind reine Single-Table-Lookups (`.eq(...)`) ohne jede
Beziehungsauflösung und damit trivial korrekt.

---

## Betroffene Stellen (3) und jeweilige Auswirkung

Alle drei verwendeten exakt
`assessment:parent_assessment_id(profile:user_id(full_name, sport[, club]))` und
verschluckten den Fehler (`const { data } = …` ohne `error`).

### 1. `app/teamcheck/[token]/page.tsx` — Spieler-Fragebogen (TeamCheck)
Das kaputte Embed ließ die ganze Einladungsabfrage scheitern → `invitation = null` → die Seite
zeigte den **„ungültige Einladung"**-Screen für **gültige** Einladungen. Der Spieler konnte den
Trainer-Fragebogen nicht ausfüllen.

### 2. `app/einschaetzung/[token]/page.tsx` — Fremdbild-Einschätzung (360°)
Gleiches Muster → **„nicht gefunden"**-Screen für gültige Fremdbild-Einladungen.

### 3. `lib/email/progress-emails.ts` → `sendRaterReminders()` — Cron
Hier war die Folge subtiler, aber real: das Embed ließ die Listenabfrage scheitern,
`(rows ?? [])` wurde `[]` → der Cron fand „0 Zeilen" und versendete **nie** Rater-Erinnerungen,
ohne Fehlermeldung.

---

## Fix (additiv, keine Migration, kein Schemaeingriff)

In allen drei Stellen wurde das nicht auflösbare Embed entfernt und durch **getrennte,
klare Einzelabfragen** ersetzt:

- Einladung lädt nur noch eigene Spalten (`id, status, expires_at, parent_assessment_id,
  invitation_type[, unsubscribed_at]`).
- Das Trainerprofil wird separat geladen: `assessments.user_id` → `profiles(full_name,
  sport[, club])`. In `sendRaterReminders` über **zwei Batch-Abfragen** (`.in(...)`) statt N+1.
- Der Fehler der Einladungsabfrage wird jetzt **protokolliert** (`console.error` mit `code` /
  `message`) statt still als „ungültig"/leer verschluckt zu werden — er kann nach Entfernen des
  Embeds praktisch nur noch bei echtem DB-Ausfall auftreten und ist dann in den Vercel-Logs
  sichtbar.

Das Trainerprofil ist in allen drei Fällen **nicht rendering-kritisch**: fehlt es, greifen die
bestehenden neutralen Fallbacks (`„der Trainer"` / `„Ein Trainer"`). Der eigentliche Schaden lag
allein im scheiternden Embed, nicht in der Profilanzeige.

### Lock-in-Test
`tests/p0-feedback-embed-v3-73.test.ts` (NEU): scannt **alle** `.ts/.tsx` unter `app/` und
`lib/` (Kommentare entfernt) und verbietet das Muster `profile:user_id(...)` sowie verschachtelte
`assessment(...)`-Embeds mit `profile:`. Zusätzlich wird je betroffener Datei geprüft, dass das
Profil getrennt über `public.profiles` geladen und der Abfragefehler nicht mehr verschluckt wird.

---

## Verbindliche Gates — alle grün (echte Läufe)

```text
tsc --noEmit                  ✓
node scripts/claimcheck.mjs   ✓  (70 Dateien)
npx vitest run                ✓  (441/441, inkl. neuem Lock-in-Test)
eslint .                      ✓
next build                    ✓  (vollständige Route-Tabelle, fehlerfrei)
npm audit --omit=dev …=high   ✓  (0 Schwachstellen im Produktionsbundle)
node scripts/pdf-fulltest.mjs ✓  (4/4 PDF-Varianten)
```

(Volles `npm audit` weiterhin: 1× low, `esbuild`-Dev-Server, transitiv über Vitest, nicht im
Produktionsbundle — bewusst akzeptiert.)

---

## Was diese Prüfung NICHT beweist

Der Fix ist statisch und gegen echtes PostgreSQL 16 (Schema/Constraint-Ebene + reale Datensätze)
verifiziert. **Nicht** abgedeckt — bleibt deine Live-Abnahme:

- ein echter End-to-End-Aufruf von `/teamcheck/<token>` und `/einschaetzung/<token>` gegen die
  laufende App mit echter Supabase-Instanz (HTTP 200, Fragebogen lädt, Trainername erscheint)
- ein realer Lauf des Rater-Reminder-Crons gegen echte Daten

Diese brauchen die laufende Umgebung; aus dem ZIP allein nicht beweisbar.

---

## Version

`CoachCheck v3.73` (von 3.72). Reiner Code-Fix, **keine** neue Migration —
`schema_version` bleibt **48**.
