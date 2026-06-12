-- ============================================================
-- MIGRATION 04 — STORAGE BUCKET FÜR PDF-REPORTS
-- ============================================================
-- Erzeugt einen privaten Bucket, in den die Premium-PDFs hochgeladen werden.
-- Zugriff auf Dateien erfolgt ausschließlich über signierte URLs (7 Tage gültig).
-- ============================================================

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

-- RLS Policies für storage.objects
-- Owner kann eigene Reports lesen
create policy "reports_owner_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service-Role schreibt (passiert im API-Endpoint, daher keine eigene Policy nötig)
-- Die service_role bypasst RLS automatisch.
