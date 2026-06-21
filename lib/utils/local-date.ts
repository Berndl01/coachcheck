/**
 * Lokales Kalenderdatum (YYYY-MM-DD) in einer bestimmten Zeitzone.
 *
 * Hintergrund: `new Date().toISOString().slice(0,10)` liefert das UTC-Datum und
 * kann in Österreich rund um Mitternacht den falschen Kalendertag ergeben
 * (z. B. 23:30 lokal = bereits nächster Tag in UTC). Für tagesgebundene Logik
 * wie Check-ins muss das Datum nach der Zeitzone des Nutzers bestimmt werden.
 *
 * Default ist Europe/Vienna (Kernzielgruppe). Sobald `profiles.timezone`
 * existiert, kann die Zeitzone pro Nutzer übergeben werden.
 */
export function localDateISO(timeZone: string = 'Europe/Vienna', now: Date = new Date()): string {
  // en-CA liefert das ISO-Format YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
