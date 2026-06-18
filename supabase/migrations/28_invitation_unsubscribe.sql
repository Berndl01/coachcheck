-- ============================================================
-- MIGRATION 28 — FUNKTIONIERENDE ABMELDUNG FÜR EINLADUNGS-E-MAILS
-- ============================================================
--
-- BEFUND (v3_30-Audit): Die Einladungsmail setzt einen One-Click-Unsubscribe-
-- Header und einen sichtbaren Abmeldelink (/einschaetzung/<token>?unsubscribe=1),
-- aber die Zielseite verarbeitete den Parameter nicht — der Link meldete
-- niemanden ab. Ein gesetzter List-Unsubscribe-Header, der nichts tut, ist
-- gegenüber Mailprovidern (Gmail/Yahoo One-Click-Anforderung) und rechtlich
-- problematisch.
--
-- FIX: dedizierte Spalte unsubscribed_at. Die Einschätzungsseite setzt sie bei
-- ?unsubscribe=1 (zusätzlich status='expired', damit get_items_for_invitation
-- keine Items mehr ausliefert), und der Versand-Endpunkt verweigert danach den
-- Versand an diesen Empfänger.
-- ============================================================

alter table public.invitations
  add column if not exists unsubscribed_at timestamptz;

create index if not exists idx_invitations_unsubscribed
  on public.invitations (unsubscribed_at)
  where unsubscribed_at is not null;
