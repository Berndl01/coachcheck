# CoachCheck — Gap-Analyse: Ist-Stand (v3_43) → Bestcase-Vision

Abgleich des aktuellen Codestands gegen das verbindliche Produkt-/UX-Konzept „CoachCheck Bestcase".
Stand: v3_43, geprüft per Code-Greps (nicht aus dem Gedächtnis).

## TL;DR

Das Bestcase-Dokument teilt die Reise selbst in **Release 0–5**. Die Arbeit der letzten
Versionen (bis v3_43) ist **Release 0 — Sicherheit & Verkauf**. Dieser Block ist im Kern
fertig. **Alles, was CoachCheck vom „Test" zum „Führungssystem" macht — die Wow-Enthüllung,
der Aktionsbereich, der Saison-Monitor als echtes Instrument — ist Release 1–5 und liegt
größtenteils noch vor uns.**

Kurz: Das Fundament steht. Das Produktversprechen aus dem Dokument ist noch nicht gebaut.

Legende: ✅ erfüllt · 🟡 teilweise / funktional aber nicht wie im Soll · ⛔ fehlt · 🔬 Forschung/später

---

## BLOCK A — Release 0: Sicherheit & Verkauf (überlappt unsere bisherige Arbeit)

Das ist der Abschnitt 28 („Pflichtkorrekturen") + Entitlement Service + Refund/Deployment/Live-Test.

| Soll (Dok §28 / §29 Release 0) | Ist (v3_43) | Status |
| --- | --- | --- |
| 1. Zentrale Entitlement-Prüfung für alle Einladungswege | `requireActiveAssessmentEntitlement` in allen 6 Routen | ✅ |
| 2. Einladungen nach Refund/Dispute sperren | Webhook-Cascade: invitations→expired, Share aus | ✅ |
| 3. Lesezugriffsregel Saisonhistorie nach Refund | `requireSeasonEntitlement` + Read-Gate Seite | ✅ |
| 4. Live-Antwortzähler offener Cycles | Migration 40 `refresh_pulse_cycle_response_count` | ✅ |
| 5. Schließen unter 5 blockieren | Close-Route 409 < 5 | ✅ |
| 6. Archivieren ohne Auswertung | Neue archive-Route | ✅ |
| 7. Deployment-Doku aktualisiert | GO-LIVE/LAUNCH/README auf 01→40 | ✅ |
| 8. Migration-39-Preflight (doppelte offene Cycles) | Self-Repair-Dedup in Mig 39 | ✅ |
| 9. Pulse-Token widerrufen + rotieren | revoke/rotate-Routen | ✅ |
| 10. Falsche Pause-/Versandtexte korrigieren | Runner + E-Mail bereinigt | ✅ |
| 11. Serverseitige Eingabegrenzen Saison/Cycles | Zod-Validierung | ✅ |
| 12. Maximale Tokenanzahl | Caps 200/Saison, 50–100/Request | ✅ |
| **13. Vollständiger Stripe-End-to-End-Test** | **nur live ausführbar — offen** | ⛔ (deine Aufgabe) |
| Refund-Regel **einmal eindeutig, überall identisch** (§25) | Variante A konsistent umgesetzt | ✅ |
| Rechnung/Invoice-Ablauf (§29) | kein Auto-PDF-Invoice (AGB entsprechend) | 🟡 bewusst offen |
| Produktions-Monitoring / Ops-Dashboard (§26) | `admin/checklist` + `admin/monitor` vorhanden | 🟡 Basis, nicht vollständig |

### Wichtige architektonische Lücke in Release 0

Das Dokument verlangt in §22 **einen** Entitlement Service mit **Capabilities**:
`requireActiveEntitlement({ userId, capability })` mit `assessment.self`, `report.premium`,
`invitation.360`, `teamcheck.tokens`, `season.pulse`, `share.profile` … und ausdrücklich:
„Keine einzelne Route darf eigene vereinfachte Paywall-Logik programmieren."

**Ist:** Wir haben **mehrere** Helfer (`requireActiveAssessmentEntitlement`,
`requireActiveInvitationByToken`, `requireSeasonEntitlement`, `checkPaidEntitlement`). Für das
**heutige** Produkt decken sie dasselbe Sicherheitsziel ab — aber es ist **nicht der eine,
capability-basierte Service** aus der Vision. Solange das Produkt klein ist, ist das ok. Sobald
Vereinskonten/Rollen (Release 5) dazukommen, wird die Konsolidierung zur Pflicht. → 🟡

**Fazit Block A:** Release 0 ist code-seitig praktisch abgeschlossen. Zwei echte Reste: dein
Live-E2E-Test und die Entscheidung, ob der Entitlement-Service jetzt schon auf das
Capability-Modell konsolidiert wird oder erst vor Release 5.

---

## BLOCK B — Die eigentliche Vision (Release 1–5): wohin es gehen soll

### Release 1 — Wow-Ergebnis

| Soll | Ist | Status |
| --- | --- | --- |
| Kostenloser Mini-Check, 8–12 Fragen, **ohne Registrierung**, Lead (§6) | `components/landing/mini-check.tsx` vorhanden | 🟡 vorhanden, Tiefe/No-Reg gegen Soll prüfen |
| Wow-Enthüllung als **5 gestaffelte Bildschirme** (§8 Ablauf D) | Eine Result-Seite mit vollem Report | 🟡 Inhalt da, Inszenierung fehlt |
| **Mischprofile** statt starrer Typzuweisung (§9) | Primär-/Sekundärtendenz vorhanden, aber keine „Mischprofil aus X und Y"-Sprache | ⛔ |
| Ergebnis-Kurzfassung in ~60 Sek erfassbar (§9) | Report ist umfangreich, keine 60-Sek-Schicht | 🟡 |
| Treffer-Feedback „Wie gut erkennst du dich wieder? 0–10" (§27) | nicht vorhanden | ⛔ |
| Coach Identity Card (§16) | share-Route + share-card-button + Karte | ✅ Basis vorhanden |

### Release 2 — Aktionsbereich (laut Dokument „die wichtigste Weiterentwicklung")

| Soll | Ist | Status |
| --- | --- | --- |
| Fokus-Auswahl nach Report + **Aktionsplan** (Ziel, Verhalten, Wenn-dann, Beobachtung, Review) (§11) | Report **enthält** einen 7-Tage-Plan als Text (development-core) | 🟡 Inhalt im Report, **kein interaktives System** |
| `action_plans` + `action_checkins` Tabellen (§24) | fehlen | ⛔ |
| **7-Tage-Schleife** mit Check-ins Tag 0/2/4/7 + Reminder (§12) | fehlt (Report-Text ≠ Schleife) | ⛔ |
| Dashboard mit **aktuellem Fokus an erster Stelle** (§20) | Dashboard zeigt Profil/Produkte, keinen aktiven Fokus | ⛔ |
| Aktionsplan-Zustandsmodell (suggested→…→completed) (§23) | fehlt | ⛔ |

→ **Das ist die zentrale Lücke zwischen „Test, der sich verkauft" und „Führungssystem".**

### Release 3 — 360° & Team

| Soll | Ist | Status |
| --- | --- | --- |
| 360°-Ablauf, Auswertung ab ≥ 3 (§13) | vorhanden, Anonymität ≥ 3 | ✅ |
| TeamCheck, anonyme Tokens/QR, Auswertung ab ≥ 5 (§14) | vorhanden, QR im teamcheck-manager, ≥ 5 | ✅ |
| **Resume-Geheimnis** (Token allein lädt keine Antworten) (§13) | fehlt — deshalb wurden die „pausieren"-Texte entfernt | ⛔ |
| Wahrnehmungslücken / unterschätzte Stärken / Streuung (§13) | Teil der Auswertung | 🟡 gegen Soll prüfen |

### Release 4 — Saison-System

| Soll | Ist | Status |
| --- | --- | --- |
| Pulse ≥ 5, kein Trend/Wert darunter, Untergruppen-Regeln (§15) | ≥ 5 erzwungen, Snapshot + Trends | ✅ |
| Live-Teilnahmezähler (count distinct token) (§15) | Migration 40 | ✅ |
| Tokenverwaltung: erzeugen/beschriften/widerrufen/rotieren/deaktivieren (§15) | bulk + revoke + rotate | ✅ Basis |
| **Cycle-Zustände** draft / open / **ready_to_close** / closed / archived_without_evaluation (§15/§23) | open / closed / expired / archived — kein explizites `ready_to_close`, ≥5-Gate beim Schließen statt als Zustand | 🟡 funktional nah, State-Machine anders |
| Saisonphasen, Maßnahmenhistorie, Saisonabschlussbericht (§15) | nicht modelliert | ⛔ |

### Release 5 — Skalierung

| Soll | Ist | Status |
| --- | --- | --- |
| Vereinskonten, mehrere Trainer, Rollen/Rechte, Lizenzen (§5/§29) | Einzelnutzer-Modell | ⛔ |
| Mehrsprachigkeit | Deutsch | ⛔ |
| Benchmarking/Normwerte (erst ab Datenbasis) | bewusst nicht vorhanden | 🔬 korrekt später |

---

## Querschnitt: Architektur, Daten, Betrieb

| Soll | Ist | Status |
| --- | --- | --- |
| **Report-Generierung** deterministisch, LLM nur Übersetzung, JSON-validiert, Fallback `generation_pending`, keine Modellnamen im Produkt (§18) | genau so umgesetzt (Scoring deterministisch, claim-guard, JSON-Validierung, Fallback, care-triggers) | ✅ **starke Übereinstimmung** |
| Upgrade-System `product_upgrades` (Differenzpreis) (§7) | fehlt | ⛔ |
| Referral-Mechanik (§17) | fehlt | ⛔ |
| `assessment_scores` (unveränderbare Score-Tabelle) (§24) | Scores nicht in dedizierter Immutable-Tabelle | 🟡/⛔ |
| `report_versions` (§24) | fehlt | ⛔ |
| `entitlements` + Capabilities (§24/§22) | fehlt (Funktions-Helfer statt Tabelle) | ⛔ |
| `content_versions` / Evidenzmatrix / Item-Lifecycle (§19/§24) | nicht als System | ⛔ / 🔬 |
| `audit_events` (§24/§25) | `lib/utils/audit.ts` + Mig 19 vorhanden | 🟡 Basis, Umfang prüfen |
| Produkt-Analytics-Events (§27) | kein Event-System | ⛔ |
| Reichere Zustandsmodelle: Kauf mit `partially_refunded`/`disputed`/`cancelled`; Assessment mit `report_queued`/`report_generating`/`revoked` (§23) | Kauf = paid/refunded; Assessment-Set schlanker | 🟡 vereinfacht |
| FAGG-Compliance (Vertrag, Widerruf, Consent-Snapshot, PDF) | vollständig (frühere Releases) | ✅ |
| Datenschutz: service_role serverseitig, RLS deny-by-default, keine Rohantworten an Trainer (§25) | umgesetzt + in v3_43 RLS verschärft | ✅ |

---

## Die drei wichtigsten Erkenntnisse

1. **Release 0 ist fertig — bis auf deinen Live-Test.** Das Produkt ist *sicher und
   verkaufbar*, sobald der echte Stripe/Supabase-Durchlauf grün ist. Das ist erreicht.

2. **Das, was CoachCheck laut Dokument besonders macht, existiert noch nicht.** Konkret:
   die gestaffelte Wow-Enthüllung (Release 1) und vor allem der **interaktive
   Aktionsbereich + 7-Tage-Schleife** (Release 2). Heute endet das Produkt beim Report/PDF.
   Das Dokument nennt den Aktionsbereich selbst „die wichtigste Weiterentwicklung der
   gesamten App" — und genau der fehlt.

3. **Die Report-Engine ist die stärkste Übereinstimmung mit der Vision.** §18 ist praktisch
   schon gebaut: deterministisches Scoring, LLM nur als Übersetzer, JSON-Validierung,
   Fallback, keine Modellnamen. Das ist ein echter Vorsprung — darauf lässt sich Release 1/2
   gut aufsetzen.

## Empfohlene Reihenfolge (deckt sich mit der Empfehlung im Dokument)

1. **Release 0 endgültig schließen:** Live-E2E-Test (Kauf → Vertrag → Aktivierung →
   Assessment → Report → Refund-Sperren) + Entscheidung Entitlement-Konsolidierung.
2. **Release 1 (Wow):** 5-Bildschirm-Enthüllung, Mischprofil-Sprache, Treffer-Feedback.
   Hoher Hebel, baut auf bestehender Report-Engine auf.
3. **Release 2 (Aktion):** `action_plans` + `action_checkins`, Fokus auf Dashboard,
   7-Tage-Schleife. **Hier entsteht der eigentliche Produktwert und die Weiterempfehlung.**
4. Danach 360°/Team-Politur (inkl. Resume-Geheimnis), Saison-Ausbau, Skalierung.

Nicht zuerst noch mehr Infrastruktur. Zuerst der Moment „Das bin ich" und der Schritt
„Das probiere ich morgen aus".
