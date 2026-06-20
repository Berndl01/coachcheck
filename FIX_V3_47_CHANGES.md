# FIX v3_47 — Release 1, Baustein 4: Coach-Card-Pass (Bestcase §16) · Release 1 abgeschlossen

Letzter Release-1-Baustein. Schließt den in v3_44 **bewusst ausgesparten**
Mischprofil-Konsistenzpunkt: Die teilbare Coach Identity Card zeigt jetzt die
**starke Zweittendenz** und ist **mischprofil-bewusst** — konsistent zu Ergebnis-Seite
und PDF (§10 Konsistenzregel). Datenschutz-Invarianten unberührt.

Alle 7 Gates grün: tsc · claimcheck 63 · **vitest 308/308** (v3_46: 302 → +6) ·
eslint · build Exit 0 · audit 0 · PDF 4/4.

---

## Was sich geändert hat (`app/karte/[token]/page.tsx`)

- **Sekundär-Archetyp geladen** (`secondary_archetype_id` → name_de, short_trait) und auf
  der Karte als „Starke Zweittendenz: {Name}" gezeigt (§16).
- **Mischprofil-bewusst:** Quelle ist der in finalize gespeicherte `signature.profile.type`
  (kein Neuberechnen, §24). Bei Mischprofil: Kicker „Coachingprofil · Mischprofil" +
  „Mischprofil mit {Zweittendenz}". Alt-Assessments ohne gespeicherten Typ → sauberer
  Fallback auf „dominant".
- **§16-konform genau zwei Stärken** auf der Karte (vorher bis zu drei).
- Weiterhin als **„Coaching-Hypothese, keine Diagnose"** gerahmt.

## Datenschutz (geprüft, §16 + §25)

Auf der Karte erscheinen **keine** Scores, **keine** Team-/Fremdbildwerte, **keine**
E-Mail. Neu geladen werden nur Archetyp-Labels (Sekundärname/-Trait) und der Profil-Typ
(`dominant`/`mixed`) — keine numerischen Werte werden gerendert. Per Test abgesichert.

## Bewusst NICHT in diesem Baustein (größere §16-Features, eigener Track)

Diese §16-Punkte gehen über den Mischprofil-Konsistenzabschluss hinaus und sind eigene
Features (im Dokument teils selbst als „später möglich" markiert):
- **Foto-Upload + automatische Freistellung** (§16 „Optionaler Foto-Look", ausdrücklich später)
- **QR-Code** zum Mini-Check auf der Karte
- **Granulare Vorab-Kontrolle** (Name/Foto/QR ein-/ausblenden, Profil privat/öffentlich)
- Mehrere Export-Formate (Story/Post/LinkedIn) als gerenderte Bilddateien

---

## Gate-Ergebnisse v3_47

| Gate | Ergebnis |
| --- | --- |
| `tsc --noEmit` | ✅ 0 Fehler |
| claimcheck | ✅ 63 Dateien |
| vitest | ✅ **308/308** (neu: `coach-card-v3-47.test.ts`, +6) |
| eslint | ✅ keine Warnungen/Fehler |
| `next build` | ✅ Exit 0 (`/karte/[token]` kompiliert) |
| `npm audit --omit=dev` | ✅ 0 vulnerabilities |
| PDF | ✅ 4/4 |

---

## RELEASE 1 — ABGESCHLOSSEN

| Baustein | Version | Status |
| --- | --- | --- |
| Mischprofile (§9/§10) | v3_44 | ✅ |
| Treffer-Feedback (§27) | v3_45 | ✅ |
| Gestaffelte Wow-Enthüllung (§8 Ablauf D) | v3_46 | ✅ |
| Coach-Card-Pass: Zweittendenz + Mischprofil (§16) | v3_47 | ✅ |

Damit ist das Ziel von Release 1 erreicht: der „Das bin ich"-Moment ist gebaut,
mischprofil-korrekt und über die ganze Oberfläche konsistent — und seine Wirkung ist
messbar.

**Nächstes: Release 2 — Aktionsbereich** (§11/§12/§24), im Dokument „die wichtigste
Weiterentwicklung der gesamten App": `action_plans` + `action_checkins`, Fokus auf dem
Dashboard, 7-Tage-Schleife. Das ist der Schritt von „verstehen" zu „umsetzen".

## Hinweis

Keine neue Migration in v3_47 (Stand bleibt 01 → 41). Die Coach-Card-Änderung ist rein
serverseitig-render + Datenladung; nichts am Schema.
