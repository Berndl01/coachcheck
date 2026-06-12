# UPGRADE — CoachCheck v2: Diagnose → Entwicklungsbegleiter

Stand: 2026-05-30

Dieses Upgrade vertieft jede Stufe (mehr & bessere Fragen) und verbindet
erstmals den **Humatrix Science Knowledge Core v2** (25 Module, 34
evidenzbasierte Interventionen, 74 Quellen) mit der App. Jeder Trainer ab
Tier 2 erhält jetzt ein konkretes, profilbasiertes **Entwicklungsprogramm**
(14 / 30 / 90 Tage) — claim-sicher, ohne Diagnose-Behauptung.

---

## 1. Datenbank — NEUE MIGRATION (Pflicht)

`supabase/migrations/15_item_pool_expansion.sql`

Im Supabase SQL Editor **nach** Migration 14 ausführen. Inhalt:

- **28 neue Premium-Items** über alle 7 Module. Schwerpunkte:
  - Mehr **Wichtig-vs-Gelebt-Paare** (`gap_wichtig` / `gap_gelebt`) —
    das stärkste Entwicklungssignal (Selbstbild vs. gelebte Praxis).
  - Neue **Szenarien & Dilemmata** pro Modul (situative Tiefe).
  - Neue Sub-Dimension **Wirkungstransparenz** (Absicht vs. Wirkung).
- Idempotent (`on conflict (code) do nothing`) — gefahrlos mehrfach lauffähig.
- **Ehrliche Metadaten-Aktualisierung** der realen Item-Zahlen:

  | Paket | vorher | nachher |
  |---|---|---|
  | Schnelltest | 19 | **27** (9 Min) |
  | Selbsttest | 64 | **92** (28 Min) |
  | 360° Spiegel | 64 | **92** (40 Min) |
  | TeamCheck (Trainer) | 51 | **77** (27 Min) |

> Keine Preisänderung. Migration 14 (Preise) bleibt unberührt.

---

## 2. Neue Code-Module (Know-how-Engine)

- `lib/knowledge/development-core.ts`
  Typisierter Auszug aus dem Science Knowledge Core (25 Module + 34
  Interventionen). **Generiert aus den echten JSON-Daten**, nicht erfunden.
  Enthält Claim-Grenzen (allowed/forbidden) pro Modul.

- `lib/knowledge/development-matcher.ts`
  Verbindet das Profil (Achsen-Extreme, Führungsreife-Lücken,
  Wichtig-vs-Gelebt-Lücken) mit den passenden evidenzbasierten Bausteinen
  und priorisiert sie nach Dringlichkeit + Evidenzstärke (A > A- > B+ > B).
  Liefert `matchDevelopmentProgram()` und `buildProgramPromptBlock()`.

---

## 3. Geänderte Dateien

- `lib/ai/report-prompt.ts`
  - Importiert die Matching-Engine.
  - Neues Eingabefeld `moduleGaps` (Wichtig-vs-Gelebt je Modul).
  - Neues Output-Feld `entwicklungsprogramm` (kernfokus + 14/30/90-Tage +
    wissenschaftlicher_hinweis) — nur ab Tier 2.
  - System-Prompt-Prinzip #9: Programm wird **ausschließlich** aus den
    vorausgewählten evidenzbasierten Bausteinen abgeleitet, in
    Beratersprache übersetzt — keine internen IDs/Quellen, keine Diagnose.

- `app/api/assessment/[id]/report/route.ts`
  - Berechnet `moduleGaps` aus `gap_wichtig` / `gap_gelebt` und reicht sie
    an den Report-Generator weiter.

- `lib/pdf/report-document.tsx`
  - Neue PDF-Seite „08 — Entwicklungsprogramm" (14/30/90-Tage-Bausteine +
    Einordnungs-Callout). Rendert nur, wenn das Feld vorhanden ist.

- Landingpage-Texte auf die neuen Zahlen + „Entwicklungsprogramm" abgestimmt:
  `components/landing/how-it-works.tsx`, `hero.tsx`, `stats-strip.tsx`,
  `products.tsx`.

---

## 4. Deployment-Reihenfolge

1. Migration `15_item_pool_expansion.sql` im Supabase SQL Editor ausführen.
2. Code deployen (Vercel). Keine neuen Env-Variablen nötig.
3. Optional: einen Test-Report (Tier 2) erzeugen und prüfen, dass die Seite
   „Entwicklungsprogramm" erscheint und die Bausteine zum Profil passen.

## 5. Governance (unverändert eingehalten)

- Keine klinische Diagnostik — nur Entwicklungs- & Coachinghinweise.
- Humatrix-Typen bleiben Coaching-Hypothesen.
- Interne Methodik, Quellen und Evidenzgrade erscheinen NIE im Kundenreport.

---

# UPGRADE v2.1 — WOW-Moment & Claim-Garantie (2026-05-30)

Adressiert die ehrliche Schwachstelle: Die Sofort-Ergebnisseite war
statisch pro Archetyp (Horoskop-Gefühl). Jetzt sieht der Trainer sofort
eine **personalisierte Signatur-Lesung** aus seinen echten Werten.

## Neu

- `lib/insight/instant-signature.ts`
  Deterministische, sofortige Signatur-Lesung (ohne KI/Wartezeit) aus den
  6 Kernachsen: Headline-Schlagworte, präziser Lese-Text mit echten
  Prozenten, schärfste Spannung, Kippmuster unter Druck, Sofort-Hebel.

- `app/assessment/[id]/result/page.tsx`
  Neuer Abschnitt „Deine persönliche Signatur" direkt nach dem Hero.
  Die statischen Archetyp-Listen sind jetzt ehrlich als „Typische Muster
  deines Archetyps" gerahmt (kein Personalisierungs-Vortäuschen mehr).

- `lib/knowledge/claim-guard.ts`
  Sicherheitsnetz aus der v3-Claim-Engine: gesperrte Begriffe (Diagnose,
  garantiert, beweist, mental schwach, unbeliebt, „wird funktionieren" …)
  werden vor der Ausgabe garantiert durch claim-sichere Entsprechungen
  ersetzt. Audit landet in `reports.metadata.claim_audit`.

- `app/api/assessment/[id]/report/route.ts`
  Claim Guard läuft über alle generierten Texte; PDF-Seitenzahlen um die
  Entwicklungsprogramm-Seite korrigiert (Tier 2: 12, 360°: 15, TeamCheck:
  17/19).

## Strategische Einordnung (v3 ELITE)

Der Science Knowledge Core v3 ELITE (Spieler-Itembank, Spieler-Typ-
Intelligenz v8, SNA, Validierungslabor, 92 Quellen, 62 Interventionen) ist
die Blaupause für die **große Pro-Club-Software** mit Beratung — nicht für
die günstige CoachCheck-Selbstbedienung. Diese Trennung stützt die
Preislogik: CoachCheck = günstig & self-serve; Pro Club = teuer & begleitet.

---

# UPGRADE v2.2 — Musterbericht & Führungsreife sichtbar (2026-05-30)

## Neu

- `components/landing/sample-report.tsx` + Einbindung in `app/page.tsx`
  Teaser-Sektion „Sieh dir an, was du bekommst" mit anonymisiertem
  Report-Auszug und CTA zum vollständigen Musterbericht.

- `app/musterbericht/page.tsx`
  Vollständiger, anonymisierter Beispiel-Report zum Durchblättern
  (Cover, Executive Summary, Kernachsen, Paradoxien & Kippmuster,
  Führungsreife, 7 Module, Entwicklungsprogramm 14/30/90). Klar als
  Beispiel gekennzeichnet, mit CTA zum Paket-Wählen. Stärkster
  Verkaufshebel auf der Seite.

- `app/assessment/[id]/result/page.tsx`
  Neue Sektion **Führungsreife** (6 Reifedimensionen mit Balken +
  Qualitätsband) direkt auf der Ergebnis-Seite — vorher nur im PDF.
  Wird ab Tier 2 berechnet (aus Achsen + Modul-Trends).

## Offen / Business-Entscheidung (an Bernie)

Tier 4 (TeamCheck) und Tier 5 (Saison & Beratung) sind die Stufen mit
menschlichem Input vom Humatrix-Team. Tier 5 signalisiert das bereits
(„Quartals-Call mit Mindset-Coach", „Persönliche Begleitung"); Tier 4
nennt aktuell nur den 14-Tage-Maßnahmenplan. Vor dem Hardcoden der
Service-Versprechen muss der genaue menschliche Lieferumfang je Stufe
bestätigt werden (Anzahl Calls, Umfang, wer liefert).

---

# UPGRADE v2.3 — Human-Led Pricing ab Tier 4 (2026-05-30)

## Strategische Entscheidung
Ab Tier 4 kommt menschliche Begleitung vom Mind-Club-Team. Menschliche Zeit
skaliert nicht — deshalb steigt der Preis dort deutlich. Der Sprung IST der
Beweis, dass das Know-how Geld kostet.

## Migration (Pflicht, nach 15)
`supabase/migrations/16_human_led_tier_pricing.sql`
- TeamCheck €399 → **€890** (inkl. 60-Min-Auswertungs-Call + Maßnahmenplan)
- Saison & Beratung €1.499 → **€3.900** (6 Monate 1:1-Begleitung)
- Tier-4/5-Features auf „So begleiten wir dich" umgeschrieben (★-Marker für
  menschliche Leistungen).
- Tier 1-3 unverändert (€19 / €79 / €199).

## Frontend
- `components/landing/products.tsx`: „★ Mit persönlicher Begleitung"-Badge für
  Tier ≥ 4; NOTE_MAP angepasst. Preise/Features kommen aus der DB.
- `components/landing/faq.tsx`, `app/kontakt/contact-form.tsx`,
  `app/kontakt/page.tsx`: Preistexte auf 890 / 3.900 aktualisiert.
- `app/assessment/[id]/result/page.tsx`: TeamCheck-Sektion zeigt jetzt den
  persönlichen Auswertungs-Call („★ Dein persönlicher Teil").

## Hinweis
Tier 4/5 nutzen bereits „Anfrage stellen" → /kontakt (kein Direkt-Checkout) —
passend für menschliche Begleitung. Exakte Leistungsdetails (Call-Länge,
Anzahl Saison-Calls) sind im Code als sinnvolle Defaults gesetzt und in einer
Zeile / einem Feature-String anpassbar.

## v5 CLUB OS ELITE — Einordnung
Überwiegend Pro-Club-OS (Spieler-Management, Manager-Frameworks, Saison-
Rhythmus, Team-Composition). Bestätigt die Produkttrennung: CoachCheck =
günstige Selbstbedienung; Club OS = teures, begleitetes Produkt. Nicht in die
günstigen CoachCheck-Tiers gemischt.

---

# UPGRADE v2.4 — Re-Check / Verlauf (2026-05-30)

Schließt die "Einmal-Foto"-Lücke: aus der Standortbestimmung wird ein
Entwicklungsbegleiter mit Fortschrittsanzeige (Wiederkauf-Hebel).

## Migration (Pflicht, nach 16)
`supabase/migrations/17_progress_maturity_store.sql`
- `assessments.maturity_scores jsonb` (nullable, additiv, idempotent).

## Code
- `app/api/assessment/[id]/finalize/route.ts`
  Berechnet die Führungsreife schon beim Finalisieren (aus Achsen +
  Modul-Trends) und speichert sie in `maturity_scores`.
- `lib/insight/progress.ts`
  `buildProgressComparison(current, previous)` → Achsen-Verschiebungen
  (neutral) + Reife-Deltas (gerichtet) + claim-sichere Headline & Summary.
  Fällt ohne früheren Reife-Snapshot automatisch auf Achsen-Vergleich zurück.
- `app/assessment/[id]/result/page.tsx`
  Sucht das jüngste frühere Assessment desselben Trainers und zeigt — falls
  vorhanden — die Sektion „Deine Entwicklung" mit Vorher/Nachher-Balken
  („Konfliktreife 55 % → 68 % ▲ +13"). Erstnutzer bekommen einen Re-Check-
  Hinweis (in 8–12 Wochen wiederholen).

## Wirkung
- Bestehende Assessments: maturity_scores = NULL → Achsen-Fallback, kein Bruch.
- Ab jetzt finalisierte Assessments tragen den vollen Reife-Snapshot.

---

# FINALE ENDKONTROLLE (Audit) — 2026-05-30

Systematische, maschinelle Gegenprüfung aller Module/Inhalte:

## Datenintegrität (Items)
- 104 Item-Zeilen (03 + 06 + 15), **0 doppelte Codes**.
- Alle Trainer-Item-Formate gültig; alle Achsen-Gewichte gültig & in [-1,1].
- Alle JSON-Blobs valide (84 + 14 + 40).
- Spieler-Dimensionen (coach_impact, psy_safety, team_klima, leistungsdruck,
  klarheit) nachweislich im Report-Route konsumiert — keine toten Keys.

## Wissens-Engine
- 34 Interventionen, 25 Module — **0 Probleme**.
- Alle 17 im Matcher referenzierten Interventionen existieren, haben Framings,
  gültige Evidenzgrade (A/A-/B+/B), nicht-leere Schritte & Kontraindikationen.
- Achsen-Keys konsistent über matcher, instant-signature, progress, result page.
- Reife-Keys konsistent (result page importiert MATURITY_KEYS = DRY).

## Claim-Sicherheit
- Claim-Guard deckt v3- & v5-Verbotsbegriffe ab (Diagnose, garantiert,
  beweist, mental schwach, unbeliebt, isoliert, Krankheit …).
- NEU ergänzt: Erfolgs-/Sieggarantie ("garantiert mehr Siege" → "verbessert
  die Prozessqualität"). Sauberer Text bleibt unverändert (kein False-Positive).

## Konsistenz
- Migrationen 01–17 lückenlos & geordnet.
- Preise DB (89000/390000) ↔ Frontend (890/3.900) deckungsgleich.
- Report-Seitenzahlen überall einheitlich (7/12/15/17–19).
- entwicklungsprogramm: Prompt erzeugt ↔ PDF rendert (konsistent).
- Alle neuen lib-Module: TypeScript-Typecheck sauber.

Ergebnis: **keine offenen Daten- oder Referenzfehler.**

---

# UPGRADE v2.6 — Wissenschaftliche Grundlage & forschender Gründer (2026-05-30)

## Neu
- `components/landing/science-foundation.tsx` + Einbindung in `app/page.tsx`
  (Position 10, nach Architecture). Stellt das Fundament dar:
  - 130+ peer-reviewte sportpsychologische Quellen, evidenz-gemappt.
  - Sechs verankerte Theorien (Selbstbestimmung, Achievement-Goal,
    transformationale Führung, Goal-Setting, Teamkohäsion, Druck/Reset).
  - Gründer-Autoritätskarte: **Mag. Bernhard Lampl, PhD · BSc · MBA · LL.M. · MBA**
    (exakt wie im Impressum/AGB) — forschender Gründer, Forschung + Praxis.
  - Präzise Sprache: „wissenschaftlich fundiert" statt „validiert"; weiterhin
    klar „keine klinische Diagnose, keine Erfolgsgarantie".
- `app/musterbericht/page.tsx`: Methodik-/Gründer-Credit auf dem Cover.

## Hinweis (für später, falls gewünscht)
Konkrete Dissertationsangaben (Thema, Jahr, Universität, gestützte Konstrukte)
sind noch nicht eingebaut — sobald geliefert, lassen sie sich präzise in die
Gründerkarte ergänzen (z. B. „Dissertation zu … , Universität … , Jahr …").

---

# UPGRADE v2.7 — Wissenschafts-Sektion: Literatur statt Person (2026-05-30)

Auf Wunsch: Gründer aus dem Marketing entfernt, stattdessen echte Literatur
aus der Wissensdatenbank (seriöser & belegbar).

- `components/landing/science-foundation.tsx`: rechte Karte zeigt jetzt eine
  kuratierte **Quellen-Auswahl** (7 echte Referenzen aus den 130, je 1 pro
  Thema, mit Evidenzgrad) statt der Gründerkarte:
  Mossman/Slemp/Lewis 2022 · Williamson 2024 · Jowett & Ntoumanis 2004 ·
  Fransen 2015 · Cooke 2024 · Chelladurai & Saleh 1980 · Glandorf 2022.
  Stat-Chips: 130 Quellen · 54 Reviews & Meta-Analysen · 7 Module · 6 Achsen.
- `app/musterbericht/page.tsx`: Cover-Credit ohne Person, neutrale Methodik-Zeile.
- Zahl exakt 130 (nicht "über/130+") — Daten-Ehrlichkeit.
- "Lampl" erscheint nur noch auf Rechts-/System-Seiten (Impressum/AGB/E-Mails) —
  rechtlich korrekt, im Marketing entfernt.

---

# UPGRADE v2.8 — AGB & Datenschutz bereinigt (2026-05-30)

## AGB (`app/legal/agb/page.tsx`) — neu strukturiert
- Korrekte Produktliste (alle 5 Pakete), Trennung digital vs. persönliche Begleitung.
- Claim-konforme Formulierung: „keine psychologische, medizinische oder klinische
  Diagnose, keine Erfolgsgarantie".
- §7 Widerrufsrecht sauber getrennt:
  - Digitale Inhalte (Tier 1-3): Verlust des Widerrufsrechts bei Ausführungsbeginn
    (§ 18 Abs 1 Z 11 FAGG).
  - Dienstleistungen (Tier 4-5): anteilige Vergütung (§ 16 FAGG), Erlöschen nach
    vollständiger Erbringung (§ 18 Abs 1 Z 1 FAGG).
- Neu: Registrierung/Volljährigkeit, Leistungserbringung & Mitwirkung,
  Streitbeilegung/ODR, Muster-Widerrufsformular. §1-§12. Stand: Mai 2026.

## Datenschutz (`app/legal/datenschutz/page.tsx`) — Lücken geschlossen
- Neu „5. Übermittlung in Drittländer (USA)": Vercel/Anthropic/Resend, Art. 44 ff.
  DSGVO, SCCs / EU-US Data Privacy Framework; Hinweis, dass Assessment-Antworten
  zur Report-Erstellung an Anthropic übermittelt werden.
- Neu „10. Automatisierte Verarbeitung": KI-Generierung, aber keine automatisierte
  Entscheidung mit Rechtswirkung (Art. 22 DSGVO). Sauber neu nummeriert (1-10).

## Offen (Business-Entscheidung Bernhard, kein Code)
- USt-Status (Kleinunternehmer vs. USt-pflichtig) im Checkout/auf Rechnung festlegen.
- Transfermechanismus je Dienstleister final verifizieren (DPF-Zertifizierung).
- Endgültige juristische Freigabe trotz LL.M. empfohlen (länderspezifische Details).

---

# FINALE BUILD-VERIFIKATION — 2026-05-30

Erstmals vollständig ausgeführt (nicht nur statisch geprüft):

- `npm install` → 463 Pakete, ok.
- `tsc --noEmit` (ganzes Projekt) → **0 Fehler**. Bestätigt: der frühere
  "textBlock.text"-Hinweis war reines Stub-Artefakt der Isolat-Prüfung.
- `next build` → **✓ Compiled successfully, Exit 0**, alle Routen generiert
  (inkl. /musterbericht, /legal/agb, /legal/datenschutz, /assessment/[id]/result).
- `eslint` aller geänderten Dateien → 0 Fehler (3 gemischte Anführungszeichen
  korrigiert: &bdquo;…&ldquo;).

Damit ist die letzte offene Unsicherheit ("Build nie ausgeführt") geschlossen:
Das Projekt kompiliert sauber.
