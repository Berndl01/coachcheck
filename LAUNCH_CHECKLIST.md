> ✅ **VERBINDLICHER DEPLOYMENT-STAND — v3.42** (zuletzt aktualisiert mit der v3_43-Härtung).
> Maßgeblich ist ausschließlich dieser Abschnitt. Alle weiter unten stehenden alten Schritte
> sind VERALTET und dürfen NICHT befolgt werden — insbesondere direkte `rest/v1/answers`-Writes,
> ein Rollback auf anonyme RLS-Policies sowie veraltete Migrations-Angaben („Migration 12",
> „21 Migrationen").

## VERBINDLICHER DEPLOYMENT-STAND v3.42 — Migrationen 01 → 40

1. **Migrationen in Reihenfolge ausführen: 01 → 40** (idempotent).
   - **Frische Datenbank:** alle Migrationen `01 → 40` der Reihe nach.
   - **Bestehende Produktion (Stand 32 bereits angewendet):** nur die fehlenden, aufsteigend:
     **`33 → 34 → 35 → 36 → 37 → 38 → 39 → 40`**.

2. **PFLICHT-PREFLIGHT vor Migration 39** (Unique-Index „ein offener Cycle pro Saison"):
   Prüfen, ob in der Live-Datenbank bereits mehrere offene Cycles pro Saison existieren:
   ```sql
   select season_id, count(*)
   from public.pulse_cycles
   where status = 'open'
   group by season_id
   having count(*) > 1;
   ```
   - **Keine Treffer:** direkt fortfahren.
   - **Treffer:** Migration 39 räumt dies seit v3.42 selbst auf (pro Saison bleibt der Cycle mit
     der höchsten `cycle_number` offen, ältere werden ohne Snapshot archiviert). Wer vorab manuell
     bereinigen will, archiviert die älteren doppelten Cycles, sodass pro Saison genau ein Cycle
     `open` bleibt. Erst danach den Unique-Index bauen.

3. **Migration 40 (neu in v3.42):** Live-Antwortzähler offener Pulse-Cycles
   (`get_/refresh_pulse_cycle_response_count`, nur `service_role`) + Refund-Cascade-Backfill
   (bereits erstattete Käufe deaktivieren Einladungen + öffentlichen Share) + verschärfte RLS auf
   `pulse_cycles`/`pulse_invitations` (nur bei weiterhin bezahltem Kauf lesbar).

4. **Antworten ausschließlich über die Server-API.** KEIN direkter Browser-/REST-Write auf
   `answers`, `assessments`, `seasons`, `pulse_cycles`, `pulse_invitations`, `pulse_responses`,
   `invitations`, `consent_records`. Der korrekte Antwort-Pfad ist
   **`POST /api/assessment/[id]/answer`** — niemals `POST /rest/v1/answers`.

5. **RLS niemals auf anonyme/offene Policies zurücksetzen.** Rollback nur strukturerhaltend.

6. **Env-Variablen:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`,
   `INVOICE_VAT_NOTE`, Turnstile-Keys.

7. **Stripe-Webhook + Crons aktiv:** confirmation-retry, withdrawal-retry, reminders.

8. **Refund-Lockdown (Variante A, ab v3.42 konsistent):** Nach vollständiger Rückerstattung/Dispute
   sind gesperrt — neue Spieler-/Fremdbild-/Pulse-Tokens, bestehende Einladungslinks, der
   öffentliche Karten-Link (`share_enabled=false`, `share_token=null`), der Saison-Lesezugriff,
   die Report-Auslieferung und die Ergebnisseite.

9. **Datenschutz/Paywall:** Saison nur mit bezahltem Tier-5-Kauf; Pulse-Aggregate erst ab 5
   vollständigen Antworten; offene Tokens geben nie Einzelantworten zurück; ein Pulse-Cycle
   schließt mit Snapshot erst ab 5 Antworten (darunter nur „ohne Auswertung archivieren").

10. **Vor Verkaufsfreigabe — Live-End-to-End-Test (Pflicht):** Tier-5-Kauf → Vertrags-PDF
    empfangen → Assessment erst danach freigeschaltet → Saison anlegen → Pulse-Cycle starten →
    5 Tokens nutzen → Live-Zähler zeigt 1 → 5 → unter 5 kein Snapshot → ab 5 Snapshot + Trends →
    vollständigen Refund auslösen → alle oben genannten Sperren greifen.

Maßgeblicher Stand: siehe `BUILD_LOG.txt`.

---

# Pre-Launch Live-Test (10 Minuten)

**Was hier getestet wird:** Die kritischen Pfade, die durch RLS-Hardening
neu sind. Was getestet wurde durch mich: TypeScript, Build, statische
Validierung aller Token-Routes (12 Smoke-Tests grün). Was DU testen
musst: dass die echte Supabase-DB die neuen API-Calls korrekt verarbeitet.

## Deploy-Reihenfolge (NICHT vertauschen)

```bash
# 1. Code zuerst deployen
git push          # Vercel deployt automatisch

# 2. WARTEN bis Vercel grün meldet
#    (sonst läuft alter Code mit neuer RLS-Migration → harte Fehler bei aktiven Sessions)

# 3. ERST DANN Migrationen anwenden (Reihenfolge siehe oben: frische DB 01→40,
#    bestehende Produktion 33→34→35→36→37→38→39→40; Migration-39-Preflight beachten)
supabase db push
```

## Live-Test (in Reihenfolge, jedes Schritt prüfen!)

### Test 1: Trainer-Selbsttest (Antworten laufen über die Server-API)

1. Login als bekannter Trainer-Account
2. Selbsttest oder Schnelltest starten, 3-4 Items beantworten
3. **In DevTools → Network:** Beim "Weiter"-Klick muss ein Request an
   **`POST /api/assessment/[id]/answer`** erscheinen, Status 200.
   - **NICHT** erlaubt: ein direkter `POST`/`PATCH` an `/rest/v1/answers`.
     Antworten dürfen den Browser-/REST-Pfad nie nehmen — ausschließlich die Server-API.
4. ⚠️ **Wenn 4xx auf `/api/assessment/[id]/answer`:** Server-Logs (Vercel) prüfen —
   meist fehlt `SUPABASE_SERVICE_ROLE_KEY` oder die Migrationen 01→40 sind nicht vollständig
   angewendet. KEIN Öffnen der Tabellen für den Browser als „Fix".

### Test 2: 360°-Einladung anlegen + Token testen

1. Trainer-Account, 360°-Spiegel Assessment durchklicken bis zum Ende
2. Einladung erstellen, einen Token kopieren
3. **Inkognito-Browser, DevTools → Network offen:**
4. Öffne `https://coachcheck.humatrix.cc/einschaetzung/[TOKEN]`
5. "Einschätzung starten" klicken
   - Netzwerk-Tab muss zeigen: `POST /api/invitations/[token]/open` → 200
   - **NICHT:** `PATCH /rest/v1/invitations`
6. Erstes Item beantworten + Weiter
   - Netzwerk-Tab: `POST /api/invitations/[token]/answer` → 200
   - **NICHT:** `POST /rest/v1/invitation_answers`
7. Bis zum Ende durchklicken, "Abschließen"
   - Netzwerk-Tab: `POST /api/invitations/[token]/complete` → 200

8. **Anti-RLS-Verifikation (das ist der entscheidende Check):**
   Im Inkognito-Browser DevTools Console öffnen, ausführen:
   ```js
   fetch('https://YOUR_SUPABASE.supabase.co/rest/v1/invitations?select=*', {
     headers: {
       apikey: 'YOUR_ANON_KEY',
       Authorization: 'Bearer YOUR_ANON_KEY',
     },
   }).then(r => r.json()).then(console.log)
   ```
   → Muss **leeres Array** zurückgeben (oder Auth-Fehler), nicht etwa
   die ganze Einladungsliste. Wenn da Daten kommen, ist Migration 12
   nicht angewendet oder eine Policy hat noch `using (true)`.

### Test 3: Pulse-Submit

(Nur wenn ihr aktive Pulse-Cycles habt — sonst kann das im normalen
Saison-Test mitgeprüft werden.)

1. Pulse-Token öffnen
2. Alle Items beantworten, abschicken
   - Netzwerk-Tab: `POST /api/pulse/[token]/submit` → 200
   - Response-Body: `{ ok: true, saved: N, responseCount: M }`
3. Falls 409 "No open pulse cycle": kein aktiver Cycle in der DB —
   im Trainer-Account neuen Cycle starten.

### Test 4: Stripe-Checkout (Smoke)

(Bleibt komplett unangetastet von meinen Änderungen, aber zur Sicherheit:)

1. Auf `/checkout/selbsttest` gehen
2. Test-Karte 4242 4242 4242 4242
3. Checkout durchführen
4. In `/dashboard` muss das neue Assessment erscheinen

## Fail-Fast-Indikatoren während des Tests

- Fehler "Invitation has no resolvable tier" → Assessment hat
  vermutlich eine kaputte product_id (Daten-Issue, nicht Code-Issue)
- Fehler "Item not allowed for this invitation" → das Item ist nicht
  im `package_tiers`-Array des Produkts; Daten-Issue
- 404 auf alle neuen API-Routes → Vercel-Build nicht durch ODER Routes
  liegen im falschen Verzeichnis (Pfade prüfen)
- 500 mit "DB error" → ENV-Var `SUPABASE_SERVICE_ROLE_KEY` fehlt im Vercel

## Rollback-Plan (worst case)

> ⚠️ Die früher hier dokumentierten SQL-Befehle, die anonyme `using (true)`-Policies
> wiederherstellten, wurden ENTFERNT — sie hätten alle geschlossenen Berechtigungs-/
> Datenschutzlücken wieder geöffnet (offener Lesezugriff auf Einladungen, anonyme
> Inserts, lesbare anonyme Antworten). NICHT mehr verwenden.

Sicherer Rollback, falls ein Live-Test rot ist:

1. Auf Vercel den vorherigen, funktionierenden Deploy promoten (Code-Rollback).
2. **Keine** RLS-Policies auf `anon ... using (true)` zurücksetzen. Migrationen sind
   idempotent und additiv — ein Schema-Rollback ist nicht nötig und nicht erwünscht.
3. Fehler in Ruhe anhand der Server-Logs (Vercel) und der Supabase-Logs debuggen.
4. Schreibzugriffe laufen ausschließlich serverseitig (service_role); ein „Öffnen"
   der Tabellen für den Browser ist nie die richtige Lösung.

**Aber bevor du Rollback machst:** Logs in Vercel checken
(`vercel logs --since 5m`) und mir die Fehlermeldung schicken. Der
Großteil der wahrscheinlichen Fehler ist von hier aus reparabel
ohne Rollback.
