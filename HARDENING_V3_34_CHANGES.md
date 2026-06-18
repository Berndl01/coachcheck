# CoachCheck — Änderungen v3_34

**Fokus:** Fortschritts-, Erinnerungs- und Info-Mails. CoachCheck verschickte
saubere Transaktions-Mails (Kauf, Report-fertig, 360°-Einladung, Kontakt), aber
**keine** Mails für Fortschritt/Erinnerung. Diese Lücke ist jetzt geschlossen —
in derselben Mechanik wie die Bestellbestätigung (gebrandet, Plain-Text-Fallback,
List-Unsubscribe, statusverfolgt, Cron-getrieben).

---

## Vier neue Mailtypen

### 1) Resume-Nudge — angefangenes, nicht beendetes Assessment
Geht an den Käufer, wenn ein Assessment 48 h `pending`/`in_progress` liegt. Zeigt
den **Fortschritt** (`Du bist bei 42 %`) und führt direkt zum Weitermachen.
Genau **eine** Erinnerung (`resume_reminder_count`), nur für bezahlte Assessments.

### 2) Rater-Reminder — Fremdbild-Geber hat nicht geantwortet
Erinnert eingeladene 360°-Geber nach 48 h, **höchstens 2×**
(`reminder_count`/`last_reminder_at`), respektiert Abmeldung
(`unsubscribed_at`) und Ablauf. Anonymitäts-Hinweis + eigener Abmelde-Link.

### 3) Trainer-Info — erste Einschätzung ist da
Sobald die **erste** Fremdeinschätzung eingeht, bekommt der Trainer eine kurze
Info (`1 von mind. 3`) — Bestätigung, dass es läuft.

### 4) Trainer-Trigger — genug Einschätzungen für den 360°-Report
Beim Erreichen von **3** Fremdeinschätzungen (Minimum für eine sinnvolle
360°-Auswertung, deckt sich mit der Polarisations-Mindestzahl): „Dein Report ist
bereit." Meilenstein-basiert (genau bei 1 und bei 3) → **kein Spam** bei 12 Ratern.

---

## Architektur
- `lib/email/progress-emails.ts` — Builder + Sender, gemeinsamer Marken-Rahmen.
- **Zeitbasiert (1+2)** über Cron-Endpoint `POST/GET /api/internal/reminders`
  (per `CRON_SECRET` geschützt; Vercel Cron setzt den Bearer automatisch).
- **Ereignisbasiert (3+4)** beim Abschluss einer Fremdbild-Einladung
  (`invitations/[token]/complete` ruft `notifyTrainerOnFremdbildResponse`).
- Migration `32_progress_reminder_tracking.sql`: Tracking-Spalten + partielle
  Indizes für die Cron-Queries.
- `vercel.json`: Cron-Pläne für `/api/internal/reminders` (alle 6 h) und
  `/api/internal/confirmation-retry` (alle 2 h). Frequenz je Vercel-Plan anpassbar.

## Gegen die echte DB bewiesen (nicht nur Tests)
Die riskante Stelle sind die Kandidaten-Queries (WHERE-Logik) und die Embeds —
gegen eine reale Postgres mit Testszenario verifiziert:
```
Resume-Kandidaten ... nur das alte, unfertige, bezahlte Assessment
                      (completed + zu-neu korrekt ausgeschlossen)       ✓
Rater-Kandidaten .... nur der offene Rater
                      (abgemeldet/completed/zu-neu/Limit ausgeschlossen) ✓
Meilenstein-Count ... completed Fremdbild korrekt gezählt                ✓
```
Zwei `profile:user_id`-Embeds direkt auf `assessments` hatten **keine** Präzedenz
(der FK zeigt auf `auth.users`, nicht `profiles`) — bewusst auf **explizite
Lookups** umgebaut, um genau die Fehlerklasse zu vermeiden, die Tests nicht fangen.
Das Rater-Embed nutzt das in einschaetzung/teamcheck erprobte nested-Pattern.

## Gates (alle grün — echter Code + echte DB)
```
tsc ✓ · claimcheck ✓ 54 · vitest ✓ 114 (vorher 105) · eslint ✓
next build ✓ EXIT 0, 9/9 (+ /api/internal/reminders registriert)
npm audit (omit dev) ✓ 0 · PDF ✓ 3/3
Migrationen 01–32 ✓ frisch von null, alle Assertionen grün
Kandidaten-Queries + Meilenstein-Count ✓ gegen echte DB bewiesen
```

## Deployment
- Migration **32** einspielen.
- `CRON_SECRET` setzen (schützt beide Cron-Endpoints; Vercel sendet den Bearer
  automatisch). `RESEND_API_KEY` muss gesetzt sein, sonst werden Mails nur
  geloggt statt versendet.
- Vercel Cron läuft via `vercel.json` automatisch; Frequenz ggf. an deinen Plan
  anpassen (Hobby = nur täglich).

## Ehrlicher Hinweis (unverändert)
Diese Mails sind hier gegen eine **rekonstruierte** DB bewiesen und bauen sauber.
Den echten Zustellweg (Resend live, Templates, Spam-Score) kann nur ein echter
Lauf auf deiner Infrastruktur bestätigen. Und der **Supabase-Auth-Template-Schritt**
(Login-/Reset-Mails im Dashboard) bleibt offen — das ist ein manueller Schritt im
Supabase-Dashboard, den ich von hier nicht setzen oder prüfen kann.
