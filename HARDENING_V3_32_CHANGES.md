# CoachCheck — Änderungen v3_32

**Fokus:** Drittes externes Review. Zwei valide Punkte (RPC-Leak auf DB-Ebene,
Zitate) — beide erledigt und gegen echte DB/Primärquellen bewiesen. Dazu eine
**von mir selbst gefundene Regression aus v3_31**, die kein Gate gefangen hätte.

---

## 0) Regression aus v3_31 gefunden und behoben (kritisch)

### Befund
In v3_31 habe ich `items_read_auth` entfernt (richtig fürs IP-Leak). Dadurch kann
der RLS-/Browser-Client die `items`-Tabelle nicht mehr lesen — **auch nicht über
einen eingebetteten Join** (`answers … item:items(axis_weights,…)`). Drei
Server-Lesepfade liefen aber noch über den User-Client:

- `finalize/route.ts` — Antworten + Item-Gewichte fürs **Scoring**
- `report/route.ts` — Modul-Durchschnitte
- `result/page.tsx` — Führungsreife-Anzeige

Folge: `axis_weights` kam als **null** zurück → **Scoring/Reife wären falsch
gewesen**. tsc, vitest, Build, Lint waren alle grün — genau das Loch, das nur ein
echter End-to-End-Lauf zeigt.

### Empirisch bewiesen (echte DB)
```
authenticated, answers+items-Embed → axis_weights = null   ← war kaputt
service_role  (admin),    dito     → axis_weights = vorhanden ← Fix
```

### Fix
Die drei Lesepfade lesen den Item-Join jetzt über `service_role` (admin),
**nachdem** die Eigentümerschaft (id + user_id) geprüft wurde. Doppelte
admin-Deklaration in finalize entfernt.

---

## 1) RPCs liefern keine Scoring-Metadaten mehr (Review-Punkt, DB-Ebene)

### Befund (korrekt)
`get_items_for_assessment` / `get_items_for_invitation` gaben `setof public.items`
zurück. Ein **direkter** RPC-Aufruf lieferte damit weiterhin `axis_weights`,
`reverse_scored`, Optionsgewichte, `package_tiers`, `active`, `player_item`,
`created_at`. Der Client-Sanitizer (v3_31) wirkte nur auf der React-Seite und
verhinderte das nicht.

### Fix — `30_rpc_strip_scoring_metadata.sql`
Beide RPCs per DROP+CREATE auf einen **restriktiven** Rückgabetyp umgestellt
(CREATE OR REPLACE kann den Rückgabetyp nicht ändern):
```
returns table (id, code, module_code, submodule, format, text_de, options)
```
`options` wird über die neue `strip_option_weights(jsonb)` auf **key/text**
reduziert. Eigentums-/Invitation-Logik aus 26/29 bleibt erhalten.

### Bewiesen (echte DB)
```
RPC-Rückgabetyp (pg_get_function_result):
  TABLE(id integer, code text, module_code text, submodule text,
        format text, text_de text, options jsonb)            ✓ keine Scoring-Spalte

select axis_weights from get_items_for_assessment(<uuid>)
  → ERROR: column "axis_weights" does not exist               ✓ nicht abrufbar
options eines forced_choice-Items → nur [{key,text}, …]       ✓ keine Gewichte
legit: id/format/options + 103 Items (Tier 2)                 ✓ funktioniert
```
Caller verifiziert: assessment-Page + einschaetzung/teamcheck (nur Anzeige via
Sanitizer), finalize-Vollständigkeit (id+format), invitation-complete (nur id).
Scoring liest Items ohnehin separat über admin.

### Regressionstest
`tests/rpc-no-scoring-leak.test.ts`: nagelt den restriktiven Rückgabetyp fest
(keine verbotenen Spalten im `returns table`), prüft `strip_option_weights` und
die Migrations-Assertion.

---

## 2) Wissenschaftliche Zitate korrigiert (Review-Punkt, gegen Primärquellen geprüft)

Diesmal **verifiziert** (nicht auf Zuruf): per Recherche an den Originalquellen
bestätigt und in `components/landing/science-foundation.tsx` korrigiert:

- **Cooke et al. (2024)** ist eine **qualitative Studie** (sechs Fokusgruppen;
  Fußball, Boxen, Feldhockey, Schwimmen) — **kein** Review. Label „(Review)" →
  „(qualitative Studie)", Evidenz A- → B+ (einer Fokusgruppen-Studie angemessen).
  *International Sport Coaching Journal 12(3), 490–502.*
- **Vella et al. (2024)** als der tatsächliche **systematische Review &
  Konzeptanalyse** (67 Studien) ergänzt (A-).
  *International Review of Sport and Exercise Psychology 17(1), 516–539.*
- **Glandorf et al.** Jahr **2022 → 2023** (online 25.06.2023), Label „Review &
  Meta-Analyse".
  *International Review of Sport and Exercise Psychology (2023).*

Test `tests/rpc-no-scoring-leak.test.ts` deckt die Zitate mit ab (Cooke ≠ Review,
Vella vorhanden, Glandorf 2023).

---

## Gates (alle grün — echter Code + echte DB)
```
tsc ✓ · claimcheck ✓ 52 · vitest ✓ 96 (vorher 89) · eslint ✓
next build ✓ EXIT 0, 9/9 · npm audit (omit dev) ✓ 0 · PDF ✓ 3/3
Migrationen 01–30 ✓ frisch von null, alle Assertionen grün
RPC-Rückgabetyp ✓ ohne Scoring-Spalten · axis_weights via RPC nicht abrufbar
Scoring-Regression ✓ behoben (admin-Pfad liest Gewichte, RLS-Lockdown bleibt)
```

## Ehrlicher Reststand (unverändert offen — eure/Live-Entscheidung)
Die zwei kritischen Sicherheitsblöcke (Paywall v3_30, RLS v3_31) **und** der
RPC-Leak sind jetzt zu. Was sachlich noch zwischen „kontrolliert verkaufbar" und
„breit beworben unter Last" steht:

1. **Echter End-to-End-Stripe-Testkauf** durch die ganze Kette (das offene
   `tests/e2e/purchase-flow.spec.ts` ist noch `test.fixme`). Genau diese Lücke hat
   die v3_31-Scoring-Regression durchrutschen lassen — Gates allein finden sie nicht.
2. **Job-Queue/Worker** für die Reportgenerierung (aktuell ein 120-s-Request →
   Timeout-Risiko bei Last).
3. **Erfolgreicher vollständiger Vercel-Produktionsdeploy** als Nachweis (der
   „Collecting page data"-Hänger tritt nur in fremden Prüfumgebungen auf; hier
   baut es 9/9 grün — ein echter Deploy ist trotzdem der einzig gültige Beweis).

Bewusst nicht angefasst: Rechnungs-/Steuerlogik, juristische Freigabe der
Widerruf-Formulierung, AVV/SCCs, Log-Retention-Implementierung.

## Deployment
Migrationen **26–30** auf Supabase einspielen. Nach 30 prüfen:
`pg_get_function_result` beider RPCs enthält **kein** `axis_weights`. Stripe-Webhook
zusätzlich für `charge.refunded` und `charge.dispute.created` abonnieren.
