> ⚠️ **ACHTUNG — TEILE DIESES DOKUMENTS SIND VERALTET (Stand vor v3_41).**
> Folge ausschließlich dem Abschnitt **„VERBINDLICHER DEPLOYMENT-STAND"** direkt unten.
> Die weiter unten stehenden alten Schritte dürfen NICHT befolgt werden, insbesondere:
> - **keine** direkten Schreibzugriffe über `rest/v1/answers` oder andere REST-Endpunkte,
> - **kein** Rollback auf alte/anonyme RLS-Policies (öffnet bereits geschlossene Sicherheitslücken),
> - veraltete Migrations-Angaben („Migration 12", „21 Migrationen") ignorieren.

## VERBINDLICHER DEPLOYMENT-STAND (v3_41)

1. **Migrationen in Reihenfolge ausführen: 01 → 38** (idempotent).
   Frische DB: alle. Bestehende Produktion: nur die noch fehlenden, in aufsteigender Reihenfolge.
2. **Schreibzugriffe nur serverseitig (service_role).** Keine direkten Browser-/REST-Writes auf
   `answers`, `assessments`, `seasons`, `pulse_cycles`, `pulse_invitations`, `pulse_responses`,
   `invitations`, `consent_records`.
3. **RLS niemals auf anonyme/offene Policies zurücksetzen.** Rollback nur strukturerhaltend.
4. **Env-Variablen:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`,
   `INVOICE_VAT_NOTE`, Turnstile-Keys.
5. **Stripe-Webhook + Crons aktiv:** confirmation-retry, withdrawal-retry, reminders.
6. **Vor Verkaufsfreigabe:** echter Stripe-End-to-End-Kauf inkl. Bestätigung, PDF,
   Freischaltung, Report und Refund/Widerruf.
7. **Datenschutz/Paywall (ab v3_41):** Saison nur mit bezahltem Tier-5-Kauf;
   Pulse-Aggregate erst ab 5 Antworten; öffentliche Tokens geben keine Einzelantworten zurück.

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

# 3. ERST DANN Migration anwenden
supabase db push  # wendet 12_rls_hardening.sql an
```

## Live-Test (in Reihenfolge, jedes Schritt prüfen!)

### Test 1: Trainer-Selbsttest (sollte unverändert funktionieren)

1. Login als bekannter Trainer-Account
2. Selbsttest oder Schnelltest starten, 3-4 Items beantworten
3. **In DevTools → Network:** Beim "Weiter"-Klick muss ein Request an
   `rest/v1/answers` (mit `Prefer: resolution=merge-duplicates`) erscheinen,
   Status 200/201.
4. ⚠️ **Wenn 4xx:** Migration 12 hat einen Bug — wahrscheinlich greift die
   neue `answers_update_own`-Policy nicht. Migration zurückrollen
   (drop policy + alte Policies wieder erstellen).

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
   - Response-Body: `{ ok: true, cycle_id: "...", saved: N }`
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

Wenn Live-Test rot:

```sql
-- Migration 12 rückgängig machen
drop policy if exists "answers_update_own" on public.answers;

create policy "invitations_anon_read_by_token"
  on public.invitations for select to anon, authenticated using (true);
create policy "invitations_anon_update"
  on public.invitations for update to anon, authenticated using (true);
create policy "invitation_answers_anon_insert"
  on public.invitation_answers for insert to anon, authenticated with check (true);
create policy "pulse_responses_anon_insert"
  on public.pulse_responses for insert to anon, authenticated with check (true);
create policy "pulse_invitations_anon_read"
  on public.pulse_invitations for select to anon, authenticated using (true);
```

Und auf Vercel den vorherigen Deploy promotern (alter Code arbeitet mit
diesen Policies). Dann in Ruhe debuggen.

**Aber bevor du Rollback machst:** Logs in Vercel checken
(`vercel logs --since 5m`) und mir die Fehlermeldung schicken. Der
Großteil der wahrscheinlichen Fehler ist von hier aus reparabel
ohne Rollback.
