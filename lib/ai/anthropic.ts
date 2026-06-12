import Anthropic from '@anthropic-ai/sdk';

export function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Premium-Reports nutzen Opus 4.7 (aktuelle Anthropic-Top-Klasse).
// Für Routine-Tasks wie Archetyp-Personalisierung wäre Sonnet 4.6 günstiger,
// aber Premium-Diagnostik-Berichte profitieren spürbar von Opus.
// Report-Modell per ENV überschreibbar (z. B. Migration auf claude-opus-4-8).
// Default bleibt das bisher getestete Modell — kein Verhaltenswechsel ohne ENV.
export const REPORT_MODEL = process.env.ANTHROPIC_REPORT_MODEL ?? 'claude-opus-4-7';
