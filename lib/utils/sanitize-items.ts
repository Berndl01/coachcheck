import type { Item } from '@/components/assessment/item-renderer';

/**
 * Entfernt Scoring-Metadaten aus den RPC-Item-Zeilen, bevor sie an den Client-
 * Runner gehen (IP-Schutz). Der Browser erhält nur Anzeige-Daten:
 * id, code, module_code, submodule, format, text_de und options (key/text).
 * axis_weights, reverse_scored und die Options-Gewichte bleiben serverseitig.
 */
export function sanitizeItemsForClient(rawItems: unknown): Item[] {
  const arr = Array.isArray(rawItems) ? rawItems : [];
  return arr.map((raw) => {
    const it = raw as Record<string, unknown>;
    const rawOptions = Array.isArray(it.options) ? (it.options as Array<Record<string, unknown>>) : null;
    return {
      id: Number(it.id),
      code: String(it.code ?? ''),
      module_code: String(it.module_code ?? ''),
      submodule: (it.submodule as string | null) ?? null,
      format: String(it.format ?? ''),
      text_de: String(it.text_de ?? ''),
      options: rawOptions
        ? rawOptions.map((o) => ({ key: String(o.key ?? ''), text: String(o.text ?? '') }))
        : null,
    };
  });
}
