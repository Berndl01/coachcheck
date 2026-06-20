# FIX v3_62 — i18n Welle 3b-2b: Result/Report (operatives Tooling)

## Was
Die Ergebnis-/Report-Seite schaltet jetzt DE/EN — aber nur das **operative Tooling**.
Der eigentliche psychometrische **Report-Inhalt bleibt Deutsch** (geflaggt). Das war der
heikelste Block: hier wird der bezahlte Report angezeigt, die Trennlinie ist scharf gezogen.

## Übersetzt (operatives Tooling)
- app/assessment/[id]/result/page.tsx (Server, chirurgisch): Zugriff-gesperrt-Block,
  „Dein Ergebnis"/Deep-Dive-Link, die Abschnitte 360°-Einladung, TeamCheck, Kontext,
  Premium-Report-CTA und Next-Steps (Abschnitts-Chrome: Überschriften + Erklärtexte + Buttons).
- 7 Komponenten (alle Client):
  - report-generate-button (Status/Fehler/Tier-Beschreibungen; friendlyReportError → in Komponente)
  - action-focus-card (Karten-Chrome; lever/plan.action bleiben Deutsch = Inhalt)
  - share-card-button (Teilen-Tooling)
  - context-form (Formular + Optionen; SEASON/MATURITY/CONFLICT in Komponente, DB-Keys bleiben)
  - recognition-feedback (Feedback-Widget; SECTIONS in Komponente, DB-Keys bleiben)
  - invitations-manager (360°-Einladungen; STATUS_LABELS → {label,color} via t(); Datum via useLocale)
  - teamcheck-manager (Spieler-Token; STATUS_LABELS, Token-/Zähl-Templates; Datum via useLocale)

## Bewusst Deutsch belassen (Report-Grenze, geflaggt)
Der analytische Report-Inhalt der result-Seite bleibt unangetastet Deutsch:
- result-reveal (gestaffelte Enthüllung), Signatur-Abschnitt, Verlauf/Entwicklung,
  „Funktionale Signatur"/„Deine 6 Kernachsen" inkl. AXIS_LABELS (Pol-Namen Intuitiv/Strukturiert …),
  „Führungsreife" inkl. MATURITY_LABELS + maturityBand, Stärken/Risiken/Hebel, Spielertyp-Matrix,
  Bedienungsanleitung. Die eng an den deutschen Inhalt gebundenen Abschnitts-Überschriften bleiben
  mit-Deutsch, damit jeder Report-Block in sich kohärent ist (kein englischer Header über deutschem
  Analyse-Absatz). Durchgereichte Inhalts-Props (lever/plan.action) bleiben Deutsch.
- Volle EN-Report-Ausgabe = Fachübersetzung + EN-Generierung in lib/insight/lib/scoring +
  revalidierte Modell-Labels (AXIS/MATURITY/maturityBand). Eigene Spur.

## Wörterbuch
8 neue Sektionen (resultPage, reportGenerate, actionFocus, shareCard, invitations, teamcheck,
contextForm, recognitionFeedback), DE/EN strukturgleich. Jetzt 48 Sektionen gesamt.

## Tests
3 Source-Assertions aufs Wörterbuch umgezogen (verschobene deutsche Strings):
- action-area-v3-48 (CARD → actionFocus.set; DE prüft den deutschen Text)
- hardening-v3-43 (result „Zugriff gesperrt" → resultPage.lockedKicker; DE_DICT ergänzt; die
  Saison-Assertion bleibt unverändert, da app/saison/[id] noch unkonvertiert ist → 3d)
- result-feedback-v3-45 (WIDGET → recognitionFeedback.h3; DE_DICT ergänzt)

## Verifikation
- Report-Inhalt-Überschriften nachweislich weiter Deutsch (Scan grün); Tooling-Strings ersetzt;
  7 Komponenten ohne Residual-Deutsch.
- Gates: tsc OK · claimcheck 65 · vitest 355/355 (34) · eslint OK · next build Exit 0
  · npm audit 0 · PDF 4/4.

## Verbleibend (Welle 3)
3c Token-Flows (einschaetzung/teamcheck/pulse/karte — Instrument-Grenze gilt erneut).
3d Content-Seiten (saison, kontakt, musterbericht, archetyp) — inkl. Saison „Zugriff gesperrt".
Siehe I18N.md.
