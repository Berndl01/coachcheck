# FIX v3_64 — i18n Welle 3d-i: Content-Seiten

## Was
Die öffentlichen Content-Seiten kontakt, musterbericht und archetyp schalten DE/EN — das Chrome.
Report-Probe und Archetyp-Portrait bleiben Deutsch (psychometrischer Inhalt, geflaggt).

## Übersetzt
- **kontakt** (Server): Hero (Kicker, Headline, Lead — ausgewählt/Standard), Plan-Labels,
  Seitentitel (statische `metadata` → `generateMetadata` mit getT).
- **contact-form** (Client): vollständiges Formular — alle Labels, Select-Optionen (Produktnamen
  bleiben, „ab"→„from" / Preisformat lokalisiert), Platzhalter, Datenschutz-Hinweis, Honeypot-Label,
  Sende-Zustand, Fehler.
- **musterbericht** (Server): NUR Banner („Anonymisiertes Beispiel …", PDF-Download, „Eigenen
  Report starten") und Schluss-CTA. Die Report-Probe selbst bleibt unangetastet.
- **archetyp/[slug]** (Server): NUR Premium-Gate (Zugang gesperrt) und Upsell-CTA.

## Bewusst Deutsch belassen (Report-/Portrait-Grenze, geflaggt)
- **musterbericht** ist eine vollständige anonymisierte Report-Probe: 6 Kernachsen (Pol-Labels),
  Führungsreife (Labels + Bänder), 7 Module (Titel + Text), Executive Summary, Paradoxien,
  Kippmuster, Entwicklungsprogramm — bleibt Deutsch wie der echte Report.
- **archetyp** rendert das Archetyp-Portrait aus `ARCHETYPE_DEEP_DIVES` + DB (`name_de`,
  `kernmuster`): DNA, fünf Alltags-Szenen, Spieler profitieren/leiden, Shadow Pattern, drei
  Reifestufen, Führungsenergie — inkl. aller eng gebundenen deutschen Überschriften. Der
  Hero-Kicker „Deep-Dive · Archetyp-Portrait" bleibt mit-Deutsch (Portrait-Präsentation).
  `personal-section` (KI-personalisiert) unangetastet Deutsch.

## Wörterbuch
4 neue Sektionen (kontaktPage, contactForm, musterbericht, archetypePage), DE/EN strukturgleich.
Jetzt 59 Sektionen gesamt.

## Tests
Keine Repoints nötig — keine String-Assertions auf den konvertierten Strings.

## Verifikation
- Report-Probe + Portrait nachweislich weiter Deutsch (Scan grün); Chrome-Strings ersetzt;
  contact-form ohne Residual-Deutsch.
- Gates: tsc OK · claimcheck 65 · vitest 355/355 (34) · eslint OK · next build Exit 0
  · npm audit 0 · PDF 4/4.

## Verbleibend (Welle 3 — letzter Schritt)
3d-ii Saison-Monitor: `saison` (+ `[id]`), `season-control` (432 Z), `create-form`. Management-
Chrome, voll übersetzbar; inkl. Saison „Zugriff gesperrt" + Test-Repoint. Danach Welle 3 fertig.
Siehe I18N.md.
