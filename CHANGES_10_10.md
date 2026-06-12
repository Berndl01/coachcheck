# CoachCheck — 10/10 Hardening (Abschluss)

Umsetzung der finalen Entwickler-Liste. Alle Gates grün:
`tsc --noEmit` · `claimcheck` (42 Dateien) · `vitest` (29 Tests) · `eslint` · `next build` · `npm audit` (0 Findings, prod **und** dev).

---

## P0 — vor Verkauf (erledigt)

**1. Finalisierung nur serverseitig.**
`components/assessment/runner.tsx` schreibt nicht mehr direkt nach Supabase und setzt **nie** `status='completed'`. Alle Antworten + Fortschritt laufen über die API. Schlägt `/finalize` fehl, bleibt das Assessment `in_progress`, es wird nicht navigiert. `completed_at`, `axis_scores`, `primary/secondary_archetype_id`, `maturity_scores`, `response_quality`, `signature` werden in **einem** atomaren Update gesetzt — die Zeile ist nie `completed` ohne diese Felder.

**2. Vollständigkeit erzwungen.**
`/finalize` lädt die erwarteten Items über `get_items_for_assessment` und verlangt **genau eine gültige Antwort je Item** (keine doppelten/fremden `item_id`s). Unvollständig → `HTTP 400 { expected, submitted, missingItemIds }`, kein Score, kein Archetyp, kein `completed`.

**3. Self-Assessment-Antworten serverseitig validiert.**
Neu: `app/api/assessment/[id]/answer/route.ts` — Auth + Ownership + Tier-Zugehörigkeit + Formatvalidierung (Likert/State/Gap 1–5, Spannungsfeld 0–1, Choice ∈ `options[].key`, genau ein Wertfeld). Der Runner nutzt ausschließlich diese Route.

**4. Consent erst nach aktiver Zustimmung.**
Der frühere Auto-Redirect ist ersetzt durch ein Consent-Gate: `app/checkout/[slug]/page.tsx` + `consent-form.tsx` (drei Pflicht-Checkboxen: AGB, Datenschutz, KI-Verarbeitung) + `start/route.ts`. Consent wird **erst dort** versioniert gespeichert (User, Typ, Version, Zeitstempel, Quelle, IP/UA-Hash) — danach Stripe. Stripe-ToS bleibt zusätzlich aktiv.

**5. Beispiel-PDF verkaufsreif.**
`docs/beispiel-report-fussball.pdf` (19 Seiten) neu gerendert aus kuratierten Premium-Texten (`lib/pdf/sample-report-data.ts`, fiktiver Trainer „Stefan Berger"). Keine leeren Premium-Seiten (Kontext-Seite hart gegated), keine Platzhalter/Fallback-Floskeln, Gesprächsleitfaden-Zahl dynamisch („5 offene Fragen"), Pfeil-Bullets durch font-unabhängige Marker ersetzt, Sonderzeichen `↔ ○ ● ⌀` ersetzt, Closing-Footer ohne Überlappung. **Marken-Fonts aktiv** (Manrope/Fraunces eingebettet).

## P1 (erledigt)

**6. KI-Fallback nicht als Premium.** Fällt die KI nach allen Retries aus, liefert die Report-Route **keinen** halbfertigen Report, sondern `503 { retryable:true }`; der Job wird freigegeben, das Frontend versucht automatisch erneut. `buildFallbackReport` ist zusätzlich claim-sicher und floskelfrei umgeschrieben.

**7. Report-Qualität automatisiert getestet.** `tests/report-content-quality.test.ts` lässt CI fehlschlagen bei „erneut/neu generieren", „vollständige Auswertung", „Zwischenstand", „nicht verfügbar", generischem „im persönlichen Gespräch", KI-Selbstbezug, Platzhaltern — geprüft für Fallback **und** Beispielreport, inkl. Gesprächsleitfaden-Konsistenz.

**8. 7 Module konsistent.** `components/landing/architecture.tsx` zeigt die kanonischen Module A–G; Copy auf „sieben Module" korrigiert; `README.md` auf 7 Module. Keine Treffer mehr für „6/sechs Module".

**9. Production-Build erzwungen.** `.github/workflows/ci.yml`: `npm ci → npm run ci → next build → npm audit --omit=dev`. Kein Deploy ohne grünen Lauf (Branch Protection auf `CI` setzen). Build-Artefakt wird archiviert.

**10. npm-Audit bereinigt.** `overrides.postcss` zieht die gepatchte Version in den ganzen Baum (inkl. Next-Transitive). Ergebnis: **0** Findings (prod und dev).

## P2 (erledigt)

**11. E2E-Gerüst.** `playwright.config.ts` + `tests/e2e/purchase-flow.spec.ts` (Smoke-Checks lauffähig; voller Kauf-Flow dokumentiert, benötigt Stripe-Test-Keys + Test-Login). Script: `npm run test:e2e` (vorher `npx playwright install`).

**12. Ergebnisseite gegen kaputte Zustände.** `result/page.tsx` prüft jetzt zusätzlich `axis_scores`, `primary/secondary_archetype_id`, `signature`, `completed_at`. Fehlt etwas → Recovery-Zustand (`recovery.tsx`) mit serverseitigem erneuten Finalize statt weißer Seite.

**13. PDF-Fonts wirklich aktiv.** `PDF_SANS='Manrope'` / `PDF_DISPLAY='Fraunces'` bei erfolgreicher Registrierung (sonst Helvetica-Fallback). Node-IO als statische ESM-Importe — funktioniert in App **und** Sample-Renderer.

**14. Admin-Monitoring.** `app/admin/monitor/page.tsx` (admin-gated): fehlgeschlagene Report-Jobs, KI-Fallback-Reports, „completed ohne Scores", „bezahlt ohne Assessment", „abgeschlossen > 15 min ohne Report", „bezahlt ohne Consent" — mit Lock-Reset-Button (`/api/admin/report-retry`).

## P3

**15. Texte/Feinschliff.** „Beratungswürdigkeit" im PDF mit erklärender Einordnung versehen (kein Urteil). Tonalität im Übrigen über die bestehenden Prompt-Prinzipien gesteuert.

---

## Vor dem Launch (unverändert offen, Infrastruktur)
- Produktions-Keys in Vercel: Stripe (inkl. `STRIPE_WEBHOOK_SECRET`), Resend, Upstash, Turnstile, `ANTHROPIC_API_KEY`, `ADMIN_EMAILS`.
- Supabase-Migrationen anwenden (inkl. 15–21).
- Branch Protection: Status-Check `CI` als Pflicht setzen.
- Live-Smoke-Test + Vercel-Deploy-Bestätigung.
- Beispiel-PDF final visuell freigeben.
