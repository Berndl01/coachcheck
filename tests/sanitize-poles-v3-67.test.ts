import { describe, it, expect } from 'vitest';
import { sanitizeItemsForClient } from '@/lib/utils/sanitize-items';

/**
 * v3_67: Spannungsfeld-Items tragen ihre Pol-Beschriftungen in options[0]
 * (left/right). Der Client-Sanitizer muss diese Anzeige-Felder durchreichen,
 * darf aber Scoring-Metadaten (axis + Optionsgewichte) NICHT an den Browser geben.
 * Ohne left/right sieht der Trainer im Fragebogen einen Regler ohne Pole.
 */
describe('sanitizeItemsForClient — Spannungsfeld-Pole', () => {
  const raw = [
    {
      id: 7,
      code: 'A_id_07',
      module_code: 'A',
      submodule: 'identitaet',
      format: 'spannungsfeld',
      text_de: 'Wo verortest du deinen Führungsstil aktuell zwischen diesen Polen?',
      options: [{ left: 'Struktur', right: 'Flexibilität', axis: 'standardisierung_anpassung', weights: { x: 1 } }],
      // Scoring-Metadaten auf Item-Ebene (dürfen nie raus):
      axis_weights: { standardisierung_anpassung: 1.0 },
      reverse_scored: false,
    },
  ];

  it('reicht left/right durch (Pole werden im Slider angezeigt)', () => {
    const [item] = sanitizeItemsForClient(raw);
    expect(item.options?.[0]?.left).toBe('Struktur');
    expect(item.options?.[0]?.right).toBe('Flexibilität');
  });

  it('strippt die Achse und Optionsgewichte (IP-Schutz)', () => {
    const [item] = sanitizeItemsForClient(raw);
    const opt = item.options?.[0] as Record<string, unknown>;
    expect(opt).not.toHaveProperty('axis');
    expect(opt).not.toHaveProperty('weights');
  });

  it('gibt keine Item-Scoring-Metadaten weiter', () => {
    const [item] = sanitizeItemsForClient(raw) as unknown as Record<string, unknown>[];
    expect(item).not.toHaveProperty('axis_weights');
    expect(item).not.toHaveProperty('reverse_scored');
  });

  it('Auswahl-Optionen (key/text) bleiben unverändert, ohne leere left/right', () => {
    const likert = [{
      id: 1, code: 'B_ko_01', module_code: 'B', submodule: 'kommunikation', format: 'forced_choice',
      text_de: 'Frage', options: [{ key: 'a', text: 'Antwort A', weights: { x: 1 } }],
    }];
    const [item] = sanitizeItemsForClient(likert);
    expect(item.options?.[0]).toEqual({ key: 'a', text: 'Antwort A' });
  });
});
