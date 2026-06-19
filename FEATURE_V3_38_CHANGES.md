# FEATURE v3_38 — Wirkung je Spielertyp · Bedienungsanleitung · Teilbare Karte

Baut die drei aus dem Produkt-Review offenen Punkte sauber ein. Alle 7 Gates grün:
tsc · claimcheck (59) · **vitest 187/187** (v3_37: 176 → +11) · eslint · next build
(9/9 Seiten, `/karte/[token]` dynamisch) · npm audit 0 · PDF-Volltest (3/3, jetzt mit
den zwei neuen Abschnitten → größere PDFs).

---

## 1 · Wirkung je Spielertyp (strukturierte Matrix)

Vorher nur als Konzept eingewoben. Jetzt eine eigene, strukturierte Matrix über
vier Spielertypen — „Der selbstbewusste Leistungsträger", „Der unsichere,
zurückhaltende Spieler", „Der kreative Eigenständige", „Der junge
Entwicklungsspieler" — je mit **Wirkung** (wie dieser Stil bei dem Typ ankommt,
Stärke UND Reibung) und **Anpassung** (eine konkrete Handlung).

- KI-Schema-Feld `wirkung_je_spielertyp` + Schema-Instruktion (Tier ≥ 2).
- Deterministischer Builder `buildPlayerTypeMatrix` als Garantie/Fallback.
- Gerendert im PDF (Abschnitt „06b") und auf der Ergebnisseite.

## 2 · Bedienungsanleitung (teilbar: „so arbeitest du mit mir")

Die introspektive Hälfte gab es; neu ist die **weitergebbare** Hälfte: eine
kompakte Karte mit Archetyp, Kernsatz, 3 Stärken, „so erreichst du mich",
„so gibst du mir Feedback", „unter Druck", „bitte vermeiden".

- KI-Schema-Feld `bedienungsanleitung` + Builder `buildOperatingManual`.
- Gerendert im PDF (Abschnitt „06c") und prominent auf der Ergebnisseite.

**Gemeinsame Quelle:** `lib/insight/operating-manual.ts` — ein deterministischer
Builder, den Report-Fallback, KI-Merge, PDF, Ergebnisseite und die öffentliche
Karte identisch nutzen. Die Felder sind dadurch IMMER vorhanden (auch ohne KI):
in `generateReportTextsWithMeta` werden sie nach erfolgreichem KI-Parse ergänzt,
falls die KI sie nicht (vollständig) liefert.

## 3 · Teilbare Ergebniskarte (der soziale Moment)

Der Trainer kann seine **Profilkarte öffentlich teilen** — Opt-in, jederzeit
widerrufbar.

- Migration 37: `assessments.share_token` (UUID) + `share_enabled` + `shared_at`,
  Unique-Index auf den Token.
- API `app/api/assessment/[id]/share` (POST aktivieren / DELETE widerrufen):
  Eigentümer-gebunden, ratenbegrenzt, nur für fertige Ergebnisse
  (`completed`/`report_ready`).
- Öffentliche Seite `app/karte/[token]` (kein Login): liest ausschließlich über
  die service_role und gibt NUR die freigegebenen Kartenfelder zurück.

**Sicherheit / Datenschutz (bewusst eng gehalten):**
- Token ist eine zufällige, nicht erratbare UUID; `share_enabled` muss aktiv sein.
- Öffentlich sichtbar sind NUR: Archetyp-Name, Kernsatz, Stärken, Bedienungs-
  anleitung, Spielertyp-Matrix. **Keine** personenbezogenen Daten, **keine**
  E-Mail, **keine** Antworten, **kein** 360°-/Team-Bild, **kein** voller Report.
- `anon` erhält KEINEN direkten Tabellenzugriff (keine RLS-Lockerung).
- Die Karte ist auf `noindex` gesetzt (kein Suchmaschinen-Eintrag).
- Der Contract-Gate-Trigger (Migration 36) bleibt unberührt: die Share-Updates
  ändern keinen `status`.

---

## Datenbank — vor Go-Live ausführen

In Reihenfolge: **33 → 34 → 35 → 36 → 37** (idempotent). 37 fügt nur die
Share-Spalten + den Token-Index hinzu.

## Offen / nächster sinnvoller Schritt

- **Dynamisches OG-Bild** für die Karte (statt nur Text-Vorschau) — der stärkste
  Viralitäts-Hebel; aktuell unfurlt der Link mit Titel + Kernsatz als Text.
- Die öffentliche `/karte`-Route ist eine NEUE öffentliche Fläche — sie sollte
  beim echten Stripe-/Vercel-E2E-Durchlauf mit geprüft werden (Token aktivieren,
  Link öffnen, widerrufen → 404).
- Produktentscheidung bleibt: paarweiser Coach↔Spieler-Abgleich ist die
  PlayerCheck-Verzahnung (eigenes Projekt), kein CoachCheck-Patch.
