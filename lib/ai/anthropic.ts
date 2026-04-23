import Anthropic from '@anthropic-ai/sdk';

export function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const REPORT_MODEL = 'claude-opus-4-20250514';
