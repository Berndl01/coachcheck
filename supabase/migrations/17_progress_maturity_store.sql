-- ============================================================
-- MIGRATION 17 — VERLAUFS-SPEICHER (Re-Check / Fortschritt)
-- ============================================================
--
-- Damit ein Trainer beim erneuten Check seinen Fortschritt sieht
-- ("Konfliktreife 55 % → 68 %"), speichern wir die berechnete
-- Führungsreife dauerhaft am Assessment. Die Achsen (axis_scores)
-- liegen bereits vor; hier kommt die zweite Schicht (maturity) dazu.
--
-- Additiv & idempotent. Bestehende Assessments behalten NULL und
-- fallen im Vergleich automatisch auf reinen Achsen-Vergleich zurück.
-- ============================================================

alter table public.assessments
  add column if not exists maturity_scores jsonb;

comment on column public.assessments.maturity_scores is
  'Führungsreife je Dimension (0..1), berechnet beim Finalisieren. Basis für den Verlaufs-/Re-Check-Vergleich.';

-- ============================================================
-- DONE. Wird ab sofort beim Finalisieren befüllt
-- (app/api/assessment/[id]/finalize/route.ts).
-- ============================================================
