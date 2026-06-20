import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

const REVEAL = read('components', 'assessment', 'result-reveal.tsx');
const RESULT = read('app', 'assessment', '[id]', 'result', 'page.tsx');

// ============================================================
// Wow-Enthüllung: 5 Bildschirme (Bestcase §8 Ablauf D)
// ============================================================
describe('ResultReveal · 5 gestaffelte Bildschirme', () => {
  it('ist Client-Component', () => {
    expect(REVEAL).toMatch(/'use client'/);
  });

  it('deckt die fünf vorgeschriebenen Bildschirme ab', () => {
    expect(REVEAL).toMatch(/Führungsprofil/);          // 1 Profil
    expect(REVEAL).toMatch(/Was dich stark macht/);    // 2 Stärken
    expect(REVEAL).toMatch(/Was unter Druck passieren kann/); // 3 Druck
    expect(REVEAL).toMatch(/So kann dein Team dich erleben/);  // 4 Team
    expect(REVEAL).toMatch(/Dein nächster sinnvoller Schritt/); // 5 nächster Schritt
  });

  it('Bildschirm 1 ist mischprofil-bewusst', () => {
    expect(REVEAL).toMatch(/isMixed/);
    expect(REVEAL).toMatch(/Mischprofil aus/);
  });

  it('Team-Bildschirm rahmt ausdrücklich als Hypothese (kein echtes Fremdbild)', () => {
    expect(REVEAL).toMatch(/Hypothese aus deinem Selbstbild/);
    expect(REVEAL).toMatch(/noch kein echtes Fremdbild/);
  });

  it('Druck-Bildschirm ist nicht verurteilend', () => {
    expect(REVEAL).toMatch(/Kein Urteil/);
  });

  it('nächster Schritt ist auf 7 Tage gerahmt', () => {
    expect(REVEAL).toMatch(/7 Tage/);
  });

  it('hat Fortschritt, Weiter und Überspringen', () => {
    expect(REVEAL).toMatch(/\/ \{total\}/);
    expect(REVEAL).toMatch(/Weiter/);
    expect(REVEAL).toMatch(/Überspringen/);
  });

  it('Wiederkehrer starten eingeklappt (localStorage je Assessment)', () => {
    expect(REVEAL).toMatch(/cc_reveal_\$\{assessmentId\}/);
    expect(REVEAL).toMatch(/localStorage\.getItem/);
    expect(REVEAL).toMatch(/localStorage\.setItem/);
  });
});

// ============================================================
// Result-Seite: Reveal ersetzt statischen Hero, deterministische Props
// ============================================================
describe('Result-Seite · Reveal-Einbindung', () => {
  it('importiert und rendert ResultReveal', () => {
    expect(RESULT).toMatch(/from '@\/components\/assessment\/result-reveal'/);
    expect(RESULT).toMatch(/<ResultReveal/);
  });

  it('speist den Reveal deterministisch (Signatur + Bedienungsanleitung)', () => {
    expect(RESULT).toMatch(/reading=\{signature\.reading\}/);
    expect(RESULT).toMatch(/strengths=\{manual\.staerken\}/);
    expect(RESULT).toMatch(/nextLever=\{signature\.lever\}/);
    expect(RESULT).toMatch(/underPressure=\{signature\.underPressure\}/);
  });

  it('der alte statische Hero ist ersetzt (kein „Primärer Archetyp"-Block mehr)', () => {
    expect(RESULT).not.toMatch(/Primärer Archetyp/);
  });
});
