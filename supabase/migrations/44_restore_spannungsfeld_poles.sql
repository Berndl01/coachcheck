-- =====================================================================
-- 44_restore_spannungsfeld_poles.sql
-- =====================================================================
-- v3.32 (Migration 30) hat die an den Client gelieferten Options-Objekte
-- ueber strip_option_weights() auf {key,text} reduziert, um Scoring-
-- Gewichte nicht zu leaken. Dabei gingen auch die Pol-Beschriftungen
-- (left/right) der Spannungsfeld-Items verloren.
--
-- left/right sind aber reine ANZEIGE-Daten: ohne sie sieht der Trainer im
-- Fragebogen einen Regler ("Bewege den Regler zwischen den Polen"), aber
-- KEINE Pole. Das betrifft jedes Spannungsfeld-Item in allen Frage-Flows.
--
-- Diese Migration stellt left/right wieder her und haelt die Scoring-
-- Metadaten (Options-Gewichte UND die Achse `axis`) weiterhin zurueck.
-- Da get_items_for_assessment / get_items_for_invitation diese Funktion
-- aufrufen, wirkt die Korrektur in BEIDEN RPCs (Selbstbild- und Token-Flows).
-- Idempotent: create or replace + self-pruefender DO-Block.
-- =====================================================================

create or replace function public.strip_option_weights(opts jsonb)
returns jsonb language sql immutable as $$
  select case
    when opts is null then null
    else (
      select jsonb_agg(
        -- Anzeige behalten: key/text (Auswahl-Optionen) + left/right (Spannungsfeld-Pole).
        -- Scoring-Metadaten (Optionsgewichte, `axis`) bleiben entfernt (IP-Schutz).
        jsonb_strip_nulls(jsonb_build_object(
          'key',   o->>'key',
          'text',  o->>'text',
          'left',  o->>'left',
          'right', o->>'right'
        ))
      )
      from jsonb_array_elements(opts) o
    )
  end;
$$;

-- Selbsttest: Spannungsfeld-Pole muessen erhalten bleiben, axis/Gewichte nicht.
do $$
declare
  sample   jsonb := '[{"left":"Struktur","right":"Flexibilität","axis":"standardisierung_anpassung","weights":{"x":1}}]'::jsonb;
  stripped jsonb := public.strip_option_weights(sample);
  o        jsonb := stripped->0;
begin
  if (o->>'left') is distinct from 'Struktur' or (o->>'right') is distinct from 'Flexibilität' then
    raise exception 'strip_option_weights entfernt faelschlich die Spannungsfeld-Pole (left/right)';
  end if;
  if o ? 'axis' or o ? 'weights' then
    raise exception 'strip_option_weights leakt weiterhin Scoring-Metadaten (axis/weights)';
  end if;
end $$;
